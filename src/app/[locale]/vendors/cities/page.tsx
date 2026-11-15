export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, MapPin, Send } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { cityName } from "@/lib/cities";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendors/cities", "ignored", undefined, { seoKey: "vendors-cities" });
}

const REGIONS: Array<{ en: string; ar: string; cities: string[] }> = [
  { en: "Central", ar: "الوسطى", cities: ["Riyadh", "Qassim", "Buraidah", "Hail"] },
  { en: "Western", ar: "الغربية", cities: ["Jeddah", "Mecca", "Makkah", "Medina", "Madinah", "Yanbu", "Taif"] },
  { en: "Eastern", ar: "الشرقية", cities: ["Dammam", "Khobar", "Dhahran", "Jubail", "Al Ahsa"] },
  { en: "North and south", ar: "الشمال والجنوب", cities: ["Tabuk", "Abha", "Jazan", "Najran", "NEOM"] },
];

/** City tiles with live supplier and product counts; every city links into the filtered directory. */
export default async function VendorsByCityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  const counts = new Map<string, { suppliers: number; verified: number; products: number }>();
  try {
    await connectDB();
    const vendors = await Vendor.aggregate([
      { $match: { status: { $nin: ["suspended", "rejected", "expired"] }, "location.city": { $nin: [null, ""] } } },
      { $group: { _id: "$location.city", n: { $sum: 1 }, v: { $sum: { $cond: [{ $eq: ["$verificationStatus", "verified"] }, 1, 0] } }, ids: { $push: "$_id" } } },
    ]);
    await Promise.all(
      vendors.map(async (g: { _id: string; n: number; v: number; ids: unknown[] }) => {
        const products = await Product.countDocuments({ vendorId: { $in: g.ids }, status: "published" });
        counts.set(String(g._id).toLowerCase(), { suppliers: g.n, verified: g.v, products });
      })
    );
  } catch (e) {
    console.error("[vendors/cities]", e);
  }

  const known = new Set(REGIONS.flatMap((r) => r.cities.map((c) => c.toLowerCase())));
  const others = [...counts.keys()].filter((c) => !known.has(c));
  const regions = others.length
    ? [...REGIONS, { en: "Other cities", ar: "مدن أخرى", cities: others.map((c) => c.replace(/\b\w/g, (m) => m.toUpperCase())) }]
    : REGIONS;
  const total = [...counts.values()].reduce((s, c) => s + c.suppliers, 0);

  return (
    <div className="hiw cty" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("Suppliers by city", "الموردون حسب المدينة")}</h1>
          <p>
            {L(
              `${total} suppliers across the Kingdom. Start where you need the goods delivered: local suppliers usually quote faster and cheaper on delivery.`,
              `${total} مورد في أنحاء المملكة. ابدأ من مدينة التوصيل: المورد المحلي غالباً أسرع وأرخص في التوصيل.`
            )}
          </p>
        </header>

        {regions.map((r) => (
          <section key={r.en} className="cty__region" aria-labelledby={`cty-${r.en}`}>
            <h2 id={`cty-${r.en}`}>{L(`${r.en} region`, `المنطقة ${r.ar}`)}</h2>
            <div className="cty__grid">
              {r.cities
                .filter((c, i, arr) => arr.findIndex((x) => cityName(x, "ar") === cityName(c, "ar")) === i)
                .map((c) => {
                  const n = counts.get(c.toLowerCase());
                  return n ? (
                    <Link key={c} href={`/${locale}/vendors?city=${encodeURIComponent(c)}`} className="cty__tile">
                      <span className="cty__name"><MapPin size={16} aria-hidden /> {cityName(c, locale)}</span>
                      <span className="cty__alt" lang={isAr ? "en" : "ar"}>{cityName(c, isAr ? "en" : "ar")}</span>
                      <span className="cty__nums">
                        <b>{n.suppliers}</b> {L(n.suppliers === 1 ? "supplier" : "suppliers", "مورد")}
                        <b>{n.products}</b> {L(n.products === 1 ? "product" : "products", "منتج")}
                      </span>
                      {n.verified ? <span className="cty__ver">{L(`${n.verified} verified`, `${n.verified} موثّق`)}</span> : null}
                      <ArrowRight size={16} className="cty__go" aria-hidden />
                    </Link>
                  ) : (
                    <Link key={c} href={`/${locale}/rfq?city=${encodeURIComponent(c)}`} className="cty__tile is-empty">
                      <span className="cty__name"><MapPin size={16} aria-hidden /> {cityName(c, locale)}</span>
                      <span className="cty__nums">{L("No listed suppliers yet", "ما فيه موردين مسجّلين بعد")}</span>
                      <span className="cty__ask"><Send size={13} aria-hidden /> {L("Request for delivery here", "اطلب بالتوصيل هنا")}</span>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}

        <aside className="vdir__join">
          <div>
            <b>{L("Delivering to several cities?", "التوصيل لأكثر من مدينة؟")}</b>
            <span>{L("Send one request per delivery city so suppliers can price the right freight.", "أرسل طلباً لكل مدينة توصيل عشان يسعّر المورد الشحن صح.")}</span>
          </div>
          <Link href={`/${locale}/rfq`} className="brw__btn brw__btn--dark" style={{ width: "auto" }}>{L("Request quotes", "اطلب عروض أسعار")}</Link>
        </aside>
      </div>
    </div>
  );
}
