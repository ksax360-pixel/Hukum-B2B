import { Types } from "mongoose";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { RFQ, RFQVendor, Quotation } from "@/modules/rfqs/rfq.model";
import { User } from "@/modules/users/user.model";
import { AnalyticsEvent } from "@/modules/platform/platform.model";

export type Granularity = "day" | "week" | "month";

export type RangeInput = {
  from?: string | null;
  to?: string | null;
  range?: string | null;
  granularity?: string | null;
  compare?: string | null;
};

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonth(d: Date) {
  return endOfDay(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

/** Resolve filter window. Dates are UTC day boundaries. Attribution field: createdAt. */
export function resolveAnalyticsRange(input: RangeInput) {
  const now = new Date();
  const rangeKey = (input.range || "30d").toLowerCase();
  let from: Date;
  let to: Date = endOfDay(now);

  if (input.from && input.to) {
    from = startOfDay(new Date(input.from));
    to = endOfDay(new Date(input.to));
  } else if (rangeKey === "this_month") {
    from = startOfMonth(now);
    to = endOfDay(now);
  } else if (rangeKey === "prev_month") {
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    from = startOfMonth(prev);
    to = endOfMonth(prev);
  } else if (rangeKey === "this_year") {
    from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    to = endOfDay(now);
  } else {
    const days = RANGE_DAYS[rangeKey] || 30;
    from = startOfDay(new Date(to.getTime() - (days - 1) * 86400000));
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw Object.assign(new Error("Invalid date range"), { status: 400 });
  }

  const ms = to.getTime() - from.getTime();
  const compareTo = new Date(from.getTime() - 1);
  const compareFrom = new Date(compareTo.getTime() - ms);
  const compare = input.compare === "0" || input.compare === "false" ? null : { from: startOfDay(compareFrom), to: endOfDay(compareTo) };

  const g = (input.granularity || "day").toLowerCase();
  const granularity: Granularity = g === "week" || g === "month" ? g : "day";

  return { from, to, compare, granularity, rangeKey };
}

function dateFormat(granularity: Granularity) {
  if (granularity === "month") return "%Y-%m";
  if (granularity === "week") return "%G-W%V";
  return "%Y-%m-%d";
}

async function timeSeries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  match: Record<string, unknown>,
  granularity: Granularity,
  dateField = "createdAt"
) {
  const rows = (await model.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat(granularity), date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])) as { _id: string; count: number }[];
  return rows.map((r) => ({ date: r._id, count: r.count }));
}

function mergeSeries(
  dates: string[],
  maps: Record<string, Map<string, number>>
): Array<Record<string, string | number>> {
  return dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const [key, map] of Object.entries(maps)) {
      row[key] = map.get(date) || 0;
    }
    return row;
  });
}

function collectDates(...seriesList: { date: string }[][]) {
  const set = new Set<string>();
  for (const s of seriesList) for (const r of s) set.add(r.date);
  return [...set].sort();
}

function toMap(series: { date: string; count: number }[]) {
  return new Map(series.map((r) => [r.date, r.count]));
}

async function statusBreakdown(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  match: Record<string, unknown>,
  field: string
) {
  const rows = (await model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])) as { _id: string; count: number }[];
  return rows.map((r) => ({ status: r._id || "unknown", count: r.count }));
}

async function countInRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  base: Record<string, unknown>,
  from: Date,
  to: Date
) {
  return model.countDocuments({ ...base, createdAt: { $gte: from, $lte: to } }) as Promise<number>;
}

const INSTRUMENTATION_GAPS = [
  "Unique sessions / bounce rate — no session store",
  "Invitation viewed / opened — RFQVendor has no viewed state",
  "Storefront visitor uniqueness — only vendor_view / vendor_page_view event counts",
  "Impression → click CTR — impressions not recorded",
  "RFQ win-rate conversion — no attributed view→award funnel",
];

