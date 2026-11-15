/**
 * Journey 4 — Reminder & automation matrix.
 */
import { Quotation, RFQ, RFQVendor } from "@/modules/rfqs/rfq.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Notification } from "@/modules/platform/platform.model";
import {
  canSendReminderNow,
  reminderIntervalMs,
} from "@/lib/saudi-schedule";
import type { LifecycleReminder } from "./quotation-lifecycle";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function titleOf(rfq: { title?: { en?: string } | string } | null | undefined) {
  if (!rfq?.title) return "RFQ";
  if (typeof rfq.title === "string") return rfq.title;
  return rfq.title.en || "RFQ";
}

function ageMs(from?: Date | string | null) {
  if (!from) return 0;
  return Date.now() - new Date(from).getTime();
}

async function notifyOnce(opts: {
  userId: unknown;
  key: string;
  type: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  meta?: Record<string, unknown>;
  channel?: "in_app" | "email" | "whatsapp";
}) {
  if (!opts.userId) return;
  const existing = await Notification.findOne({
    userId: opts.userId,
    type: opts.type,
    "meta.key": opts.key,
  })
    .select("_id")
    .lean();
  if (existing) return;
  await Notification.create({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    channel: opts.channel || "in_app",
    read: false,
    meta: { key: opts.key, ...(opts.meta || {}) },
  }).catch(() => undefined);
}

/**
 * Build in-app reminder cards for a user (buyer or seller).
 * Respects Journey 4 triggers + Saudi quiet-hour gating for "actionable now".
 */
