import { connectDB } from "@/lib/db";
import { searchCatalogProducts } from "@/modules/products/catalog-search";
import { runCompareAgent } from "@/modules/ai/compare-agent";
import { normalizeQuote, recommendQuote, type RawQuote } from "@/lib/quote-normalize";
import { Quotation } from "@/modules/rfqs/rfq.model";
import { Conversation, Message, Notification } from "@/modules/platform/platform.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { HukumSession } from "./session.model";
import { extractNeedSlots, missingNeedSlots, needSummary } from "./need-extract";
import { normalizeBuyerText } from "./locale-normalize";
import {
  assertGroundedProducts,
  rotateFeatured,
  canRevealContact,
  detectEscalation,
} from "./guardrails";
import type {
  HukumChannel,
  HukumStep,
  HukumTurnResult,
  NeedSlots,
  PendingOutbound,
  ShortlistItem,
} from "./types";

const APP = () => (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

function loc(locale: string, path: string) {
  return `${APP()}/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

function scoreItem(p: {
  verified?: boolean;
  city?: string;
  needCity?: string;
  priceLabel?: string;
  paidPriority?: boolean;
}): number {
  let s = 0;
  if (p.verified) s += 4;
  if (p.needCity && p.city && p.city.toLowerCase() === p.needCity.toLowerCase()) s += 3;
  if (p.priceLabel && !/request|طلب/i.test(p.priceLabel)) s += 2;
  if (p.paidPriority) s += 1; // labelled priority only — never hide label
  return s;
}

async function groundedShortlist(need: NeedSlots, locale: string): Promise<ShortlistItem[]> {
  const q =
    [need.category?.replace(/_/g, " "), need.specs, need.rawText?.split("|").pop()?.trim()]
      .filter(Boolean)
      .join(" ")
      .slice(0, 120) || "safety";
  let result = await searchCatalogProducts({
    q,
    city: need.city,
    limit: 12,
    page: 1,
  });
  // Soften city only — never invent unrelated catalogue (no soft "helmet" fallback)
  if (!(result.items || []).length && need.city) {
    result = await searchCatalogProducts({ q, limit: 12, page: 1 });
  }
  const items = (result.items || []) as Array<{
    _id: unknown;
    name?: { en?: string; ar?: string };
    slug?: { en?: string; ar?: string };
    price?: number;
    currency?: string;
    priceType?: string;
    featured?: boolean;
    vendorId?: {
      _id?: unknown;
      legalName?: { en?: string; ar?: string };
      tradeName?: string;
      location?: { city?: string };
      verificationStatus?: string;
      featured?: boolean;
    };
  }>;

  const mapped: ShortlistItem[] = items.map((p) => {
    const name = locale === "ar" ? p.name?.ar || p.name?.en : p.name?.en || p.name?.ar || "Product";
    const slug = p.slug?.en || p.slug?.ar || String(p._id);
    const priceLabel =
      p.priceType === "price_on_request" || p.price == null
        ? locale === "ar"
          ? "السعر عند الطلب"
          : "Price on request"
        : `${p.price} ${p.currency || "SAR"}`;
    const vendorName =
      (locale === "ar" ? p.vendorId?.legalName?.ar : p.vendorId?.legalName?.en) ||
      p.vendorId?.tradeName ||
      undefined;
    const city = p.vendorId?.location?.city;
    const verified = p.vendorId?.verificationStatus === "verified";
    const paidPriority = Boolean(p.featured || p.vendorId?.featured);
    return {
      productId: String(p._id),
      vendorId: p.vendorId?._id ? String(p.vendorId._id) : undefined,
      name: name || "Product",
      slug,
      href: loc(locale, `/products/${slug}`),
      priceLabel,
      vendorName,
      city,
      verified,
      paidPriority,
      score: scoreItem({ verified, city, needCity: need.city, priceLabel, paidPriority }),
    };
  });

  const grounded = assertGroundedProducts(mapped.sort((a, b) => b.score - a.score));
  return rotateFeatured(grounded).slice(0, 5);
}

function uid() {
  return `ob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function runHukumTurn(opts: {
  sessionId?: string;
  message: string;
  locale?: "en" | "ar";
  channel?: HukumChannel;
  phone?: string;
  waId?: string;
  userId?: string | null;
  action?: string;
}): Promise<HukumTurnResult> {
  await connectDB();
  const locale = opts.locale === "ar" ? "ar" : "en";
  const isAr = locale === "ar";
  const channel = opts.channel || "web";
  const { normalized, original } = normalizeBuyerText(opts.message);
  const message = normalized || original;

  let session = opts.sessionId
    ? await HukumSession.findById(opts.sessionId)
    : null;

  if (!session && opts.waId) {
    session = await HukumSession.findOne({ waId: opts.waId }).sort({ updatedAt: -1 });
  }
  if (!session && opts.phone) {
    session = await HukumSession.findOne({ phone: opts.phone }).sort({ updatedAt: -1 });
  }

  if (!session) {
    session = await HukumSession.create({
      channel,
      locale,
      step: "start",
      phone: opts.phone || "",
      waId: opts.waId || "",
      userId: opts.userId || undefined,
      need: {},
      shortlist: [],
      history: [],
    });
  }

  if (opts.userId) session.userId = opts.userId as never;
  if (opts.phone) session.phone = opts.phone;
  if (opts.waId) {
    session.waId = opts.waId;
    session.lastWaInboundAt = new Date();
  }
  session.locale = locale;
  session.channel = channel;

  const guardrailNotes: string[] = [];
  // Explicit actions from UI chips
  const action = String(opts.action || "").trim();

  if (action === "clear_memory") {
    session.history = [];
    session.need = undefined;
    session.shortlist = [];
    session.selectedProductIds = [];
    session.pendingOutbound = undefined;
    session.step = "start";
    session.escalated = false;
    session.escalateReason = undefined;
    session.memoryClearedAt = new Date();
    await session.save();
    const reply = isAr
      ? "تم مسح ذاكرة Hukum لهذه الجلسة (الاحتياج، الموردين، السجل). يمكنك البدء من جديد."
      : "Hukum memory cleared for this session (need, suppliers, history). You can start fresh.";
    return {
      sessionId: String(session._id),
      step: "start",
      reply,
      followUps: isAr
        ? ["أحتاج خوذات سلامة في الرياض"]
        : ["I need safety helmets in Riyadh"],
      suggestedLinks: [],
      source: "hukum",
      guardrailNotes: ["memory_cleared"],
      actions: [{ id: "confirm_need", label: isAr ? "ابدأ من جديد" : "Start again" }],
    };
  }

  const escalate = detectEscalation(message);
  if (escalate) {
    session.step = "escalated";
    session.escalated = true;
    session.escalateReason = escalate;
    session.history.push({ role: "user", content: original, at: new Date() });

    let ticketKey = "";
    try {
      const { createSupportThread } = await import("@/modules/messaging/thread-service");
      if (opts.userId) {
        const { conversation, ticket } = await createSupportThread({
          userId: String(opts.userId),
          requesterLabel: session.name || session.company || session.phone || "Buyer",
          topic: isAr ? "تصعيد Hukum" : "Hukum escalation",
          body: `${escalate}: ${original}`.slice(0, 2000),
          hukumSessionId: String(session._id),
          contextSnapshot: {
            need: session.need,
            shortlist: (session.shortlist || []).slice(0, 8),
            step: session.step,
            channel,
            historyTail: (session.history || []).slice(-10),
          },
          locale,
        });
        session.supportTicketId = ticket._id as never;
        session.supportConversationId = conversation._id as never;
        ticketKey = ticket.ticketKey;
      }
    } catch {
      /* ticket best-effort */
    }

    const reply = isAr
      ? `حوّلتك لموظف بشري مع كامل السياق.${ticketKey ? ` التذكرة ${ticketKey}.` : ""} يظهر SLA على محادثة الدعم.`
      : `Handing you to a human specialist with full context.${ticketKey ? ` Ticket ${ticketKey}.` : ""} Support thread shows SLA.`;
    session.history.push({ role: "assistant", content: reply, at: new Date() });
    await session.save();
    await recordAnalyticsEvent({
      type: "hukum_escalated",
      userId: opts.userId || undefined,
      meta: { reason: escalate, sessionId: String(session._id), channel, ticketKey },
    }).catch(() => undefined);
    return {
      sessionId: String(session._id),
      step: "escalated",
      reply,
      escalated: true,
      followUps: [],
      suggestedLinks: [
        { label: isAr ? "تذاكر الدعم" : "Support tickets", href: loc(locale, "/buyer/tickets") },
        { label: isAr ? "صندوق الوارد" : "Inbox", href: loc(locale, "/buyer/messages") },
      ],
      source: "hukum",
      guardrailNotes: ["escalation", "support_handover"],
    };
  }

  if (action === "pdpl_consent") {
    session.pdplConsent = true;
    session.pdplConsentAt = new Date();
    // PDPL alone never verifies phone — OTP / signed-in session required (risk C1).
    // Resume journey — don't wipe progress
    if ((session.shortlist || []).length) session.step = "contact";
    else if (session.need && (session.need as NeedSlots).category) session.step = "shortlist";
    else session.step = "understand";
  }
  if (action === "confirm_need") {
    session.step = "shortlist";
  }
  if (action === "approve_outreach" && session.pendingOutbound?.status === "awaiting_buyer_approval") {
    session.pendingOutbound.status = "approved";
    session.step = "contact";
  }
  if (action === "cancel_outreach" && session.pendingOutbound) {
    session.pendingOutbound.status = "cancelled";
  }

  session.history.push({ role: "user", content: original, at: new Date() });
  let step = (session.step || "start") as HukumStep;
  const prevNeed = (session.need && typeof session.need === "object"
    ? JSON.parse(JSON.stringify(session.need))
    : {}) as NeedSlots;
  // Don't let short action labels wipe extracted slots
  const mergeFrom =
    action && message.length < 24 && !/\d/.test(message) ? prevNeed : extractNeedSlots(message, prevNeed);
  let need = { ...prevNeed, ...mergeFrom, rawText: prevNeed.rawText || mergeFrom.rawText };
  if (!need.category && prevNeed.category) need = { ...need, ...prevNeed };
  session.need = need;

  // Identify gate: signed-in OR (phone OTP + PDPL); allow browse earlier
  const identity = canRevealContact({
    phoneVerified: session.phoneVerified,
    pdplConsent: session.pdplConsent,
    userId: session.userId ? String(session.userId) : opts.userId,
    channel: opts.channel === "whatsapp" ? "whatsapp" : "web",
    revealCountToday: session.revealCountToday,
    revealDayKey: session.revealDayKey,
  });

  // Name/company capture during identify
  if (step === "identify" || (!session.name && /^(i'?m|my name is|اسمي)\s+/i.test(message))) {
    const nameM = message.match(/(?:i'?m|my name is|اسمي)\s+(.+)/i);
    if (nameM) session.name = nameM[1].slice(0, 80);
    const coM = message.match(/(?:company|شركة)\s*[:=]?\s*(.+)/i);
    if (coM) session.company = coM[1].slice(0, 120);
  }

  let reply = "";
  let products: ShortlistItem[] = ((session.shortlist || []) as ShortlistItem[]).slice();
  let compareHref: string | undefined;
  let quoteCards: HukumTurnResult["quoteCards"];
  let pendingOutbound: PendingOutbound | null = (session.pendingOutbound as PendingOutbound) || null;
  let followUps: string[] = [];
  let suggestedLinks: { label: string; href: string }[] = [];
  let actions: Array<{ id: string; label: string }> = [];

  // Progress state machine
  if (step === "start") {
    step = identity.identified ? "understand" : "identify";
  }

  if (step === "identify" && !identity.identified && action !== "pdpl_consent") {
    reply = isAr
      ? "مرحباً — أنا وكيل Hukum. للبحث ومقارنة الموردين يمكنك المتابعة. لإرسال طلبات للموردين نحتاج موافقة PDPL ورقم جوال موثّق. اكتب موافقة أو سجّل الدخول."
      : "Hi — I’m the Hukum agent. You can browse and compare suppliers now. To message suppliers we need PDPL consent + a verified phone (or sign-in). Tap Consent or sign in.";
    followUps = isAr
      ? ["أحتاج خوذات سلامة في الرياض", "موافق على PDPL"]
      : ["I need safety helmets in Riyadh", "I consent to PDPL"];
    actions = [
      { id: "pdpl_consent", label: isAr ? "موافقة PDPL" : "PDPL consent" },
    ];
    suggestedLinks = [
      { label: isAr ? "تسجيل / دخول" : "Sign up / Sign in", href: loc(locale, "/register") },
    ];
    if (/consent|pdpl|موافق|موافقة/i.test(message)) {
      session.pdplConsent = true;
      session.pdplConsentAt = new Date();
      // Do not set phoneVerified without OTP (risk C1).
      step = "understand";
    } else if (need.category || need.quantity || need.city || message.length > 12) {
      // Allow understand without identity (gated contact later)
      step = "understand";
    } else {
      session.step = step;
      session.history.push({ role: "assistant", content: reply, at: new Date() });
      await session.save();
      return pack(session, { reply, step, need, followUps, suggestedLinks, actions, guardrailNotes });
    }
  }

  if (step === "understand" || step === "clarify") {
    need = extractNeedSlots(message, need);
    session.need = need;
    const missing = missingNeedSlots(need);
    // Enough signal to search once we have category + (qty or city)
    const searchable = Boolean(need.category && (need.quantity || need.city));
    if (!searchable && missing.length && (need.confidence || 0) < 0.75) {
      step = "clarify";
      const ask = missing[0];
      const prompts: Record<string, { en: string; ar: string }> = {
        category: { en: "What product category do you need (e.g. safety helmets, gloves)?", ar: "ما فئة المنتج المطلوبة (مثل خوذات سلامة، قفازات)؟" },
        quantity: { en: "What quantity do you need?", ar: "ما الكمية المطلوبة؟" },
        city: { en: "Which Saudi city should suppliers cover?", ar: "أي مدينة سعودية للتوريد؟" },
        deadline: { en: "When do you need delivery / quote deadline?", ar: "ما موعد التسليم أو الموعد النهائي للعرض؟" },
      };
      reply = isAr ? prompts[ask].ar : prompts[ask].en;
      if (need.category || need.city || need.quantity) {
        reply += isAr
          ? `\n\nملخص حتى الآن: ${needSummary(need, "ar")}`
          : `\n\nSo far: ${needSummary(need, "en")}`;
      }
      followUps =
        ask === "city"
          ? ["Riyadh", "Jeddah", "Dammam"]
          : ask === "quantity"
            ? ["50", "100", "500"]
            : isAr
              ? ["خوذات سلامة", "قفازات", "معدات سلامة"]
              : ["Safety helmets", "Gloves", "PPE"];
      actions = [{ id: "confirm_need", label: isAr ? "تأكيد والمتابعة" : "Confirm & shortlist" }];
      session.step = step;
      session.history.push({ role: "assistant", content: reply, at: new Date() });
      await session.save();
      return pack(session, { reply, step, need, followUps, actions, guardrailNotes });
    }
    step = "shortlist";
  }

  if (step === "shortlist" || action === "confirm_need") {
    products = await groundedShortlist(need, locale);
    session.shortlist = products as never;
    step = products.length ? "compare" : "clarify";
    if (!products.length) {
      reply = isAr
        ? "لم أجد قوائم مطابقة في قاعدة البيانات. صف المنتج أو المدينة بشكل أوضح — لن أخترع أسعاراً."
        : "No live listings matched in our database. Refine category/city — I never invent prices or suppliers.";
      guardrailNotes.push("grounded_empty");
      try {
        const { recordAnalyticsEvent } = await import("@/lib/analytics");
        await recordAnalyticsEvent({
          type: "ai_search_zero_results",
          userId: opts.userId || undefined,
          meta: {
            q: need.category || need.rawText || "",
            city: need.city,
            sessionId: String(session._id),
            feature: "search",
          },
        });
        const { SearchHistory } = await import("@/modules/platform/platform.model");
        await SearchHistory.create({
          userId: opts.userId || undefined,
          query: String(need.category || need.rawText || "").slice(0, 200),
          locale,
          filters: { city: need.city, source: "hukum_ai_search" },
          resultsCount: 0,
        });
      } catch {
        /* best-effort zero-result log */
      }
      followUps = isAr ? ["خوذات في الرياض", "قفازات"] : ["Helmets in Riyadh", "Gloves"];
      session.step = "clarify";
      session.history.push({ role: "assistant", content: reply, at: new Date() });
      await session.save();
      return pack(session, { reply, step: "clarify", need, followUps, guardrailNotes });
    }
    const lines = products
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} · ${p.priceLabel}${p.vendorName ? ` · ${p.vendorName}` : ""}${
            p.verified ? (isAr ? " · موثّق" : " · verified") : ""
          }${p.paidPriority ? (isAr ? " · أولوية مدفوعة" : " · paid priority") : ""}`
      )
      .join("\n");
    const hasPaid = products.some((p) => p.paidPriority);
    const paidNote = hasPaid
      ? isAr
        ? "\n\nملاحظة إفصاح: بعض النتائج معلَّمة «أولوية مدفوعة» (إعلان مدفوع)."
        : "\n\nDisclosure: some results are labelled “paid priority” (paid promotion)."
      : "";
    reply = isAr
      ? `وجدت ${products.length} منتجات من القوائم الحية (مرتبة حسب الملاءمة/المدينة/التوثيق):\n${lines}${paidNote}\n\nهل تريد مقارنة جنباً إلى جنب أو مراسلة الموردين؟`
      : `Found ${products.length} live listings (ranked by fit / city / verification):\n${lines}${paidNote}\n\nCompare side-by-side, or ask me to message suppliers (needs your approval).`;
    compareHref = loc(locale, `/compare`);
    suggestedLinks = [
      { label: isAr ? "صفحة المقارنة" : "Full compare page", href: compareHref },
      { label: isAr ? "إنشاء RFQ" : "Create RFQ", href: loc(locale, "/rfq") },
    ];
    followUps = isAr
      ? ["قارن الأفضل", "راسل 3 موردين", "أظهر التوصية"]
      : ["Compare top picks", "Message 3 suppliers", "Show recommendation"];
  }

  if (/compare|قارن|side.?by.?side/i.test(message) || step === "compare") {
    step = "compare";
    const ai = runCompareAgent(
      products.map((p) => ({
        id: p.productId,
        name: p.name,
        vendorName: p.vendorName,
        priceLabel: p.priceLabel,
        city: p.city,
        verified: p.verified,
      })),
      needSummary(need, locale),
      locale
    );
    reply = `${ai.reply}\n\n${(ai.tradeoffs || []).slice(0, 4).join("\n")}`;
    compareHref = loc(locale, `/compare`);
    suggestedLinks = [
      { label: isAr ? "مقارنة كاملة" : "Open compare page", href: compareHref },
      ...(ai.questions || []).slice(0, 2).map((q) => ({ label: q.slice(0, 40), href: loc(locale, "/rfq") })),
    ];
    followUps = isAr
      ? ["راسل الموردين", "أظهر عروض الأسعار", "تعديل الكمية"]
      : ["Message suppliers", "Show quotes", "Change quantity"];
    await recordAnalyticsEvent({
      type: "ai_compare_generated",
      meta: { sessionId: String(session._id), bestId: ai.bestId },
    }).catch(() => undefined);
  }

  // Contact / outreach — requires identity + buyer approval
  if (/message|contact|راسل|تواصل|outreach|notify suppliers/i.test(message) || action === "approve_outreach") {
    step = "contact";
    const gate = canRevealContact({
      phoneVerified: session.phoneVerified,
      pdplConsent: session.pdplConsent,
      userId: session.userId ? String(session.userId) : opts.userId,
      channel: opts.channel === "whatsapp" ? "whatsapp" : "web",
      revealCountToday: session.revealCountToday,
      revealDayKey: session.revealDayKey,
    });
    if (!gate.allowed) {
      reply = isAr
        ? `لا يمكن مشاركة بيانات الموردين أو مراسلتهم بعد. ${gate.reason || ""} سجّل الدخول أو أكّد الجوال + موافقة PDPL.`
        : `Supplier contact stays gated. ${gate.reason || ""} Sign in, or verify phone OTP + PDPL.`;
      guardrailNotes.push("gated", "consent_first");
      actions = [{ id: "pdpl_consent", label: isAr ? "موافقة PDPL" : "PDPL consent" }];
      suggestedLinks = [{ label: isAr ? "تسجيل" : "Register", href: loc(locale, "/register") }];
    } else if (action === "approve_outreach" && pendingOutbound?.status === "approved") {
      // Send via Hukum relay only (never dump raw supplier numbers into chat) — risk C1/C2
      const vendorIds = (pendingOutbound.vendorIds || []).slice(0, 5);
      let sent = 0;
      for (const vendorId of vendorIds) {
        const vendor = await Vendor.findById(vendorId).select("ownerUserId legalName tradeName").lean();
        if (!vendor?.ownerUserId) continue;
        const participants = [opts.userId || session.userId, vendor.ownerUserId].filter(Boolean);
        if (participants.length < 2) {
          // Notify seller only if buyer anonymous — still create notification lead
          await Notification.create({
            userId: vendor.ownerUserId,
            type: "hukum_lead",
            title: { en: "New Hukum lead", ar: "عميل محتمل من Hukum" },
            body: {
              en: pendingOutbound.draftMessage.slice(0, 280),
              ar: pendingOutbound.draftMessage.slice(0, 280),
            },
            channel: "in_app",
            meta: {
              sessionId: String(session._id),
              productIds: pendingOutbound.productIds,
              via: "hukum_relay",
            },
          }).catch(() => undefined);
          sent++;
          continue;
        }
        let convo = await Conversation.findOne({
          vendorId,
          participants: { $all: participants },
        });
        if (!convo) {
          convo = await Conversation.create({
            vendorId,
            participants,
            subject: "Hukum buyer enquiry",
            status: "open",
          });
        }
        await Message.create({
          conversationId: convo._id,
          senderId: opts.userId || session.userId,
          body: pendingOutbound.draftMessage,
        });
        await Notification.create({
          userId: vendor.ownerUserId,
          type: "hukum_message",
          title: { en: "Buyer message via Hukum", ar: "رسالة مشتري عبر Hukum" },
          body: { en: pendingOutbound.draftMessage.slice(0, 200), ar: pendingOutbound.draftMessage.slice(0, 200) },
          channel: "in_app",
          meta: { conversationId: String(convo._id), sessionId: String(session._id) },
        }).catch(() => undefined);
        sent++;
      }
      pendingOutbound.status = "sent";
      session.pendingOutbound = pendingOutbound as never;
      const { bumpRevealCount, logContactReveal } = await import("@/modules/risk/contact-gate");
      bumpRevealCount(session, gate.dayKey, sent);
      step = "collect_quotes";
      reply = isAr
        ? `تم إرسال طلبك عبر وسيط Hukum إلى ${sent} موردين (بدون كشف أرقام خام في المحادثة). ستظهر عروضهم كبطاقات منظمة.`
        : `Sent your request via Hukum relay to ${sent} suppliers (raw numbers never exposed in chat). Their replies will appear as structured quote cards.`;
      guardrailNotes.push("human_approved_outbound", "gated_relay", "hukum_first_contact");
      await recordAnalyticsEvent({
        type: "hukum_outreach_sent",
        userId: opts.userId || undefined,
        meta: { sessionId: String(session._id), sent, vendorIds, via: "hukum_relay" },
      }).catch(() => undefined);
      await recordAnalyticsEvent({
        type: "agent_outreach_sent",
        userId: opts.userId || undefined,
        meta: { sessionId: String(session._id), sent, vendorIds, via: "hukum_relay" },
      }).catch(() => undefined);
      await logContactReveal({
        type: "agent_outreach_sent",
        userId: opts.userId || undefined,
        via: "hukum_relay",
        channel: opts.channel || "web",
        meta: { sent, vendorIds, sessionId: String(session._id) },
      });
    } else {
      const top = products.slice(0, 5);
      const vendorIds = [...new Set(top.map((p) => p.vendorId).filter(Boolean))] as string[];
      const draft = isAr
        ? `طلب عبر Hukum: ${needSummary(need, "ar")}. يرجى إرسال عرض سعر منظم (وحدة، ضريبة، توصيل، مدة التوريد).`
        : `Hukum enquiry: ${needSummary(need, "en")}. Please send a structured quote (unit, VAT, delivery, lead time).`;
      pendingOutbound = {
        id: uid(),
        vendorIds: vendorIds.slice(0, 5),
        productIds: top.map((p) => p.productId),
        draftMessage: draft,
        status: "awaiting_buyer_approval",
        createdAt: new Date().toISOString(),
      };
      session.pendingOutbound = pendingOutbound as never;
      reply = isAr
        ? `مسودة رسالة لـ ${pendingOutbound.vendorIds.length} موردين (لن أرسل بدون موافقتك):\n\n«${draft}»\n\nوافق للإرسال عبر وسيط Hukum.`
        : `Draft to ${pendingOutbound.vendorIds.length} suppliers (I will not send without your approval):\n\n“${draft}”\n\nApprove to send via Hukum relay.`;
      actions = [
        { id: "approve_outreach", label: isAr ? "موافقة وإرسال" : "Approve & send" },
        { id: "cancel_outreach", label: isAr ? "إلغاء" : "Cancel" },
      ];
      guardrailNotes.push("human_control");
    }
  }

  // Collect / recommend quotes from DB only
  if (/quote|عرض|recommend|وص[يّ]ة|أفضل/i.test(message) || step === "collect_quotes" || step === "recommend") {
    const qdocs = (await Quotation.find({ status: "submitted" })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("vendorId", "legalName tradeName verificationStatus")
      .lean()) as unknown as RawQuote[];
    if (qdocs.length) {
      const normalized = qdocs.map((q) => normalizeQuote(q, locale));
      const best = recommendQuote(normalized);
      quoteCards = normalized.map((n) => ({
        id: n.id,
        vendorLabel: n.vendorLabel,
        unitPrice: n.unitPrice,
        landedPerUnit: n.landedPerUnit,
        currency: n.currency,
        leadTime: n.leadTime,
        total: n.total,
        recommended: n.id === best,
      }));
      step = "recommend";
      const pick = quoteCards.find((c) => c.recommended);
      reply = isAr
        ? `مقارنة عروض منظمة من قاعدة البيانات فقط${pick ? ` — الأنسب: ${pick.vendorLabel} بتكلفة نهائية ${pick.landedPerUnit} ${pick.currency}/وحدة` : ""}. القبول قرارك أنت فقط.`
        : `Normalized quotes from our database only${pick ? ` — reasoned pick: ${pick.vendorLabel} at landed ${pick.landedPerUnit} ${pick.currency}/unit` : ""}. Accepting a deal is always your decision.`;
      suggestedLinks = [
        { label: isAr ? "عروضك" : "Your quotations", href: loc(locale, "/buyer/quotations") },
      ];
      followUps = isAr ? ["ذكّرني لاحقاً", "إعادة طلب"] : ["Remind me later", "Reorder later"];
      guardrailNotes.push("grounded_quotes", "human_control_decide");
    } else if (step === "collect_quotes" || step === "recommend") {
      reply =
        reply ||
        (isAr
          ? "لا توجد عروض مرسلة بعد في النظام. بعد رد الموردين سأعرض بطاقات منظمة (وحدة، ضريبة، توصيل)."
          : "No submitted quotes in the system yet. When suppliers reply, I’ll show structured cards (unit, VAT, delivery).");
    }
  }

  if (/remind|متابعة|review|تقييم|reorder|إعادة/i.test(message)) {
    step = "decide";
    reply = isAr
      ? "سأضع تذكيرات للمتابعة وإعادة الطلب والتقييم في صندوقك. اختيار المورد ومشاركة بيانات التواصل النهائية يتم بعد قرارك فقط."
      : "I’ll queue follow-up, reorder, and review reminders in your inbox. Final contact sharing happens only after you choose a supplier.";
    suggestedLinks = [
      { label: isAr ? "السجل والتذكيرات" : "History & reminders", href: loc(locale, "/buyer/history") },
      { label: isAr ? "الرسائل" : "Messages", href: loc(locale, "/buyer/messages") },
    ];
  }

  if (!reply) {
    reply = isAr
      ? `فهمت: ${needSummary(need, "ar") || "صف احتياجك (منتج، كمية، مدينة)."}. قل «ابحث» أو «قارن» أو «راسل الموردين».`
      : `Got it: ${needSummary(need, "en") || "describe product, qty, city"}. Say “search”, “compare”, or “message suppliers”.`;
    followUps = isAr
      ? ["ابحث في القوائم", "قارن", "راسل الموردين"]
      : ["Search listings", "Compare", "Message suppliers"];
  }

  session.step = step;
  session.shortlist = products as never;
  if (pendingOutbound) session.pendingOutbound = pendingOutbound as never;
  session.history.push({ role: "assistant", content: reply.slice(0, 4000), at: new Date() });
  if (session.history.length > 40) session.history = session.history.slice(-40);
  await session.save();

  await recordAnalyticsEvent({
    type: "hukum_turn",
    userId: opts.userId || undefined,
    meta: { sessionId: String(session._id), step, channel },
  }).catch(() => undefined);
  if (need && (need.category || need.quantity || need.city || need.rawText)) {
    await recordAnalyticsEvent({
      type: "agent_need_captured",
      userId: opts.userId || undefined,
      meta: {
        sessionId: String(session._id),
        channel,
        category: need.category,
        quantity: need.quantity,
        city: need.city,
      },
    }).catch(() => undefined);
  }

  return pack(session, {
    reply,
    step,
    need,
    products,
    compareHref,
    quoteCards,
    pendingOutbound,
    followUps,
    suggestedLinks,
    actions,
    guardrailNotes,
  });
}

function pack(
  session: { _id: unknown },
  data: Omit<HukumTurnResult, "sessionId" | "source">
): HukumTurnResult {
  return {
    sessionId: String(session._id),
    source: "hukum",
    ...data,
  };
}