export async function buildPlatformAnalyticsRollup(input: RangeInput) {
  const { from, to, compare, granularity, rangeKey } = resolveAnalyticsRange(input);
  const inRange = { createdAt: { $gte: from, $lte: to } };

  const [
    totalVendors,
    verifiedVendors,
    pendingVendors,
    totalBuyers,
    totalProducts,
    publishedProducts,
    pendingProducts,
    rejectedProducts,
    totalRfqs,
    activeRfqs,
    quotations,
    newVendors,
    newBuyers,
    newProducts,
    newPublished,
    newRfqs,
    newQuotations,
    productViews,
    vendorViews,
    sellersSeries,
    buyersSeries,
    productsSeries,
    publishedSeries,
    rfqsSeries,
    quotesSeries,
    productStatus,
    vendorVerification,
    vendorStatus,
    rfqStatus,
    quotationStatus,
    categoryRows,
    auditRecent,
  ] = await Promise.all([
    Vendor.countDocuments(),
    Vendor.countDocuments({ verificationStatus: "verified" }),
    Vendor.countDocuments({ verificationStatus: "pending" }),
    User.countDocuments({ roles: "buyer" }),
    Product.countDocuments(),
    Product.countDocuments({ status: "published" }),
    Product.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
    Product.countDocuments({ status: "rejected" }),
    RFQ.countDocuments(),
    RFQ.countDocuments({ status: { $in: ["open", "matching", "quoted"] } }),
    Quotation.countDocuments(),
    countInRange(Vendor, {}, from, to),
    countInRange(User, { roles: "buyer" }, from, to),
    countInRange(Product, {}, from, to),
    countInRange(Product, { status: "published" }, from, to),
    countInRange(RFQ, {}, from, to),
    countInRange(Quotation, {}, from, to),
    AnalyticsEvent.countDocuments({ type: "product_view", ...inRange }),
    AnalyticsEvent.countDocuments({ type: { $in: ["vendor_view", "vendor_page_view"] }, ...inRange }),
    timeSeries(Vendor, inRange, granularity),
    timeSeries(User, { roles: "buyer", ...inRange }, granularity),
    timeSeries(Product, inRange, granularity),
    timeSeries(Product, { status: "published", ...inRange }, granularity),
    timeSeries(RFQ, inRange, granularity),
    timeSeries(Quotation, inRange, granularity),
    statusBreakdown(Product, {}, "status"),
    statusBreakdown(Vendor, {}, "verificationStatus"),
    statusBreakdown(Vendor, {}, "status"),
    statusBreakdown(RFQ, {}, "status"),
    statusBreakdown(Quotation, {}, "status"),
    Product.aggregate([
      { $match: { categoryId: { $exists: true, $ne: null } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ]),
    // lightweight activity sample from recent domain creates — not audit substitute
    Promise.resolve(null),
  ]);

  let prev: Record<string, number> | null = null;
  if (compare) {
    const [pv, pb, pp, pr, pq] = await Promise.all([
      countInRange(Vendor, {}, compare.from, compare.to),
      countInRange(User, { roles: "buyer" }, compare.from, compare.to),
      countInRange(Product, {}, compare.from, compare.to),
      countInRange(RFQ, {}, compare.from, compare.to),
      countInRange(Quotation, {}, compare.from, compare.to),
    ]);
    prev = { newVendors: pv, newBuyers: pb, newProducts: pp, newRfqs: pr, newQuotations: pq };
  }

  const growthDates = collectDates(sellersSeries, buyersSeries, productsSeries, rfqsSeries);
  const growthSeries = mergeSeries(growthDates, {
    sellers: toMap(sellersSeries),
    buyers: toMap(buyersSeries),
    products: toMap(productsSeries),
    published: toMap(publishedSeries),
    rfqs: toMap(rfqsSeries),
  });

  const rfqQuoteDates = collectDates(rfqsSeries, quotesSeries);
  const rfqQuoteSeries = mergeSeries(rfqQuoteDates, {
    rfqs: toMap(rfqsSeries),
    quotations: toMap(quotesSeries),
  });

  const categoryRanking = categoryRows.map(
    (r: { category?: { name?: { en?: string; ar?: string }; key?: string }; count: number; _id: unknown }) => ({
      name: r.category?.name?.en || r.category?.name?.ar || r.category?.key || "Uncategorized",
      count: r.count,
      categoryId: String(r._id),
    })
  );

  void auditRecent;

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      range: rangeKey,
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
      compare: compare
        ? { from: compare.from.toISOString(), to: compare.to.toISOString() }
        : null,
    },
    definitions: {
      attribution: "createdAt (UTC)",
      newVendors: "Vendor documents created in range",
      newBuyers: "Users with role buyer created in range",
      newProducts: "Product documents created in range",
      publishedInRange: "Products with status=published and createdAt in range (not republish events)",
      pendingProducts: "Current snapshot: status in submitted|under_review",
      activeRfqs: "Current snapshot: status in open|matching|quoted",
      productViews: "AnalyticsEvent type=product_view in range",
      vendorViews: "AnalyticsEvent type in vendor_view|vendor_page_view in range",
    },
    kpis: {
      totalVendors,
      verifiedVendors,
      pendingVendors,
      totalBuyers,
      totalProducts,
      publishedProducts,
      pendingProducts,
      rejectedProducts,
      totalRfqs,
      activeRfqs,
      quotations,
      newVendors,
      newBuyers,
      newProducts,
      newPublished,
      newRfqs,
      newQuotations,
      productViews,
      vendorViews,
      previousPeriod: prev,
    },
    growthSeries,
    rfqQuoteSeries,
    productStatus,
    vendorVerification,
    vendorStatus,
    rfqStatus,
    quotationStatus,
    categoryRanking,
    gaps: INSTRUMENTATION_GAPS,
  };
}

