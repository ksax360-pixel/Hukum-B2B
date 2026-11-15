import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BadgeCheck, Heart, Search } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PopularProductCard } from "@/components/home/PopularProductCard";
import { toCardItem } from "@/components/products/to-card-item";
import { UnsaveButton } from "@/components/buyer/UnsaveButton";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { cityName } from "@/lib/cities";
import { SavedProduct, SavedVendor } from "@/modules/platform/platform.model";

type Loc = { en?: string; ar?: string };
type V = { _id: unknown; legalName?: Loc; tradeName?: string; slug?: { en?: string }; verificationStatus?: string; location?: { city?: string } };

/** Saved products and suppliers, so a buyer can come back and ask for a price in one tap. */
export default async function BuyerSavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/buyer/saved`)}`);

  let products: Array<Record<string, unknown> & { _id: unknown }> = [];
  let vendors: V[] = [];
  try {
    await connectDB();
    const [sp, sv] = await Promise.all([
      SavedProduct.find({ userId: session.id }).sort({ createdAt: -1 }).limit(120)
        .populate({ path: "productId", match: { status: "published" }, select: "name slug media price unit moq leadTime brand vendorId tags", populate: { path: "vendorId", select: "legalName tradeName slug verificationStatus location" } }).lean(),
      SavedVendor.find({ userId: session.id }).sort({ createdAt: -1 }).limit(60).populate("vendorId", "legalName tradeName slug verificationStatus location").lean(),
    ]);
    products = (sp as Array<{ productId?: Record<string, unknown> & { _id: unknown } }>).map((x) => x.productId).filter((p): p is Record<string, unknown> & { _id: unknown } => Boolean(p));
    vendors = (sv as Array<{ vendorId?: V }>).map((x) => x.vendorId).filter((v): v is V => Boolean(v));
  } catch (e) {
    console.error("[buyer/saved]", e);
  }
  const nm = (v: V): string => v.tradeName || (isAr ? v.legalName?.ar || v.legalName?.en : v.legalName?.en || v.legalName?.ar) || "";

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="bh sv" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Saved", "المحفوظات")}</h1>
            <p>{L("Products and suppliers you kept for later. Ask for a price straight from the card.", "منتجات وموردون حفظتهم لبعدين. اطلب السعر مباشرة من البطاقة.")}</p>
          </div>
        </header>

        {!products.length && !vendors.length ? (
          <div className="vpr-empty">
            <Heart size={24} aria-hidden className="sv-heart" />
            <h2>{L("Nothing saved yet", "ما فيه محفوظات بعد")}</h2>
            <p>{L("Tap the heart on any product to keep it here.", "اضغط القلب على أي منتج ليظهر هنا.")}</p>
            <div className="bh-empty__ways"><Link href={`/${locale}/products`}><Search size={16} aria-hidden /> {L("Browse products", "تصفح المنتجات")}</Link></div>
          </div>
        ) : null}

        {products.length ? (
          <section aria-labelledby="sv-p" className="sv-sec">
            <h2 id="sv-p" className="van-h">{L(`Products · ${products.length}`, `المنتجات · ${products.length}`)}</h2>
            <div className="brw__grid">
              {products.map((p) => (
                <div key={String(p._id)} className="sv-cell">
                  <PopularProductCard locale={locale} item={toCardItem(p as Parameters<typeof toCardItem>[0], locale)} />
                  <UnsaveButton locale={locale} kind="product" id={String(p._id)} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {vendors.length ? (
          <section aria-labelledby="sv-v" className="sv-sec">
            <h2 id="sv-v" className="van-h">{L(`Suppliers · ${vendors.length}`, `الموردون · ${vendors.length}`)}</h2>
            <ul className="vpr-list">
              {vendors.map((v) => (
                <li key={String(v._id)} className="sv-vrow">
                  <Link href={`/${locale}/vendors/${v.slug?.en || String(v._id)}`} className="vpr-row__main">
                    <span className="vpr-thumb is-empty sv-mono" aria-hidden>{nm(v).slice(0, 1)}</span>
                    <span className="vpr-row__text">
                      <b>{nm(v)} {v.verificationStatus === "verified" ? <BadgeCheck size={15} aria-label={L("Verified", "موثّق")} className="sv-tick" /> : null}</b>
                      <span className="vpr-row__meta">{v.location?.city ? cityName(v.location.city, locale) : ""}</span>
                    </span>
                  </Link>
                  <Link href={`/${locale}/rfq?vendorId=${String(v._id)}`} className="vpr-act">{L("Request a quote", "اطلب عرض سعر")}</Link>
                  <UnsaveButton locale={locale} kind="vendor" id={String(v._id)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}
