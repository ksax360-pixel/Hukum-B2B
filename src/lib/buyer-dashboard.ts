import { Types } from "mongoose";
import { RFQ, Quotation } from "@/modules/rfqs/rfq.model";
import { SavedProduct, SavedVendor, Conversation } from "@/modules/platform/platform.model";
import { Enquiry } from "@/modules/enquiries/enquiry.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { t as loc } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

function oid(id: string) {
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

function phoneDigits(raw?: string) {
  return String(raw || "").replace(/\D/g, "");
}

export async function loadBuyerDashboardData(
  userId: string,
  email: string,
  locale: Locale,
  mobile?: string
) {
  const buyerOid = oid(userId);
  if (!buyerOid) {
    return emptyDashboard(locale);
  }

  const mobileKey = phoneDigits(mobile);
  const interestQuery: Record<string, unknown> = {
    "extras.requestType": "product_interest",
  };
  if (mobileKey.length >= 9) {
    interestQuery.$or = [
      { email: email.toLowerCase() },
      { phone: new RegExp(`${mobileKey.slice(-9)}$`) },
    ];
  } else {
    interestQuery.email = email.toLowerCase();
  }

  const [rfqs, savedProducts, savedVendors, conversations, interests] = await Promise.all([
    RFQ.find({ buyerId: buyerOid }).sort({ updatedAt: -1 }).limit(80).lean(),
    SavedProduct.find({ userId: buyerOid }).populate("productId", "name slug").lean(),
    SavedVendor.find({ userId: buyerOid }).populate("vendorId", "legalName tradeName slug").lean(),
    Conversation.find({ participants: buyerOid }).sort({ updatedAt: -1 }).limit(50).lean(),
    Enquiry.find(interestQuery).sort({ createdAt: -1 }).limit(40).lean().catch(() => []),
  ]);

  const myInterests = interests as Array<{
    email?: string;
    phone?: string;
    subject?: string;
    extras?: Record<string, unknown>;
    reference?: string;
    createdAt?: Date;
  }>;

  const rfqIds = rfqs.map((r) => r._id);
  const quotations = rfqIds.length
    ? await Quotation.find({ rfqId: { $in: rfqIds }, status: { $ne: "draft" } })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
    : [];

  const activeStatuses = new Set(["open", "matching", "quoted", "negotiation"]);
  const activeRfqs = rfqs.filter((r) => activeStatuses.has(String(r.status)));
  const pipeline = {
    draft: rfqs.filter((r) => r.status === "draft").length,
    sent: rfqs.filter((r) => r.status === "open" || r.status === "matching").length,
    quoted: rfqs.filter((r) => r.status === "quoted" || r.status === "negotiation").length,
    closed: rfqs.filter((r) => r.status === "awarded" || r.status === "closed" || r.status === "cancelled").length,
  };

  // Activity series: RFQs created per day over last 7 days
  const series = Array.from({ length: 7 }, () => 0);
  const now = Date.now();
  for (const r of rfqs) {
    const created = (r as { createdAt?: Date }).createdAt;
    if (!created) continue;
    const daysAgo = Math.floor((now - new Date(created).getTime()) / (24 * 60 * 60 * 1000));
    if (daysAgo >= 0 && daysAgo < 7) series[6 - daysAgo] += 1;
  }
  // Mix in quotation activity lightly
  for (const q of quotations) {
    const created = (q as { createdAt?: Date }).createdAt;
    if (!created) continue;
    const daysAgo = Math.floor((now - new Date(created).getTime()) / (24 * 60 * 60 * 1000));
    if (daysAgo >= 0 && daysAgo < 7) series[6 - daysAgo] += 1;
  }
  if (series.every((n) => n === 0)) {
    series[3] = Math.min(activeRfqs.length, 2);
    series[5] = Math.min(quotations.length, 3);
  }

  // Top category from RFQ categoryIds
  const categoryCounts = new Map<string, number>();
  for (const r of rfqs) {
    const cid = r.categoryId ? String(r.categoryId) : "";
    if (!cid) continue;
    categoryCounts.set(cid, (categoryCounts.get(cid) || 0) + 1);
  }
  let topCategoryLabel = locale === "ar" ? "غير محدد" : "Uncategorized";
  let topPercent = 0;
  if (categoryCounts.size > 0) {
    const [topId, topCount] = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const cat = await Category.findById(topId).select("name").lean().catch(() => null);
    topCategoryLabel = cat ? loc(locale, (cat as { name?: { en?: string; ar?: string } }).name) || topCategoryLabel : topCategoryLabel;
    topPercent = Math.round((topCount / Math.max(rfqs.length, 1)) * 100);
  } else if (savedProducts.length > 0) {
    topPercent = Math.min(100, savedProducts.length * 8);
    topCategoryLabel = locale === "ar" ? "منتجات محفوظة" : "Saved products";
  }

  // Ranking: saved vendors
  const rankingItems = (
    savedVendors as Array<{
      vendorId?: { legalName?: { en?: string; ar?: string }; tradeName?: string; slug?: { en?: string } };
    }>
  )
    .map((row) => {
      const v = row.vendorId;
      if (!v) return null;
      const name = loc(locale, v.legalName) || v.tradeName || "Vendor";
      return { name, value: "1", meta: locale === "ar" ? "محفوظ" : "saved" };
    })
    .filter(Boolean)
    .slice(0, 6) as Array<{ name: string; value: string; meta?: string }>;

  // If few saved vendors, fill from RFQ-linked vendors via quotations
  if (rankingItems.length < 4 && quotations.length) {
    const vendorIds = [...new Set(quotations.map((q) => String(q.vendorId)).filter(Boolean))].slice(0, 6);
    const vendors = await Vendor.find({ _id: { $in: vendorIds } })
      .select("legalName tradeName")
      .lean();
    const quoteCount = new Map<string, number>();
    for (const q of quotations) {
      const id = String(q.vendorId);
      quoteCount.set(id, (quoteCount.get(id) || 0) + 1);
    }
    for (const v of vendors) {
      const name = loc(locale, v.legalName) || v.tradeName || "Vendor";
      if (rankingItems.some((i) => i.name === name)) continue;
      rankingItems.push({
        name,
        value: String(quoteCount.get(String(v._id)) || 1),
        meta: locale === "ar" ? "عروض" : "quotes",
      });
      if (rankingItems.length >= 6) break;
    }
  }

  const recentRfqs = rfqs.slice(0, 6).map((r) => {
    const title =
      loc(locale, r.title) ||
      (locale === "ar" ? "طلب عرض سعر" : "RFQ") + (r._id ? ` · ${String(r._id).slice(-6)}` : "");
    const qCount = quotations.filter((q) => String(q.rfqId) === String(r._id)).length;
    const meta =
      qCount > 0
        ? `${qCount} ${locale === "ar" ? "عرض" : qCount === 1 ? "quote" : "quotes"}`
        : String(r.status || "open");
    return {
      title,
      meta,
      href: `/${locale}/buyer/rfqs`,
    };
  });

  // Also surface recent interests as activity if few RFQs
  if (recentRfqs.length < 3 && myInterests.length) {
    for (const row of myInterests.slice(0, 4 - recentRfqs.length)) {
      recentRfqs.push({
        title: String(row.subject || row.extras?.productName || (locale === "ar" ? "اهتمام بمنتج" : "Product interest")),
        meta: String(row.reference || (locale === "ar" ? "اهتمام" : "interest")),
        href: `/${locale}/buyer/saved`,
      });
    }
  }

  return {
    metrics: {
      activeRfqs: activeRfqs.length,
      quotations: quotations.length,
      savedProducts: savedProducts.length,
      messages: conversations.length,
      interests: myInterests.length,
    },
    gauge: {
      label: topCategoryLabel,
      percent: topPercent,
    },
    ranking: rankingItems,
    activitySeries: series,
    pipeline: [
      { label: "Draft", value: pipeline.draft },
      { label: "Sent", value: pipeline.sent },
      { label: "Quoted", value: pipeline.quoted },
      { label: "Closed", value: pipeline.closed },
    ],
    recent: recentRfqs,
  };
}

export function emptyBuyerDashboard(locale: Locale) {
  return {
    metrics: { activeRfqs: 0, quotations: 0, savedProducts: 0, messages: 0, interests: 0 },
    gauge: { label: locale === "ar" ? "ابدأ التوريد" : "Start sourcing", percent: 0 },
    ranking: [] as Array<{ name: string; value: string; meta?: string }>,
    activitySeries: [0, 0, 0, 0, 0, 0, 0],
    pipeline: [
      { label: "Draft", value: 0 },
      { label: "Sent", value: 0 },
      { label: "Quoted", value: 0 },
      { label: "Closed", value: 0 },
    ],
    recent: [] as Array<{ title: string; meta: string; href: string }>,
  };
}

function emptyDashboard(locale: Locale) {
  return emptyBuyerDashboard(locale);
}
