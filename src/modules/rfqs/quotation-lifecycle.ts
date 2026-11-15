import { Quotation, RFQ, RFQVendor } from "@/modules/rfqs/rfq.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Notification } from "@/modules/platform/platform.model";

export type LifecycleReminder = {
  id: string;
  side: "buyer" | "seller";
  severity: "info" | "warn" | "urgent";
  type: string;
  title: string;
  body: string;
  href?: string;
  dueAt?: string;
  meta?: Record<string, unknown>;
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function titleOf(rfq: { title?: { en?: string } | string } | null | undefined) {
  if (!rfq?.title) return "RFQ";
  if (typeof rfq.title === "string") return rfq.title;
  return rfq.title.en || "RFQ";
}

/** Journey 4 reminder matrix (+ legacy deadline nudges). */
export async function buildQuotationReminders(opts: {
  userId: string;
  vendorId?: string | null;
  locale?: string;
}): Promise<LifecycleReminder[]> {
  const { buildJourney4Reminders } = await import("./quotation-reminders");
  const journey = await buildJourney4Reminders(opts);
  const isAr = opts.locale === "ar";
  const now = Date.now();
  const extra: LifecycleReminder[] = [];

  const buyerRfqs = await RFQ.find({
    buyerId: opts.userId,
    status: { $in: ["open", "matching", "quoted", "negotiation"] },
  })
    .select("title status deadline")
    .lean();

  for (const rfq of buyerRfqs) {
    const rfqId = String(rfq._id);
    const name = titleOf(rfq);
    if (rfq.deadline) {
      const due = new Date(rfq.deadline).getTime();
      const left = due - now;
      if (left > 0 && left <= 2 * DAY) {
        extra.push({
          id: `rfq-deadline-${rfqId}`,
          side: "buyer",
          severity: left <= DAY ? "urgent" : "warn",
          type: "rfq_deadline",
          title: isAr ? "موعد RFQ يقترب" : "RFQ deadline approaching",
          body: isAr
            ? `«${name}» ينتهي خلال ${Math.max(1, Math.round(left / HOUR))} ساعة.`
            : `“${name}” closes in about ${Math.max(1, Math.round(left / HOUR))} hours.`,
          href: `/buyer/rfqs?id=${rfqId}`,
          dueAt: new Date(rfq.deadline).toISOString(),
          meta: { rfqId },
        });
      }
    }
  }

  const merged = [...journey, ...extra];
  const seen = new Set<string>();
  const rank = { urgent: 0, warn: 1, info: 2 };
  return merged
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .slice(0, 50);
}

export type QuotationAction =
  | "accept"
  | "reject"
  | "withdraw"
  | "shortlist"
  | "clarify"
  | "revise"
  | "extend_validity"
  | "confirm_deal"
  | "mark_reviewed"
  | "mark_viewed_invite";

function ensureLifecycle(quotation: {
  lifecycle?: Record<string, Date | undefined> | null;
  set: (path: string, val: unknown) => void;
}) {
  if (!quotation.lifecycle) quotation.set("lifecycle", {});
}

export async function transitionQuotation(opts: {
  quotationId?: string;
  action: QuotationAction;
  userId: string;
  vendorId?: string | null;
  reason?: string;
  /** Days to extend validity */
  extendDays?: number;
  rfqId?: string;
}) {
  // Invite viewed (seller opens RFQ)
  if (opts.action === "mark_viewed_invite") {
    if (!opts.vendorId || !opts.rfqId) {
      throw Object.assign(new Error("vendorId and rfqId required"), { status: 400 });
    }
    const invite = await RFQVendor.findOne({ rfqId: opts.rfqId, vendorId: opts.vendorId });
    if (!invite) throw Object.assign(new Error("Invite not found"), { status: 404 });
    if (invite.status === "invited") {
      invite.status = "viewed";
      invite.viewedAt = new Date();
      await invite.save();
    }
    return invite;
  }

  const quotation = await Quotation.findById(opts.quotationId);
  if (!quotation) {
    throw Object.assign(new Error("Quotation not found"), { status: 404 });
  }
  const rfq = await RFQ.findById(quotation.rfqId);
  if (!rfq) throw Object.assign(new Error("RFQ not found"), { status: 404 });
  ensureLifecycle(quotation as never);

  if (opts.action === "withdraw") {
    if (String(quotation.vendorId) !== String(opts.vendorId)) {
      throw Object.assign(new Error("Only the quoting seller can withdraw"), { status: 403 });
    }
    if (!["submitted", "draft", "clarifying", "revised", "shortlisted"].includes(quotation.status)) {
      throw Object.assign(new Error("Cannot withdraw this quotation"), { status: 422 });
    }
    quotation.status = "withdrawn";
    await quotation.save();
    await Notification.create({
      userId: rfq.buyerId,
      type: "quotation_withdrawn",
      title: { en: "Quotation withdrawn", ar: "تم سحب عرض السعر" },
      body: {
        en: `A seller withdrew their quotation on “${titleOf(rfq)}”.`,
        ar: `سحب بائع عرضه على «${titleOf(rfq)}».`,
      },
      channel: "in_app",
      meta: { quotationId: String(quotation._id), rfqId: String(rfq._id) },
    });
    return quotation;
  }

  if (opts.action === "clarify") {
    if (String(rfq.buyerId) !== String(opts.userId) && String(quotation.vendorId) !== String(opts.vendorId)) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    quotation.status = "clarifying";
    quotation.set("lifecycle.clarifyingAt", new Date());
    await quotation.save();
    return quotation;
  }

  if (opts.action === "revise") {
    if (String(quotation.vendorId) !== String(opts.vendorId)) {
      throw Object.assign(new Error("Only seller can revise"), { status: 403 });
    }
    quotation.status = "revised";
    quotation.revision = (quotation.revision || 1) + 1;
    quotation.set("lifecycle.revisedAt", new Date());
    quotation.set("lifecycle.quotedAt", new Date());
    await quotation.save();
    await RFQVendor.findOneAndUpdate(
      { rfqId: quotation.rfqId, vendorId: quotation.vendorId },
      { status: "quoted" }
    );
    await Notification.create({
      userId: rfq.buyerId,
      type: "quotation_revised",
      title: { en: "Revised quotation", ar: "عرض سعر معدّل" },
      body: {
        en: `A revised quote arrived for “${titleOf(rfq)}”.`,
        ar: `وصل عرض معدّل لـ «${titleOf(rfq)}».`,
      },
      channel: "in_app",
      meta: { quotationId: String(quotation._id) },
    });
    return quotation;
  }

  if (opts.action === "extend_validity") {
    if (String(quotation.vendorId) !== String(opts.vendorId)) {
      throw Object.assign(new Error("Only seller can extend validity"), { status: 403 });
    }
    const days = Math.min(90, Math.max(1, Number(opts.extendDays) || 7));
    const base = quotation.validity && new Date(quotation.validity).getTime() > Date.now()
      ? new Date(quotation.validity)
      : new Date();
    base.setDate(base.getDate() + days);
    quotation.validity = base;
    if (quotation.status === "expired") quotation.status = "revised";
    await quotation.save();
    await Notification.create({
      userId: rfq.buyerId,
      type: "quotation_extended",
      title: { en: "Quote validity extended", ar: "تم تمديد صلاحية العرض" },
      body: {
        en: `Validity extended by ${days} day(s) on “${titleOf(rfq)}”.`,
        ar: `مُددت الصلاحية ${days} يوم لـ «${titleOf(rfq)}».`,
      },
      channel: "in_app",
      meta: { quotationId: String(quotation._id), days },
    });
    return quotation;
  }

  // Buyer-only actions below
  if (String(rfq.buyerId) !== String(opts.userId)) {
    throw Object.assign(new Error("Only the RFQ buyer can perform this action"), { status: 403 });
  }

  if (opts.action === "shortlist") {
    if (!["submitted", "revised", "clarifying"].includes(quotation.status)) {
      throw Object.assign(new Error("Cannot shortlist this quotation"), { status: 422 });
    }
    quotation.status = "shortlisted";
    quotation.set("lifecycle.shortlistedAt", new Date());
    await quotation.save();
    return quotation;
  }

  if (opts.action === "confirm_deal") {
    if (quotation.status !== "accepted") {
      throw Object.assign(new Error("Accept the quote before confirming the deal"), { status: 422 });
    }
    quotation.status = "deal_confirmed";
    quotation.set("lifecycle.dealConfirmedAt", new Date());
    await quotation.save();
    const { trackFunnelEvent } = await import("@/modules/notifications/dispatch");
    const { FUNNEL_EVENTS } = await import("@/lib/funnel-events");
    await trackFunnelEvent({
      type: FUNNEL_EVENTS.deal_confirmed,
      userId: String(rfq.buyerId),
      vendorId: String(quotation.vendorId),
      meta: { quotationId: String(quotation._id), rfqId: String(rfq._id) },
    });
    return quotation;
  }

  if (opts.action === "mark_reviewed") {
    if (!["deal_confirmed", "accepted"].includes(quotation.status)) {
      throw Object.assign(new Error("Confirm the deal before marking reviewed"), { status: 422 });
    }
    quotation.status = "reviewed";
    quotation.set("lifecycle.reviewedAt", new Date());
    await quotation.save();
    return quotation;
  }

  if (opts.action === "accept") {
    if (!["submitted", "revised", "shortlisted", "clarifying"].includes(quotation.status)) {
      throw Object.assign(new Error("Only active quotations can be accepted"), { status: 422 });
    }
    quotation.status = "accepted";
    quotation.set("lifecycle.acceptedAt", new Date());
    await quotation.save();
    await Quotation.updateMany(
      {
        rfqId: rfq._id,
        _id: { $ne: quotation._id },
        status: { $in: ["submitted", "revised", "shortlisted", "clarifying"] },
      },
      { $set: { status: "rejected" } }
    );
    rfq.status = "awarded";
    await rfq.save();

    const vendor = await Vendor.findById(quotation.vendorId).select("ownerUserId legalName tradeName phone email whatsapp").lean();
    if (vendor?.ownerUserId) {
      await Notification.create({
        userId: vendor.ownerUserId,
        type: "quotation_accepted",
        title: { en: "Quotation accepted — contact shared", ar: "تم قبول العرض — مشاركة التواصل" },
        body: {
          en: `Your quotation for “${titleOf(rfq)}” was accepted. We’ll ask if the deal closed in 7 days.`,
          ar: `تم قبول عرضك لـ «${titleOf(rfq)}». سنسأل عن إتمام الصفقة بعد 7 أيام.`,
        },
        channel: "in_app",
        meta: { quotationId: String(quotation._id), rfqId: String(rfq._id), contactShared: true },
      });
    }
    await Notification.create({
      userId: rfq.buyerId,
      type: "quotation_accepted_buyer",
      title: { en: "Deal path started", ar: "بدء مسار الصفقة" },
      body: {
        en: "Supplier contact is unlocked. Confirm deal close in ~7 days to leave a review.",
        ar: "تم فتح تواصل المورد. أكّد إتمام الصفقة خلال ~7 أيام للتقييم.",
      },
      channel: "in_app",
      meta: { quotationId: String(quotation._id) },
    });
    return quotation;
  }

  if (opts.action === "reject") {
    if (!["submitted", "revised", "shortlisted", "clarifying"].includes(quotation.status)) {
      throw Object.assign(new Error("Cannot reject this quotation"), { status: 422 });
    }
    quotation.status = "rejected";
    await quotation.save();
    const vendor = await Vendor.findById(quotation.vendorId).select("ownerUserId").lean();
    if (vendor?.ownerUserId) {
      await Notification.create({
        userId: vendor.ownerUserId,
        type: "quotation_rejected",
        title: { en: "Quotation declined", ar: "تم رفض عرض السعر" },
        body: {
          en: `Your quotation for “${titleOf(rfq)}” was declined.${opts.reason ? ` Reason: ${opts.reason}` : ""}`,
          ar: `رُفض عرضك لـ «${titleOf(rfq)}».${opts.reason ? ` السبب: ${opts.reason}` : ""}`,
        },
        channel: "in_app",
        meta: { quotationId: String(quotation._id), rfqId: String(rfq._id), reason: opts.reason || "" },
      });
    }
    return quotation;
  }

  throw Object.assign(new Error("Unknown action"), { status: 400 });
}
