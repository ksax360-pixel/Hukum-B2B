export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { FileCheck2, Layers, ScanSearch, Send } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendors/brands", "ignored", undefined, { seoKey: "vendors-brands" });
}

type BrandRow = { brand: string; products: number; suppliers: number };

/** Brands buyers can source on Hukum (from live listings), plus the three checks before buying a branded item. */
export default async function VendorBrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  let brands: BrandRow[] = [];
  try {
    await connectDB();
    const rows = await Product.aggregate([
      { $match: { status: "published", brand: { $nin: [null, ""] } } },
      { $group: { _id: "$brand", products: { $sum: 1 }, vendors: { $addToSet: "$vendorId" } } },
      { $sort: { products: -1, _id: 1 } },
      { $limit: 60 },
    ]);
    brands = rows.map((r: { _id: string; products: number; vendors: unknown[] }) => ({ brand: r._id, products: r.products, suppliers: r.vendors.length }));
  } catch (e) {
    console.error("[vendors/brands]", e);
  }

  const checks = [
    { icon: FileCheck2, b: L("Ask for the authorisation letter", "اطلب خطاب التفويض"), t: L("A current letter from the brand, or the brand's own partner checker where it has one.", "خطاب حديث من العلامة، أو أداة التحقق الرسمية إن وُجدت.") },
    { icon: Layers, b: L("Check what it covers", "تأكد من نطاقه"), t: L("Authorisation can be limited to certain product lines, regions or channels.", "التفويض قد يقتصر على خطوط منتجات أو مناطق أو قنوات معيّنة.") },
    { icon: ScanSearch, b: L("Match the quote to the model", "طابق العرض مع الموديل"), t: L("Model number, warranty, country of origin and after-sales support, in writing.", "رقم الموديل والضمان وبلد المنشأ وخدمة ما بعد البيع، مكتوبة.") },
  ];

  return (
    <div className="hiw brd" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("Source by brand", "ابحث بالعلامة التجارية")}</h1>
          <p>{L("Brands listed by suppliers on Hukum. Pick one to see every listing and compare the suppliers who carry it.", "العلامات اللي يعرضها الموردون في حكم. اختر علامة وشوف كل عروضها وقارن الموردين اللي يوفرونها.")}</p>
        </header>

        {brands.length ? (
          <ul className="brd__grid">
            {brands.map((b) => (
              <li key={b.brand}>
                <Link href={`/${locale}/products?q=${encodeURIComponent(b.brand)}`} className="brd__tile">
                  <span className="brd__mono" aria-hidden>{b.brand.replace(/\bdemo\b/i, "").trim().slice(0, 2)}</span>
                  <span className="brd__name">{b.brand}</span>
                  <span className="brd__nums">
                    {L(`${b.products} ${b.products === 1 ? "product" : "products"}`, `${b.products} منتج`)}
                    <i aria-hidden />
                    {L(`${b.suppliers} ${b.suppliers === 1 ? "supplier" : "suppliers"}`, `${b.suppliers} مورد`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pdp2-empty">{L("No branded listings yet.", "ما فيه عروض بعلامات تجارية بعد.")}</p>
        )}

        <section className="brd__checks" aria-labelledby="brd-checks">
          <h2 id="brd-checks">{L("Before you buy a branded product", "قبل ما تشتري منتجاً بعلامة تجارية")}</h2>
          <ul>
            {checks.map((c) => (
              <li key={c.b}>
                <span aria-hidden><c.icon size={20} /></span>
                <b>{c.b}</b>
                <p>{c.t}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="vdir__join">
          <div>
            <b>{L("Brand not here?", "العلامة مو موجودة؟")}</b>
            <span>{L("Send a request with the brand and model. Say whether equivalents are acceptable.", "أرسل طلباً بالعلامة والموديل، ووضّح إذا تقبل البدائل.")}</span>
          </div>
          <Link href={`/${locale}/rfq`} className="brw__btn brw__btn--dark" style={{ width: "auto" }}><Send size={15} aria-hidden /> {L("Request quotes", "اطلب عروض أسعار")}</Link>
        </aside>
      </div>
    </div>
  );
}
