/**
 * Cron-side notification automations: lead unanswered nudges, quote expiring WA,
 * invoice renewal reminders, monthly digests.
 */

import { connectDB } from "@/lib/db";
import { Quotation, RFQVendor } from "@/modules/rfqs/rfq.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { User } from "@/modules/users/user.model";
import { canSendReminderNow, reminderIntervalMs } from "@/lib/saudi-schedule";
import { dispatchNotification, trackFunnelEvent } from "./dispatch";
import { processJourney4Automations } from "@/modules/rfqs/quotation-reminders";
import { FUNNEL_EVENTS } from "@/lib/funnel-events";

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

/** Lead unanswered: 4h / 24h / 48h nudges via matrix channels. */
async function processLeadUnansweredNudges() {
  let n4 = 0;
  let n24 = 0;
  let n48 = 0;
  const invites = await RFQVendor.find({
    status: "invited",
  })
    .populate("rfqId", "title")
    .limit(80)
    .lean();

  for (const inv of invites) {
    const vendor = await Vendor.findById(inv.vendorId).select("ownerUserId phone").lean();
    if (!vendor?.ownerUserId) continue;
    const age = ageMs((inv as { createdAt?: Date }).createdAt);
    const rfq = inv.rfqId as { _id?: unknown; title?: { en?: string } } | null;
    const title = titleOf(rfq);
    const inviteId = String(inv._id);

    if (age >= reminderIntervalMs(48 * HOUR)) {
      await dispatchNotification({
        userId: String(vendor.ownerUserId),
        trigger: "lead_unanswered_48h",
        key: `lead48-${inviteId}`,
        phone: vendor.phone,
        vars: { title },
        meta: { rfqId: String(rfq?._id || ""), inviteId },
      });
      n48++;
    } else if (age >= reminderIntervalMs(24 * HOUR)) {
      await dispatchNotification({
        userId: String(vendor.ownerUserId),
        trigger: "lead_unanswered_24h",
        key: `lead24-${inviteId}`,
        phone: vendor.phone,
        vars: { title },
        meta: { rfqId: String(rfq?._id || ""), inviteId },
      });
      n24++;
    } else if (age >= reminderIntervalMs(4 * HOUR)) {
      await dispatchNotification({
        userId: String(vendor.ownerUserId),
        trigger: "lead_unanswered_4h",
        key: `lead4-${inviteId}`,
        phone: vendor.phone,
        vars: { title },
        meta: { rfqId: String(rfq?._id || ""), inviteId },
      });
      n4++;
    }
  }
  return { n4, n24, n48 };
}

async function processQuoteExpiringPush() {
  let n = 0;
  const now = Date.now();
  const quotes = await Quotation.find({
    status: { $in: ["submitted", "revised", "shortlisted"] },
    validity: { $gte: new Date(), $lte: new Date(now + 48 * HOUR) },
  })
    .populate("rfqId", "title buyerId")
    .limit(40)
    .lean();

  for (const q of quotes) {
    const rfq = q.rfqId as { _id?: unknown; title?: { en?: string }; buyerId?: unknown } | null;
    if (!rfq?.buyerId) continue;
    const left = new Date(q.validity!).getTime() - now;
    const hours = Math.max(1, Math.round(left / HOUR));
    await dispatchNotification({
      userId: String(rfq.buyerId),
      trigger: "quote_expiring",
      key: `exp-${String(q._id)}`,
      vars: { title: titleOf(rfq), hours },
      meta: { quotationId: String(q._id) },
    });
    n++;
  }
  return n;
}

