import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { cityName } from "@/lib/cities";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { AnalyticsEvent } from "@/modules/platform/platform.model";
import { Product } from "@/modules/products/product.model";
import { RFQ, RFQVendor, Quotation } from "@/modules/rfqs/rfq.model";
import mongoose from "mongoose";

const RANGES = [7, 30, 90] as const;
const STOREFRONT = ["vendor_page_view", "vendor_view", "vendor_landing_view"];
const DAY = 86400000;

/** Supplier analytics, framed as enquiries: who looked, who asked, what you quoted, what was accepted. */
export default async function VendorAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const days = RANGES.find((r) => String(r) === sp.days) || 30;

  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/analytics`)}`);

  const since = new Date(Date.now() - days * DAY);
  let funnel = { storefront: 0, product: 0, requests: 0, quotes: 0, accepted: 0 };
  let series: Array<{ day: string; n: number }> = [];
  let top: Array<{ id: string; name: string; views: number }> = [];
  let cities: Array<{ city: string; n: number }> = [];
  let medianHours: number | null = null;

  try {
    await connectDB();
    if (session.vendorId) {
      const vid = new mongoose.Types.ObjectId(session.vendorId);
      const human = { "meta.bot": { $ne: true } };
      const [sf, pv, daily, topRaw, invites, quotes] = await Promise.all([
        AnalyticsEvent.countDocuments({ vendorId: vid, type: { $in: STOREFRONT }, createdAt: { $gte: since }, ...human }),
        AnalyticsEvent.countDocuments({ vendorId: vid, type: "product_view", createdAt: { $gte: since }, ...human }),
        AnalyticsEvent.aggregate([
          { $match: { vendorId: vid, type: { $in: [...STOREFRONT, "product_view"] }, createdAt: { $gte: since }, ...human } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Riyadh" } }, n: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: { vendorId: vid, type: "product_view", productId: { $ne: null }, createdAt: { $gte: since }, ...human } },
          { $group: { _id: "$productId", n: { $sum: 1 } } },
          { $sort: { n: -1 } },
          { $limit: 6 },
        ]),
        RFQVendor.find({ vendorId: vid, createdAt: { $gte: since } }).select("rfqId createdAt").lean() as Promise<Array<{ rfqId: unknown; createdAt?: Date }>>,
        Quotation.find({ vendorId: vid, createdAt: { $gte: since }, status: { $ne: "draft" } }).select("rfqId status createdAt").lean() as Promise<Array<{ rfqId: unknown; status?: string; createdAt?: Date }>>,
      ]);
      funnel = {
        storefront: sf,
        product: pv,
        requests: invites.length,
        quotes: quotes.length,
        accepted: quotes.filter((q) => ["accepted", "deal_confirmed", "reviewed"].includes(q.status || "")).length,
      };
      const byDay = new Map((daily as Array<{ _id: string; n: number }>).map((d) => [d._id, d.n]));
      series = Array.from({ length: days }, (_, i) => {
        const d = new Date(Date.now() - (days - 1 - i) * DAY).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
        return { day: d, n: byDay.get(d) || 0 };
      });
      const names = (await Product.find({ _id: { $in: (topRaw as Array<{ _id: unknown }>).map((t) => t._id) } }).select("name").lean()) as Array<{ _id: unknown; name?: { en?: string; ar?: string } }>;
      const nameOf = new Map(names.map((n) => [String(n._id), (isAr ? n.name?.ar || n.name?.en : n.name?.en || n.name?.ar) || ""]));
      top = (topRaw as Array<{ _id: unknown; n: number }>).filter((t) => nameOf.has(String(t._id))).map((t) => ({ id: String(t._id), name: nameOf.get(String(t._id)) || "", views: t.n }));
      // Time to quote: invite received → this supplier's quote on the same request.
      const invitedAt = new Map(invites.map((i) => [String(i.rfqId), i.createdAt ? new Date(i.createdAt).getTime() : 0]));
      const gaps = quotes
        .map((q) => (q.createdAt ? new Date(q.createdAt).getTime() : 0) - (invitedAt.get(String(q.rfqId)) || 0))
        .filter((g) => g > 0 && invitedAt.size)
        .sort((a, b) => a - b);
      medianHours = gaps.length ? Math.round(gaps[Math.floor(gaps.length / 2)] / 3600000) : null;
      const rfqs = (await RFQ.find({ _id: { $in: invites.map((i) => i.rfqId) } }).select("deliveryLocation.city").lean()) as Array<{ deliveryLocation?: { city?: string } }>;
      const cityCount = new Map<string, number>();
      for (const r of rfqs) if (r.deliveryLocation?.city) cityCount.set(r.deliveryLocation.city, (cityCount.get(r.deliveryLocation.city) || 0) + 1);
      cities = [...cityCount].map(([city, n]) => ({ city, n })).sort((a, b) => b.n - a.n).slice(0, 6);
    }
  } catch (e) {
    console.error("[vendor/analytics]", e);
  }

  const max = Math.max(1, ...series.map((s) => s.n));
  const total = series.reduce((a, s) => a + s.n, 0);
  const peak = series.reduce((a, s) => (s.n > a.n ? s : a), { day: "", n: 0 });
  const fmtDay = (d: string, long = false): string =>
    new Date(`${d}T12:00:00`).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });
  const n = (v: number): string => v.toLocaleString("en-US");
  const steps = [
    { k: "storefront", label: L("Storefront visits", "زيارات المتجر"), v: funnel.storefront },
    { k: "product", label: L("Product views", "مشاهدات المنتجات"), v: funnel.product },
    { k: "requests", label: L("Requests received", "طلبات وصلتك"), v: funnel.requests, href: `/${locale}/vendor/rfqs` },
    { k: "quotes", label: L("Quotes sent", "عروض أرسلتها"), v: funnel.quotes, href: `/${locale}/vendor/quotations` },
    { k: "accepted", label: L("Quotes accepted", "عروض مقبولة"), v: funnel.accepted, href: `/${locale}/vendor/quotations?tab=won` },
  ];
  const tip =
    funnel.requests > funnel.quotes
      ? L(`${n(funnel.requests - funnel.quotes)} request${funnel.requests - funnel.quotes === 1 ? "" : "s"} in this period got no quote from you.`, `${n(funnel.requests - funnel.quotes)} طلبات بهالفترة ما أرسلت لها عرض.`)
      : funnel.product === 0
        ? L("No product views yet. Complete listings with photos and Arabic names show up in more searches.", "ما فيه مشاهدات بعد. المنتجات المكتملة بالصور والأسماء العربية تظهر في بحث أكثر.")
        : "";

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <div className="bh van" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Analytics", "الإحصاءات")}</h1>
            <p>{L("How buyers found you and what came of it. These are enquiries, not sales.", "كيف وصلك المشترون ووش صار. هذي استفسارات، مو مبيعات.")}</p>
          </div>
          <nav className="van-range" aria-label={L("Period", "الفترة")}>
            {RANGES.map((r) => (
              <Link key={r} href={`/${locale}/vendor/analytics?days=${r}`} aria-current={r === days ? "page" : undefined} className={r === days ? "is-on" : ""}>
                {L(`${r} days`, `${r} يوم`)}
              </Link>
            ))}
          </nav>
        </header>

        <ol className="van-funnel" aria-label={L(`Last ${days} days`, `آخر ${days} يوم`)}>
          {steps.map((s) => (
            <li key={s.k}>
              {s.href ? <Link href={s.href}><span>{s.label}</span><b>{n(s.v)}</b></Link> : <><span>{s.label}</span><b>{n(s.v)}</b></>}
            </li>
          ))}
        </ol>
        {tip ? <p className="van-tip">{tip} {funnel.requests > funnel.quotes ? <Link href={`/${locale}/vendor/rfqs`}>{L("Open requests", "افتح الطلبات")}</Link> : <Link href={`/${locale}/vendor/products`}>{L("Improve listings", "حسّن منتجاتك")}</Link>}</p> : null}

        <div className="van-grid">
          <section className="sfe-card van-chart" aria-labelledby="van-visits">
            <div className="sfe-card__head">
              <h2 id="van-visits">{L("Visits per day", "الزيارات يومياً")}</h2>
              <p>
                {total
                  ? L(`${n(total)} visits to your storefront and products. Busiest day: ${fmtDay(peak.day, true)} (${n(peak.n)}).`, `${n(total)} زيارة لمتجرك ومنتجاتك. أكثر يوم: ${fmtDay(peak.day, true)} (${n(peak.n)}).`)
                  : L("No visits in this period yet.", "ما فيه زيارات بهالفترة.")}
              </p>
            </div>
            <div className="van-bars" role="img" aria-label={L(`Daily visits, peak ${n(peak.n)}`, `الزيارات اليومية، الأعلى ${n(peak.n)}`)}>
              <span className="van-bars__max" aria-hidden>{n(max)}</span>
              {series.map((s) => (
                <span key={s.day} className="van-bar" tabIndex={0} aria-label={`${fmtDay(s.day, true)}: ${n(s.n)}`}>
                  <i style={{ height: s.n ? `max(4px, ${Math.round((s.n / max) * 100)}%)` : "0" }} />
                  <em role="tooltip">{fmtDay(s.day, true)} · <b>{n(s.n)}</b></em>
                </span>
              ))}
            </div>
            <div className="van-axis" aria-hidden><span>{series[0] ? fmtDay(series[0].day) : ""}</span><span>{series.length ? fmtDay(series[series.length - 1].day) : ""}</span></div>
          </section>

          <div className="van-side">
            <section className="sfe-card" aria-labelledby="van-time">
              <h2 id="van-time" className="van-h">{L("Your time to quote", "وقتك للتسعير")}</h2>
              <p className="van-big">{medianHours == null ? "—" : medianHours < 24 ? L(`${medianHours} h`, `${medianHours} ساعة`) : L(`${Math.round(medianHours / 24)} days`, `${Math.round(medianHours / 24)} يوم`)}</p>
              <p className="van-note">{L("Typical time from a request reaching you to your quote. Buyers compare the first quotes they get.", "الوقت المعتاد من وصول الطلب لين عرضك. المشترون يقارنون أول العروض اللي توصلهم.")}</p>
            </section>
            <section className="sfe-card" aria-labelledby="van-city">
              <h2 id="van-city" className="van-h">{L("Where requests deliver to", "وين تتوصل الطلبات")}</h2>
              {cities.length ? (
                <ul className="van-list">{cities.map((c) => <li key={c.city}><span>{cityName(c.city, locale)}</span><b>{n(c.n)}</b></li>)}</ul>
              ) : <p className="van-note">{L("Appears once requests reach you.", "تظهر أول ما توصلك طلبات.")}</p>}
            </section>
          </div>
        </div>

        <section className="sfe-card" aria-labelledby="van-top">
          <h2 id="van-top" className="van-h">{L("Most viewed products", "أكثر المنتجات مشاهدة")}</h2>
          {top.length ? (
            <table className="van-table">
              <thead><tr><th scope="col">{L("Product", "المنتج")}</th><th scope="col">{L("Views", "المشاهدات")}</th></tr></thead>
              <tbody>
                {top.map((t) => (
                  <tr key={t.id}><td><Link href={`/${locale}/vendor/products/${t.id}`}>{t.name}</Link></td><td>{n(t.views)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="van-note">{L("No product views in this period.", "ما فيه مشاهدات منتجات بهالفترة.")}</p>}
        </section>
      </div>
    </DashboardShell>
  );
}