export async function buildSellerAnalyticsRollup(vendorId: string, input: RangeInput) {
  if (!Types.ObjectId.isValid(vendorId)) {
    throw Object.assign(new Error("Invalid vendor"), { status: 400 });
  }
  const vid = new Types.ObjectId(vendorId);
  const { from, to, compare, granularity, rangeKey } = resolveAnalyticsRange(input);
  const owned = { vendorId: vid };
  const inRange = { ...owned, createdAt: { $gte: from, $lte: to } };

  const inviteIds = await RFQVendor.find({ vendorId: vid }).select("rfqId status createdAt").lean();
  const inviteRfqIds = inviteIds.map((i) => i.rfqId);

  const [
    vendor,
    totalProducts,
    published,
    awaiting,
    rejected,
    draft,
    invitations,
    quotations,
    productsCreated,
    productsPublished,
    quotesCreated,
    productViews,
    vendorViews,
    contactEvents,
    productStatus,
    quotationStatus,
    inviteStatus,
    productsSeries,
    publishedSeries,
    invitesSeries,
    quotesSeries,
    categoryRows,
  ] = await Promise.all([
    Vendor.findById(vid).select("legalName tradeName verificationStatus status completenessScore slug").lean(),
    Product.countDocuments(owned),
    Product.countDocuments({ ...owned, status: "published" }),
    Product.countDocuments({ ...owned, status: { $in: ["submitted", "under_review"] } }),
    Product.countDocuments({ ...owned, status: "rejected" }),
    Product.countDocuments({ ...owned, status: "draft" }),
    inviteIds.length,
    Quotation.countDocuments(owned),
    countInRange(Product, owned, from, to),
    countInRange(Product, { ...owned, status: "published" }, from, to),
    countInRange(Quotation, owned, from, to),
    AnalyticsEvent.countDocuments({ vendorId: vid, type: "product_view", createdAt: { $gte: from, $lte: to } }),
    AnalyticsEvent.countDocuments({
      vendorId: vid,
      type: { $in: ["vendor_view", "vendor_page_view"] },
      createdAt: { $gte: from, $lte: to },
    }),
    AnalyticsEvent.countDocuments({
      vendorId: vid,
      type: { $regex: /contact|inquiry|quote|whatsapp|phone|email/i },
      createdAt: { $gte: from, $lte: to },
    }),
    statusBreakdown(Product, owned, "status"),
    statusBreakdown(Quotation, owned, "status"),
    statusBreakdown(RFQVendor, { vendorId: vid }, "status"),
    timeSeries(Product, inRange, granularity),
    timeSeries(Product, { ...owned, status: "published", createdAt: { $gte: from, $lte: to } }, granularity),
    RFQVendor.aggregate([
      { $match: { vendorId: vid, createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat(granularity), date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).then((rows: { _id: string; count: number }[]) => rows.map((r) => ({ date: r._id, count: r.count }))),
    timeSeries(Quotation, inRange, granularity),
    Product.aggregate([
      { $match: { vendorId: vid, categoryId: { $exists: true, $ne: null } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  let previousPeriod: Record<string, number> | null = null;
  if (compare) {
    const [pc, pq, pi] = await Promise.all([
      countInRange(Product, owned, compare.from, compare.to),
      countInRange(Quotation, owned, compare.from, compare.to),
      RFQVendor.countDocuments({ vendorId: vid, createdAt: { $gte: compare.from, $lte: compare.to } }),
    ]);
    previousPeriod = { productsCreated: pc, quotations: pq, invitations: pi };
  }

  const catalogDates = collectDates(productsSeries, publishedSeries);
  const catalogSeries = mergeSeries(catalogDates, {
    created: toMap(productsSeries),
    published: toMap(publishedSeries),
  });

  const oppDates = collectDates(invitesSeries, quotesSeries);
  const opportunitySeries = mergeSeries(oppDates, {
    invitations: toMap(invitesSeries),
    quotations: toMap(quotesSeries),
  });

  const recentProducts = await Product.find(owned)
    .sort({ updatedAt: -1 })
    .limit(8)
    .select("name status updatedAt createdAt")
    .lean();
  const recentQuotes = await Quotation.find(owned)
    .sort({ createdAt: -1 })
    .limit(8)
    .select("status total currency createdAt rfqId")
    .lean();

  const activity = [
    ...recentProducts.map((p) => ({
      date: p.updatedAt || p.createdAt,
      event: "product",
      label: (p as { name?: { en?: string } }).name?.en || "Product",
      status: p.status,
    })),
    ...recentQuotes.map((q) => ({
      date: q.createdAt,
      event: "quotation",
      label: `Quote ${q.currency || "SAR"} ${q.total ?? "—"}`,
      status: q.status,
    })),
  ]
    .sort((a, b) => new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime())
    .slice(0, 12);

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      range: rangeKey,
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
      compare: compare
        ? { from: compare.from.toISOString(), to: compare.to.toISOString() }
        : null,
      vendorId,
    },
    vendor: vendor
      ? {
          id: String(vendor._id),
          name: (vendor as { legalName?: { en?: string } }).legalName?.en || (vendor as { tradeName?: string }).tradeName,
          verificationStatus: vendor.verificationStatus,
          status: vendor.status,
          completenessScore: vendor.completenessScore,
        }
      : null,
    definitions: {
      attribution: "createdAt (UTC) unless noted",
      scope: "Hard-filtered to authenticated vendorId",
      published: "status=published",
      awaiting: "status in submitted|under_review",
      invitations: "RFQVendor rows for this vendor",
      productViews: "AnalyticsEvent product_view with vendorId",
      vendorViews: "AnalyticsEvent vendor_view|vendor_page_view with vendorId",
    },
    kpis: {
      totalProducts,
      published,
      awaiting,
      rejected,
      draft,
      invitations,
      quotations,
      productsCreated,
      productsPublished,
      quotesCreated,
      productViews,
      vendorViews,
      contactEvents,
      storefrontViews: vendorViews + productViews,
      leads: contactEvents,
      responseRate:
        invitations > 0
          ? `${Math.min(100, Math.round((quotesCreated / Math.max(1, invitations)) * 100))}%`
          : "—",
      verification: vendor?.verificationStatus || "unverified",
      previousPeriod,
    },
    totals: {
      views: vendorViews + productViews,
      contacts: contactEvents,
      quotes: quotesCreated,
    },
    series: (catalogSeries || []).map((row: { date?: string; label?: string; count?: number; views?: number }) => ({
      label: row.label || row.date,
      date: row.date,
      views: row.views ?? row.count ?? 0,
    })),
    categories: [],
    cities: [],
    catalogSeries,
    opportunitySeries,
    productStatus,
    quotationStatus,
    inviteStatus,
    categoryRanking: categoryRows.map(
      (r: { category?: { name?: { en?: string; ar?: string }; key?: string }; count: number }) => ({
        name: r.category?.name?.en || r.category?.name?.ar || r.category?.key || "Uncategorized",
        count: r.count,
      })
    ),
    activity,
    invitedRfqCount: inviteRfqIds.length,
    gaps: [
      ...INSTRUMENTATION_GAPS,
      "Seller cannot access another vendor's rollup — enforced by session.vendorId",
    ],
  };
}