/** Invoice / renewal 7 days before — uses vendor subscription meta if present. */
async function processInvoiceRenewalReminders() {
  let n = 0;
  const in7 = new Date(Date.now() + 7 * DAY);
  const in6 = new Date(Date.now() + 6 * DAY);
  const vendors = await Vendor.find({
    "subscription.renewsAt": { $gte: in6, $lte: in7 },
  })
    .select("ownerUserId tradeName subscription")
    .limit(40)
    .lean();

  for (const v of vendors) {
    if (!v.ownerUserId) continue;
    const sub = (v as { subscription?: { renewsAt?: Date; amount?: number; invoiceId?: string; currency?: string } })
      .subscription;
    await dispatchNotification({
      userId: String(v.ownerUserId),
      trigger: "invoice_renewal",
      key: `renew-${String(v._id)}-${sub?.renewsAt ? new Date(sub.renewsAt).toISOString().slice(0, 10) : "x"}`,
      vars: {
        invoiceId: sub?.invoiceId || `INV-${String(v._id).slice(-6)}`,
        amount: sub?.amount ?? 499,
        currency: sub?.currency || "SAR",
        detail: `Renews ${sub?.renewsAt ? new Date(sub.renewsAt).toLocaleDateString() : "soon"} (ZATCA-ready scaffold).`,
      },
      meta: { vendorId: String(v._id) },
    });
    n++;
  }
  return n;
}

async function processMonthlyDigests(force = false) {
  const day = new Date().getUTCDate();
  // Run on 1st of month, or when force=true (cron test)
  if (!force && day !== 1) return { suppliers: 0, buyers: 0, skipped: true as const };

  let suppliers = 0;
  let buyers = 0;
  const monthAgo = new Date(Date.now() - 30 * DAY);

  const vendors = await Vendor.find({ status: { $in: ["active", "approved", "verified", "draft"] } })
    .select("ownerUserId")
    .limit(100)
    .lean();

  for (const v of vendors) {
    if (!v.ownerUserId) continue;
    const quotes = await Quotation.find({
      vendorId: v._id,
      createdAt: { $gte: monthAgo },
    })
      .select("status total")
      .lean();
    const wins = quotes.filter((q) => ["accepted", "deal_confirmed", "reviewed"].includes(q.status || ""));
    const pipeline = quotes.reduce((s, q) => s + (Number(q.total) || 0), 0);
    await dispatchNotification({
      userId: String(v.ownerUserId),
      trigger: "monthly_supplier_report",
      key: `month-sup-${String(v._id)}-${new Date().toISOString().slice(0, 7)}`,
      vars: {
        quotes: quotes.length,
        wins: wins.length,
        pipeline: Math.round(pipeline),
      },
      meta: { vendorId: String(v._id) },
    });
    suppliers++;
  }

  const buyersList = await User.find({ roles: "buyer" }).select("_id").limit(100).lean();
  for (const b of buyersList) {
    const quotes = await Quotation.find({
      createdAt: { $gte: monthAgo },
      status: { $in: ["submitted", "revised", "shortlisted", "accepted", "deal_confirmed"] },
    })
      .select("total rfqId")
      .populate({ path: "rfqId", select: "buyerId", match: { buyerId: b._id } })
      .limit(200)
      .lean();
    const mine = quotes.filter((q) => {
      const rfq = q.rfqId as { buyerId?: unknown } | null;
      return rfq && String(rfq.buyerId) === String(b._id);
    });
    if (!mine.length) continue;
    const totals = mine.map((q) => Number(q.total) || 0).filter((n) => n > 0);
    const savings =
      totals.length >= 2 ? Math.max(0, Math.max(...totals) - Math.min(...totals)) : Math.round((totals[0] || 0) * 0.05);
    await dispatchNotification({
      userId: String(b._id),
      trigger: "monthly_buyer_savings",
      key: `month-buy-${String(b._id)}-${new Date().toISOString().slice(0, 7)}`,
      vars: { quotes: mine.length, savings },
    });
    buyers++;
  }

  return { suppliers, buyers, skipped: false as const };
}

export async function processNotificationAutomations(opts?: { forceMonthly?: boolean }) {
  await connectDB();
  const schedule = canSendReminderNow();
  if (!schedule.ok) {
    return { skipped: true, reason: schedule.reason, deferUntil: schedule.deferUntil };
  }

  const journey = await processJourney4Automations();
  const leads = await processLeadUnansweredNudges();
  const expiring = await processQuoteExpiringPush();
  const renewals = await processInvoiceRenewalReminders();
  const monthly = await processMonthlyDigests(Boolean(opts?.forceMonthly));

  return {
    skipped: false,
    journey,
    leads,
    quoteExpiring: expiring,
    renewals,
    monthly,
  };
}

export { trackFunnelEvent, FUNNEL_EVENTS };