export async function buildJourney4Reminders(opts: {
  userId: string;
  vendorId?: string | null;
  locale?: string;
}): Promise<LifecycleReminder[]> {
  const isAr = opts.locale === "ar";
  const schedule = canSendReminderNow();
  const reminders: LifecycleReminder[] = [];
  const now = Date.now();

  // —— Seller: Invited not viewed (4h / 24h); Viewed no quote (24h)
  if (opts.vendorId) {
    const invites = await RFQVendor.find({
      vendorId: opts.vendorId,
      status: { $in: ["invited", "viewed", "accepted"] },
    })
      .populate("rfqId", "title status deadline buyerId")
      .lean();

    for (const inv of invites) {
      const rfq = inv.rfqId as { _id?: unknown; title?: { en?: string }; deadline?: Date } | null;
      if (!rfq?._id) continue;
      const name = titleOf(rfq);
      const age = ageMs((inv as { viewedAt?: Date; createdAt?: Date }).viewedAt || (inv as { createdAt?: Date }).createdAt);
      const status = inv.status;

      if (status === "invited") {
        const t4 = reminderIntervalMs(4 * HOUR);
        const t24 = reminderIntervalMs(24 * HOUR);
        if (age >= t4) {
          reminders.push({
            id: `inv-nv-${String(inv._id)}`,
            side: "seller",
            severity: age >= t24 ? "urgent" : "warn",
            type: "invited_not_viewed",
            title: isAr ? "دعوة RFQ لم تُفتح" : "RFQ invite not viewed",
            body: isAr
              ? `«${name}» بانتظار فتحك منذ ${Math.round(age / HOUR)} ساعة.`
              : `“${name}” waiting to be opened (~${Math.round(age / HOUR)}h).`,
            href: `/dashboard/rfqs/${String(rfq._id)}`,
            meta: {
              rfqId: String(rfq._id),
              channels: ["whatsapp_template", "in_app"],
              smartAction: age >= reminderIntervalMs(48 * HOUR) ? "escalate_next_supplier" : "nudge_open",
              deferred: !schedule.ok ? schedule.reason : undefined,
            },
          });
        }
      }

      if (status === "viewed" || status === "accepted") {
        const quoted = await Quotation.exists({
          rfqId: rfq._id,
          vendorId: opts.vendorId,
          status: { $in: ["submitted", "clarifying", "revised", "shortlisted", "accepted"] },
        });
        if (!quoted && age >= reminderIntervalMs(24 * HOUR)) {
          reminders.push({
            id: `viewed-nq-${String(inv._id)}`,
            side: "seller",
            severity: "warn",
            type: "viewed_no_quote",
            title: isAr ? "شاهدت الدعوة بدون عرض" : "Viewed — no quote yet",
            body: isAr
              ? `الوكيل يمكنه صياغة مسودة عرض من كتالوجك لـ «${name}».`
              : `Agent can draft a quote from your catalogue for “${name}”.`,
            href: `/dashboard/quotations?rfqId=${String(rfq._id)}&aiDraft=1`,
            meta: {
              rfqId: String(rfq._id),
              channels: ["whatsapp", "email"],
              smartAction: "draft_quote_from_catalogue",
            },
          });
        }
      }
    }

    // Buyer question pending (clarifying) — 2h / 12h
    const clarifying = await Quotation.find({
      vendorId: opts.vendorId,
      status: "clarifying",
    })
      .populate("rfqId", "title")
      .lean();
    for (const q of clarifying) {
      const since = ageMs((q as { lifecycle?: { clarifyingAt?: Date }; updatedAt?: Date }).lifecycle?.clarifyingAt || (q as { updatedAt?: Date }).updatedAt);
      if (since >= reminderIntervalMs(2 * HOUR)) {
        reminders.push({
          id: `clarify-${String(q._id)}`,
          side: "seller",
          severity: since >= reminderIntervalMs(12 * HOUR) ? "urgent" : "warn",
          type: "buyer_question_pending",
          title: isAr ? "سؤال المشتري بانتظار ردك" : "Buyer question awaiting reply",
          body: isAr
            ? `يظهر في CRM كـ «بانتظار ردك» — «${titleOf(q.rfqId as { title?: { en?: string } })}».`
            : `Shown as ‘awaiting your reply’ in Leads CRM — “${titleOf(q.rfqId as { title?: { en?: string } })}”.`,
          href: `/dashboard/leads`,
          meta: { quotationId: String(q._id), channels: ["whatsapp", "in_app"] },
        });
      }
    }

    // Quote expiring — 48h before (supplier)
    const expiring = await Quotation.find({
      vendorId: opts.vendorId,
      status: { $in: ["submitted", "revised", "shortlisted", "clarifying"] },
      validity: { $gte: new Date(), $lte: new Date(now + 48 * HOUR) },
    })
      .populate("rfqId", "title")
      .lean();
    for (const q of expiring) {
      reminders.push({
        id: `exp-s-${String(q._id)}`,
        side: "seller",
        severity: "warn",
        type: "quote_expiring",
        title: isAr ? "صلاحية العرض تنتهي" : "Quote expiring",
        body: isAr
          ? `مدّد الصلاحية بنقرة واحدة لـ «${titleOf(q.rfqId as { title?: { en?: string } })}».`
          : `One-tap extend validity for “${titleOf(q.rfqId as { title?: { en?: string } })}”.`,
        href: `/dashboard/quotations?id=${String(q._id)}&extend=1`,
        dueAt: q.validity ? new Date(q.validity).toISOString() : undefined,
        meta: { quotationId: String(q._id), smartAction: "extend_validity" },
      });
    }
  }

  // —— Buyer side
  const buyerRfqs = await RFQ.find({
    buyerId: opts.userId,
    status: { $in: ["open", "matching", "quoted", "negotiation", "awarded"] },
  })
    .select("title status deadline")
    .lean();

  for (const rfq of buyerRfqs) {
    const quotes = await Quotation.find({
      rfqId: rfq._id,
      status: { $in: ["submitted", "revised", "shortlisted", "clarifying", "accepted", "deal_confirmed"] },
    })
      .populate("vendorId", "legalName tradeName")
      .lean();

    // Quote received — surface newest
    for (const q of quotes.filter((x) => ["submitted", "revised"].includes(x.status))) {
      const fresh = ageMs((q as { lifecycle?: { quotedAt?: Date }; createdAt?: Date }).lifecycle?.quotedAt || (q as { createdAt?: Date }).createdAt) < 6 * HOUR;
      if (fresh) {
        reminders.push({
          id: `recv-${String(q._id)}`,
          side: "buyer",
          severity: "info",
          type: "quote_received",
          title: isAr ? "وصل عرض سعر" : "Quote received",
          body: isAr
            ? `عرض جديد على «${titleOf(rfq)}» — بطاقة مقارنة جاهزة.`
            : `New quote on “${titleOf(rfq)}” — compare card attached.`,
          href: `/buyer/quotations?id=${String(q._id)}&compare=1`,
          meta: { quotationId: String(q._id), channels: ["in_app", "whatsapp"], smartAction: "attach_compare_card" },
        });
      }
    }

    // Shortlisted, no decision — 3 days
    for (const q of quotes.filter((x) => x.status === "shortlisted")) {
      const since = ageMs((q as { lifecycle?: { shortlistedAt?: Date }; updatedAt?: Date }).lifecycle?.shortlistedAt || (q as { updatedAt?: Date }).updatedAt);
      if (since >= reminderIntervalMs(3 * DAY)) {
        reminders.push({
          id: `short-${String(q._id)}`,
          side: "buyer",
          severity: "warn",
          type: "shortlisted_no_decision",
          title: isAr ? "قائمة مختصرة بدون قرار" : "Shortlisted — no decision",
          body: isAr
            ? `الوكيل يلخّص الفروقات المتبقية لـ «${titleOf(rfq)}».`
            : `Agent can summarise remaining differences on “${titleOf(rfq)}”.`,
          href: `/buyer/quotations?compare=1&rfqId=${String(rfq._id)}`,
          meta: { rfqId: String(rfq._id), smartAction: "summarise_differences" },
        });
      }
    }

    // Quote expiring — buyer 48h
    for (const q of quotes) {
      if (!q.validity) continue;
      if (!["submitted", "revised", "shortlisted"].includes(q.status)) continue;
      const left = new Date(q.validity).getTime() - now;
      if (left > 0 && left <= 48 * HOUR) {
        reminders.push({
          id: `exp-b-${String(q._id)}`,
          side: "buyer",
          severity: left <= DAY ? "urgent" : "warn",
          type: "quote_expiring",
          title: isAr ? "صلاحية عرض تنتهي" : "Quote expiring soon",
          body: isAr
            ? `عرض على «${titleOf(rfq)}» ينتهي خلال ~${Math.max(1, Math.round(left / HOUR))} ساعة.`
            : `A quote on “${titleOf(rfq)}” expires in ~${Math.max(1, Math.round(left / HOUR))} hours.`,
          href: `/buyer/quotations?id=${String(q._id)}`,
          dueAt: new Date(q.validity).toISOString(),
          meta: { quotationId: String(q._id) },
        });
      }
    }

    // Accepted → ask deal close after 7 days
    for (const q of quotes.filter((x) => x.status === "accepted")) {
      const since = ageMs((q as { lifecycle?: { acceptedAt?: Date }; updatedAt?: Date }).lifecycle?.acceptedAt || (q as { updatedAt?: Date }).updatedAt);
      if (since >= 7 * DAY) {
        reminders.push({
          id: `deal-${String(q._id)}`,
          side: "buyer",
          severity: "info",
          type: "deal_close_check",
          title: isAr ? "هل أُبرم الاتفاق؟" : "Did the deal close?",
          body: isAr
            ? `تم قبول العرض قبل أسبوع — أكّد إتمام الصفقة لمشاركة التقييم.`
            : `Quote accepted a week ago — confirm deal closed to unlock the review.`,
          href: `/buyer/quotations?id=${String(q._id)}&confirmDeal=1`,
          meta: { quotationId: String(q._id), smartAction: "confirm_deal" },
        });
      }
    }

    // Deal confirmed → review after 14 days
    for (const q of quotes.filter((x) => x.status === "deal_confirmed")) {
      const since = ageMs((q as { lifecycle?: { dealConfirmedAt?: Date }; updatedAt?: Date }).lifecycle?.dealConfirmedAt || (q as { updatedAt?: Date }).updatedAt);
      if (since >= 14 * DAY) {
        reminders.push({
          id: `rev-${String(q._id)}`,
          side: "buyer",
          severity: "info",
          type: "review_request",
          title: isAr ? "اطلب تقييماً" : "Review request",
          body: isAr
            ? `تقييمك يُحتسب في شارة أداء المورد.`
            : `Your review counts toward the supplier performance badge.`,
          href: `/buyer/quotations?id=${String(q._id)}&review=1`,
          meta: { quotationId: String(q._id) },
        });
      }
    }
  }

  if (!schedule.ok) {
    for (const r of reminders) {
      r.meta = { ...(r.meta || {}), deferred: schedule.reason, deferUntil: schedule.deferUntil?.toISOString() };
    }
  }

  const rank = { urgent: 0, warn: 1, info: 2 };
  return reminders.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 50);
}

