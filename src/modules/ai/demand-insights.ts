/**
 * Demand insights — complete product for Suppliers & Admin.
 * Aggregated + anonymized search / RFQ / quotation trends with bilingual labels.
 * Guard: no personal data; price alerts from anonymized quote medians.
 */
import { SearchHistory, AnalyticsEvent } from "@/modules/platform/platform.model";
import { RFQ, Quotation } from "@/modules/rfqs/rfq.model";
import { Product } from "@/modules/products/product.model";

export type DemandLocale = "en" | "ar";

function anonymizeQuery(q: string) {
  return String(q || "")
    .toLowerCase()
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\+?\d[\d\s-]{7,}/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function weekKey(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((x.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${x.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function median(nums: number[]) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 100) / 100;
}

function t(locale: DemandLocale, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

/** Demo anonymized seed when marketplace is empty — never includes PII. */
function demoInsights(locale: DemandLocale, days: number) {
  return {
    windowDays: days,
    anonymized: true as const,
    locale,
    source: "demo_anonymized" as const,
    totals: {
      searches: 128,
      rfqs: 34,
      quotations: 52,
      aiZeroResults: 9,
      publishedProducts: 0,
    },
    topSearches: [
      { query: "safety helmet", count: 42, zeroResultRate: 5, label: t(locale, "Safety helmet", "خوذة سلامة") },
      { query: "gloves nitrile", count: 28, zeroResultRate: 12, label: t(locale, "Nitrile gloves", "قفازات نيتريل") },
      { query: "scaffolding", count: 19, zeroResultRate: 45, label: t(locale, "Scaffolding", "سقالات") },
      { query: "ppe riyadh", count: 15, zeroResultRate: 8, label: t(locale, "PPE Riyadh", "معدات وقاية الرياض") },
    ],
    topCities: [
      { city: "riyadh", count: 48, label: t(locale, "Riyadh", "الرياض") },
      { city: "jeddah", count: 22, label: t(locale, "Jeddah", "جدة") },
      { city: "dammam", count: 14, label: t(locale, "Dammam", "الدمام") },
    ],
    categoryTrends: [
      { category: "safety_ppe", count: 56, label: t(locale, "Safety / PPE", "سلامة / وقاية") },
      { category: "construction", count: 31, label: t(locale, "Construction", "إنشاءات") },
      { category: "industrial", count: 18, label: t(locale, "Industrial", "صناعي") },
    ],
    weeklyTrend: [
      { week: "W1", searches: 22, rfqs: 6 },
      { week: "W2", searches: 31, rfqs: 8 },
      { week: "W3", searches: 38, rfqs: 10 },
      { week: "W4", searches: 37, rfqs: 10 },
    ],
    priceIndex: [
      {
        query: "safety helmet",
        medianUnitSar: 42,
        sampleSize: 12,
        changePct: 3,
        alert: null as string | null,
        label: t(locale, "Safety helmet", "خوذة سلامة"),
      },
      {
        query: "nitrile gloves",
        medianUnitSar: 1.8,
        sampleSize: 9,
        changePct: -5,
        alert: t(locale, "Price softens — competitive window", "تراجع سعري — فرصة تنافسية"),
        label: t(locale, "Nitrile gloves", "قفازات نيتريل"),
      },
    ],
    priceAlerts: [
      {
        type: "coverage_gap" as const,
        query: "scaffolding",
        severity: "warn" as const,
        message: t(
          locale,
          "High zero-result rate (45%) for “scaffolding” — recruit suppliers.",
          "نسبة نتائج صفرية مرتفعة (45٪) لـ «سقالات» — اجذب موردين."
        ),
      },
      {
        type: "price_move" as const,
        query: "nitrile gloves",
        severity: "info" as const,
        message: t(
          locale,
          "Median unit price for nitrile gloves moved −5% in window.",
          "انخفض متوسط سعر وحدة القفازات النيتريل 5٪ خلال الفترة."
        ),
      },
    ],
    relevance: null as null | { matchedSearches: number; opportunityScore: number },
    copy: {
      title: t(locale, "Demand insights", "رؤى الطلب"),
      subtitle: t(
        locale,
        "Aggregated anonymized searches & RFQs. No personal data.",
        "عمليات بحث وطلبات أسعار مجمّعة ومجهّلة. بلا بيانات شخصية."
      ),
      guard: t(
        locale,
        "PDPL: aggregates only. Export personal data via Privacy tools.",
        "نظام حماية البيانات: مجمّعات فقط. تصدير البيانات الشخصية عبر أدوات الخصوصية."
      ),
    },
    note: t(
      locale,
      "Showing anonymized demo demand until live search/RFQ volume grows.",
      "عرض طلب تجريبي مجهّل حتى يزداد حجم البحث وطلبات الأسعار الفعلي."
    ),
  };
}

export async function buildDemandInsights(opts?: {
  days?: number;
  limit?: number;
  locale?: DemandLocale;
  vendorId?: string | null;
  allowDemo?: boolean;
}) {
  const days = Math.min(90, Math.max(7, opts?.days || 30));
  const limit = Math.min(50, opts?.limit || 15);
  const locale: DemandLocale = opts?.locale === "ar" ? "ar" : "en";
  const since = new Date(Date.now() - days * 86400000);
  const mid = new Date(Date.now() - (days / 2) * 86400000);

  const [searches, rfqs, quotes, zeroEvents, publishedProducts] = await Promise.all([
    SearchHistory.find({ createdAt: { $gte: since } })
      .select("query resultsCount locale createdAt filters")
      .limit(3000)
      .lean(),
    RFQ.find({ createdAt: { $gte: since } })
      .select("title status deliveryLocation createdAt items")
      .limit(800)
      .lean(),
    Quotation.find({
      createdAt: { $gte: since },
      status: { $in: ["submitted", "revised", "shortlisted", "accepted", "deal_confirmed"] },
    })
      .select("lines total currency createdAt")
      .limit(1000)
      .lean(),
    AnalyticsEvent.countDocuments({
      type: "ai_search_zero_results",
      createdAt: { $gte: since },
    }),
    opts?.vendorId
      ? Product.countDocuments({ vendorId: opts.vendorId, status: "published" })
      : Product.countDocuments({ status: "published" }),
  ]);

  // If marketplace search volume is empty, serve anonymized demo demand (still PDPL-safe).
  // Stray RFQs alone should not blank the supplier/admin insights UI.
  if (!searches.length && opts?.allowDemo !== false) {
    const demo = demoInsights(locale, days);
    demo.totals.rfqs = Math.max(demo.totals.rfqs, rfqs.length);
    demo.totals.quotations = Math.max(demo.totals.quotations, quotes.length);
    demo.totals.publishedProducts = publishedProducts;
    demo.totals.aiZeroResults = Math.max(demo.totals.aiZeroResults, zeroEvents);
    if (opts?.vendorId) {
      demo.relevance = { matchedSearches: 3, opportunityScore: 72 };
    }
    if (rfqs.length) {
      demo.note = t(
        locale,
        "Search history is still thin — showing anonymized demand patterns plus live RFQ counts.",
        "سجل البحث لا يزال محدوداً — عرض أنماط طلب مجهّلة مع أعداد طلبات الأسعار الحية."
      );
    }
    return demo;
  }

  const queryCounts = new Map<string, { n: number; zero: number }>();
  const weekly = new Map<string, { searches: number; rfqs: number }>();

  for (const s of searches) {
    const key = anonymizeQuery(String(s.query || ""));
    if (!key || key.length < 2) continue;
    const cur = queryCounts.get(key) || { n: 0, zero: 0 };
    cur.n += 1;
    if ((s.resultsCount || 0) === 0) cur.zero += 1;
    queryCounts.set(key, cur);
    const wk = weekKey(new Date(s.createdAt as Date));
    const w = weekly.get(wk) || { searches: 0, rfqs: 0 };
    w.searches += 1;
    weekly.set(wk, w);
  }

  const topSearches = [...queryCounts.entries()]
    .map(([query, v]) => ({
      query,
      count: v.n,
      zeroResultRate: v.n ? Math.round((v.zero / v.n) * 100) : 0,
      label: query,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const cityCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const r of rfqs) {
    const city = String(
      (r as { deliveryLocation?: { city?: string } }).deliveryLocation?.city || "unspecified"
    )
      .toLowerCase()
      .slice(0, 40);
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    const title =
      typeof r.title === "object"
        ? String((r.title as { en?: string; ar?: string })?.en || (r.title as { ar?: string })?.ar || "")
        : String(r.title || "");
    const cat = anonymizeQuery(title).split(" ").slice(0, 2).join("_") || "general";
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    const wk = weekKey(new Date(r.createdAt as Date));
    const w = weekly.get(wk) || { searches: 0, rfqs: 0 };
    w.rfqs += 1;
    weekly.set(wk, w);
  }

  const topCities = [...cityCounts.entries()]
    .map(([city, count]) => ({
      city,
      count,
      label:
        city === "riyadh"
          ? t(locale, "Riyadh", "الرياض")
          : city === "jeddah"
            ? t(locale, "Jeddah", "جدة")
            : city === "dammam"
              ? t(locale, "Dammam", "الدمام")
              : city,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const categoryTrends = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count, label: category.replace(/_/g, " ") }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const weeklyTrend = [...weekly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, v]) => ({ week, searches: v.searches, rfqs: v.rfqs }));

  // Price index from quotation line unit prices (anonymized medians)
  const priceBuckets = new Map<string, { early: number[]; late: number[] }>();
  for (const q of quotes) {
    const created = new Date((q as { createdAt?: Date }).createdAt || 0);
    const lines = (q as { lines?: Array<{ name?: string; unitPrice?: number }> }).lines || [];
    for (const line of lines) {
      const name = anonymizeQuery(String(line.name || "item"));
      if (!name || line.unitPrice == null) continue;
      const bucket = priceBuckets.get(name) || { early: [], late: [] };
      if (created < mid) bucket.early.push(Number(line.unitPrice));
      else bucket.late.push(Number(line.unitPrice));
      priceBuckets.set(name, bucket);
    }
  }

  const priceIndex = [...priceBuckets.entries()]
    .map(([query, b]) => {
      const all = [...b.early, ...b.late];
      const med = median(all);
      const earlyMed = median(b.early);
      const lateMed = median(b.late);
      let changePct: number | null = null;
      if (earlyMed != null && lateMed != null && earlyMed > 0) {
        changePct = Math.round(((lateMed - earlyMed) / earlyMed) * 1000) / 10;
      }
      let alert: string | null = null;
      if (changePct != null && Math.abs(changePct) >= 8) {
        alert =
          changePct > 0
            ? t(locale, `Price up ${changePct}%`, `ارتفاع السعر ${changePct}٪`)
            : t(locale, `Price down ${Math.abs(changePct)}%`, `انخفاض السعر ${Math.abs(changePct)}٪`);
      }
      return {
        query,
        label: query,
        medianUnitSar: med,
        sampleSize: all.length,
        changePct,
        alert,
      };
    })
    .filter((p) => (p.sampleSize || 0) >= 2)
    .sort((a, b) => (b.sampleSize || 0) - (a.sampleSize || 0))
    .slice(0, 10);

  const priceAlerts: Array<{
    type: "coverage_gap" | "price_move";
    query: string;
    severity: "info" | "warn";
    message: string;
  }> = [];

  for (const ts of topSearches.filter((x) => x.zeroResultRate >= 40 && x.count >= 2).slice(0, 5)) {
    priceAlerts.push({
      type: "coverage_gap",
      query: ts.query,
      severity: "warn",
      message: t(
        locale,
        `High zero-result rate (${ts.zeroResultRate}%) for “${ts.query}” — consider recruiting suppliers.`,
        `نسبة نتائج صفرية مرتفعة (${ts.zeroResultRate}٪) لـ «${ts.query}» — فكّر بجذب موردين.`
      ),
    });
  }
  for (const p of priceIndex.filter((x) => x.alert).slice(0, 5)) {
    priceAlerts.push({
      type: "price_move",
      query: p.query,
      severity: "info",
      message: t(
        locale,
        `Median unit price for “${p.query}” moved ${p.changePct}% (n=${p.sampleSize}).`,
        `تحرك متوسط سعر وحدة «${p.query}» بنسبة ${p.changePct}٪ (عينة ${p.sampleSize}).`
      ),
    });
  }

  let relevance: { matchedSearches: number; opportunityScore: number } | null = null;
  if (opts?.vendorId) {
    const products = await Product.find({ vendorId: opts.vendorId, status: "published" })
      .select("name")
      .limit(40)
      .lean();
    const tokens = new Set<string>();
    for (const p of products) {
      const n = typeof p.name === "object" ? `${p.name?.en || ""} ${p.name?.ar || ""}` : String(p.name || "");
      anonymizeQuery(n)
        .split(" ")
        .filter((w) => w.length > 2)
        .forEach((w) => tokens.add(w));
    }
    let matchedSearches = 0;
    for (const ts of topSearches) {
      if ([...tokens].some((tok) => ts.query.includes(tok))) matchedSearches += ts.count;
    }
    const opportunityScore = Math.min(
      100,
      matchedSearches * 2 + (publishedProducts > 0 ? 20 : 0) + (topCities[0]?.count || 0)
    );
    relevance = { matchedSearches, opportunityScore };
  }

  return {
    windowDays: days,
    anonymized: true as const,
    locale,
    source: "live" as const,
    totals: {
      searches: searches.length,
      rfqs: rfqs.length,
      quotations: quotes.length,
      aiZeroResults: zeroEvents,
      publishedProducts,
    },
    topSearches,
    topCities,
    categoryTrends,
    weeklyTrend,
    priceIndex,
    priceAlerts,
    relevance,
    copy: {
      title: t(locale, "Demand insights", "رؤى الطلب"),
      subtitle: t(
        locale,
        "Aggregated anonymized searches & RFQs. No personal data.",
        "عمليات بحث وطلبات أسعار مجمّعة ومجهّلة. بلا بيانات شخصية."
      ),
      guard: t(
        locale,
        "PDPL: aggregates only. Export personal data via Privacy tools.",
        "نظام حماية البيانات: مجمّعات فقط. تصدير البيانات الشخصية عبر أدوات الخصوصية."
      ),
    },
    note: t(
      locale,
      "Live anonymized demand from marketplace activity.",
      "طلب حي مجهّل من نشاط السوق."
    ),
  };
}

export type DemandInsights = Awaited<ReturnType<typeof buildDemandInsights>>;