/** Cron / processor: escalate invites 48h unused + push notifications. */
export async function processJourney4Automations() {
  const schedule = canSendReminderNow();
  if (!schedule.ok) {
    return { skipped: true, reason: schedule.reason, deferUntil: schedule.deferUntil };
  }

  let escalated = 0;
  let notified = 0;
  const stale = await RFQVendor.find({
    status: "invited",
    createdAt: { $lte: new Date(Date.now() - reminderIntervalMs(48 * HOUR)) },
    escalatedAt: { $exists: false },
  }).limit(40);

  for (const inv of stale) {
    inv.status = "no_response";
    inv.escalatedAt = new Date();
    await inv.save();
    escalated++;

    // Invite next matched vendor if any still invited=false on same RFQ
    const next = await RFQVendor.findOne({
      rfqId: inv.rfqId,
      status: "invited",
      _id: { $ne: inv._id },
    }).sort({ matchScore: -1 });
    if (next) {
      const vendor = await Vendor.findById(next.vendorId).select("ownerUserId").lean();
      await notifyOnce({
        userId: vendor?.ownerUserId,
        key: `escalate-${String(next._id)}`,
        type: "rfq_invite_escalated",
        title: { en: "Priority RFQ invite", ar: "دعوة RFQ ذات أولوية" },
        body: {
          en: "A prior matched supplier did not respond — this invite is now prioritised for you.",
          ar: "مورد مطابق سابق لم يرد — هذه الدعوة أصبحت ذات أولوية لك.",
        },
        meta: { rfqId: String(inv.rfqId), inviteId: String(next._id) },
        channel: "in_app",
      });
      notified++;
    }
  }

  // Expire quotes past validity
  const expired = await Quotation.updateMany(
    {
      status: { $in: ["submitted", "revised", "shortlisted", "clarifying"] },
      validity: { $lt: new Date() },
    },
    { $set: { status: "expired" } }
  );

  return {
    skipped: false,
    escalated,
    notified,
    expired: expired.modifiedCount || 0,
  };
}
