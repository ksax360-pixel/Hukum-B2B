"use client";

// Supplier microsite: good enough to be the supplier's company website. Their own header, hero, products,
// about, contact and footer, in their brand colour; a slim Hukum ribbon keeps trust (verified) and a way back.
// Seller storefront settings apply: banner, headline, tagline, about text, button label and colour.

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Building2, Check, Flag, MapPin, Search, Send, ShieldCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { BrandMark } from "@/components/brand/BrandMark";
import { PopularProductCard } from "@/components/home/PopularProductCard";
import { toCardItem } from "@/components/products/to-card-item";
import { ContactRevealGate, type RevealedContact } from "@/components/products/ContactRevealGate";
import { vendorHasContact } from "@/lib/public-vendor";
import { vendorLogoUrl, type ProductLike, type VendorLike } from "@/components/products/product-helpers";
import { cityName } from "@/lib/cities";

type StorefrontDesign = {
  headline?: { en?: string; ar?: string };
  tagline?: { en?: string; ar?: string };
  about?: { en?: string; ar?: string };
  bannerText?: { en?: string; ar?: string };
  ctaLabel?: { en?: string; ar?: string };
  primaryColor?: string;
  accentColor?: string;
  layout?: "classic" | "modern" | "bold";
  coverImage?: string;
  bannerImages?: string[];
  logo?: string;
  showProducts?: boolean;
  showCertifications?: boolean;
  showContactCta?: boolean;
};

type Props = {
  locale: Locale;
  vendor: VendorLike & {
    yearEstablished?: number;
    whatsapp?: string;
    hasContact?: boolean;
    coverImage?: string;
    certifications?: string[];
    companyType?: string;
    citiesServed?: string[];
    description?: { en?: string; ar?: string };
    storefront?: { published?: StorefrontDesign | null };
  };
  products: ProductLike[];
  name: string;
  nameSecondary?: string;
  description: string;
  place: string;
  verified: boolean;
};

const TYPE: Record<string, { en: string; ar: string }> = {
  manufacturer: { en: "Manufacturer", ar: "مصنّع" }, distributor: { en: "Distributor", ar: "موزّع" },
  wholesaler: { en: "Wholesaler", ar: "تاجر جملة" }, trading_company: { en: "Trading company", ar: "شركة تجارية" },
  service_provider: { en: "Service provider", ar: "مقدّم خدمة" }, retailer: { en: "Retailer", ar: "تاجر تجزئة" },
};
const pick = (v: { en?: string; ar?: string } | undefined, isAr: boolean): string => (isAr ? v?.ar || v?.en : v?.en || v?.ar) || "";
/** Product group for the chips: the category tag the catalogue import writes, else the brand. */
const groupOf = (p: ProductLike): string => (p.tags || []).find((t) => t.includes("-") && t.length > 3) || p.brand || "";

export function VendorStorefront({ locale, vendor, products, name, nameSecondary, description, place, verified }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const vendorId = String(vendor._id);
  const slug = vendor.slug?.en || vendorId;
  const design = vendor.storefront?.published || null;
  const displayName = pick(design?.headline, isAr) || name;
  const about = pick(design?.about, isAr) || description;
  const tagline = pick(design?.tagline, isAr);
  const notice = pick(design?.bannerText, isAr);
  const ctaLabel = pick(design?.ctaLabel, isAr) || L("Request a quote", "اطلب عرض سعر");
  const logo = design?.logo || vendorLogoUrl(vendor);
  // Only an image the supplier uploaded; product photos stretched into a banner looked broken.
  const banner = design?.bannerImages?.find(Boolean) || design?.coverImage || vendor.coverImage || "";
  const showProducts = design?.showProducts !== false;
  const showCerts = design?.showCertifications !== false;
  const showCta = design?.showContactCta !== false;
  /* Dannii black/white chrome — seller brand colour only if they set one (not the flooded yellow default). */
  const brand = { ["--vms-brand" as string]: design?.primaryColor || "#FFFFFF" } as CSSProperties;

  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [revealed, setRevealed] = useState<RevealedContact | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const g = groupOf(p);
      if (g) map.set(g, (map.get(g) || 0) + 1);
    }
    return [...map].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [products]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) => (!group || groupOf(p) === group) && (!needle || `${p.name?.en || ""} ${p.name?.ar || ""} ${p.brand || ""} ${p.sku || ""}`.toLowerCase().includes(needle))
    );
  }, [products, group, q]);

  const certs = [...new Set((vendor.certifications || []).filter(Boolean))];
  const served = [...new Set((vendor.citiesServed || []).filter(Boolean))];
  const type = vendor.companyType ? TYPE[vendor.companyType] : undefined;
  const founded = vendor.yearEstablished && vendor.yearEstablished > 1900 ? vendor.yearEstablished : null;
  const rfqHref = `/${locale}/rfq?vendorId=${vendorId}`;
  const phone = revealed?.phone || "";
  const email = revealed?.email || "";
  const city = cityName(vendor.location?.city, locale);
  const nav = [
    showProducts ? { href: "#products", label: L("Products", "المنتجات") } : null,
    { href: "#about", label: L("About", "من نحن") },
    { href: "#contact", label: L("Contact", "تواصل") },
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  const searchBox = (cls: string) => (
    <label className={`vms-search ${cls}`}>
      <Search size={16} aria-hidden />
      <span className="sr-only">{L("Search this supplier's products", "ابحث في منتجات المورد")}</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && document.getElementById("products")?.scrollIntoView({ block: "start" })}
        placeholder={L("Search products", "ابحث في المنتجات")}
      />
    </label>
  );

  return (
    <div className="vms" dir={isAr ? "rtl" : "ltr"} style={brand}>
      <div className="vms-ribbon">
        <div className="vms-wrap vms-ribbon__in">
          <Link href={`/${locale}/vendors`} className="vms-ribbon__back">
            <ArrowLeft size={14} aria-hidden /> <BrandMark size={22} /> <span>{L("All suppliers", "كل الموردين")}</span>
          </Link>
          <div className="vms-ribbon__end">
            {verified ? <span className="vms-ribbon__ok"><BadgeCheck size={14} aria-hidden /> {L("Verified by Hukum", "موثّق من حكم")}</span> : null}
            <Link href={`/${isAr ? "en" : "ar"}/vendors/${slug}`} hrefLang={isAr ? "en" : "ar"}>{isAr ? "English" : "العربية"}</Link>
          </div>
        </div>
      </div>

      <header className="vms-head">
        <div className="vms-wrap vms-head__in">
          <a href="#top" className="vms-head__id">
            <span className="vms-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? <img src={logo} alt="" /> : <Building2 size={20} aria-hidden />}
            </span>
            <b>{displayName}</b>
          </a>
          <nav className="vms-head__nav" aria-label={L("Sections", "الأقسام")}>
            {nav.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
          </nav>
          {showProducts && products.length > 6 ? searchBox("vms-head__search") : null}
          {showCta ? <Link href={rfqHref} className="vms-btn vms-btn--brand vms-head__cta"><Send size={15} aria-hidden /> {ctaLabel}</Link> : null}
        </div>
      </header>

      {notice ? <p className="vms-notice">{notice}</p> : null}

      <section id="top" className={`vms-hero${banner ? " has-banner" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {banner ? <img className="vms-hero__img" src={banner} alt="" /> : null}
        <div className="vms-wrap vms-hero__in">
          <div className="vms-hero__text">
            {tagline ? <p className="vms-hero__tag">{tagline}</p> : null}
            <h1>{displayName}</h1>
            {nameSecondary && nameSecondary !== displayName ? <p className="vms-hero__alt" dir={isAr ? "rtl" : "ltr"} lang={isAr ? "en" : "ar"}>{nameSecondary}</p> : null}
            {about ? <p className="vms-hero__lead">{about}</p> : null}
            <div className="vms-hero__act">
              {showCta ? <Link href={rfqHref} className="vms-btn vms-btn--light"><Send size={15} aria-hidden /> {ctaLabel}</Link> : null}
              {showProducts ? <a href="#products" className="vms-btn vms-btn--ghost">{L("View products", "شاهد المنتجات")}</a> : null}
            </div>
          </div>
          <dl className="vms-hero__facts">
            {verified ? <div><dt>{L("Status", "الحالة")}</dt><dd><BadgeCheck size={16} aria-hidden /> {L("Verified", "موثّق")}</dd></div> : null}
            <div><dt>{L("Products", "المنتجات")}</dt><dd>{products.length}</dd></div>
            {founded ? <div><dt>{L("Established", "التأسيس")}</dt><dd>{founded}</dd></div> : null}
            {type ? <div><dt>{L("Business", "النشاط")}</dt><dd>{isAr ? type.ar : type.en}</dd></div> : null}
            {city ? <div><dt>{L("Based in", "المقر")}</dt><dd>{city}</dd></div> : null}
          </dl>
        </div>
      </section>

      <main className="vms-wrap vms-body">
        {showProducts ? (
          <section id="products" className="vms-sec">
            <div className="vms-sec__head">
              <div>
                <p className="vms-catalogue__eyebrow">{L("Catalogue", "الكتالوج")}</p>
                <h2>
                  {L("Products", "المنتجات")} <small>{shown.length}</small>
                </h2>
              </div>
              {searchBox("vms-sec__search")}
            </div>
            {groups.length > 1 ? (
              <div className="vms-switch" role="tablist" aria-label={L("Product groups", "مجموعات المنتجات")}>
                <button
                  type="button"
                  role="tab"
                  className={`vms-switch__btn${!group ? " is-on" : ""}`}
                  aria-selected={!group}
                  onClick={() => setGroup("")}
                >
                  {L("All", "الكل")}
                </button>
                {groups.map(([g]) => (
                  <button
                    key={g}
                    type="button"
                    role="tab"
                    className={`vms-switch__btn${group === g ? " is-on" : ""}`}
                    aria-selected={group === g}
                    onClick={() => setGroup(g)}
                  >
                    <span className="vms-cap">{g.replace(/-/g, " ")}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {shown.length ? (
              <div className="brw__grid vms-grid">
                {shown.map((p) => (
                  <PopularProductCard
                    key={String(p._id)}
                    locale={locale}
                    item={toCardItem(
                      {
                        ...p,
                        vendorId: {
                          _id: vendorId,
                          tradeName: displayName,
                          verificationStatus: verified ? "verified" : "",
                          location: vendor.location,
                        },
                      },
                      locale
                    )}
                  />
                ))}
              </div>
            ) : (
              <p className="pdp2-empty">
                {products.length
                  ? L("Nothing matches that search.", "ما فيه منتج يطابق البحث.")
                  : L("No products listed yet. Send a request and describe what you need.", "ما فيه منتجات معروضة بعد. أرسل طلباً واكتب ما تحتاجه.")}{" "}
                <Link href={rfqHref}>{L("Ask for a quote", "اطلب عرض سعر")}</Link>
              </p>
            )}
          </section>
        ) : null}

        <section id="about" className="vms-sec vms-about">
          <div className="vms-about__text">
            <h2>{L(`About ${displayName}`, `عن ${displayName}`)}</h2>
            {about ? <p className="pdp2-prose">{about}</p> : <p className="pdp2-empty">{L("No company description yet.", "ما فيه نبذة عن الشركة بعد.")}</p>}
            {served.length ? (
              <>
                <h3>{L("We deliver to", "نوصّل إلى")}</h3>
                <ul className="pdp2-certs">{served.map((c) => <li key={c}><MapPin size={14} aria-hidden /> {cityName(c, locale)}</li>)}</ul>
              </>
            ) : null}
            {showCerts && certs.length ? (
              <>
                <h3>{L("Certifications", "الشهادات")}</h3>
                <ul className="pdp2-certs">{certs.map((c) => <li key={c}><ShieldCheck size={14} aria-hidden /> {c}</li>)}</ul>
              </>
            ) : null}
          </div>
          <aside className="vms-trust">
            <h3>{L("What Hukum checked", "وش تحققت منه حكم")}</h3>
            {verified ? (
              <ul className="vsf-checks">
                <li><Check size={16} aria-hidden /> {L("Commercial registration matches the company name", "السجل التجاري يطابق اسم الشركة")}</li>
                <li><Check size={16} aria-hidden /> {L("Company documents reviewed", "تمت مراجعة مستندات الشركة")}</li>
              </ul>
            ) : (
              <p className="pdp2-empty">{L("Not verified yet. Ask for their commercial registration before you order.", "غير موثّق بعد. اطلب السجل التجاري قبل الطلب.")}</p>
            )}
            <Link href={`/${locale}/verification`} className="pdp2-supplier__alt">{L("How verification works", "كيف يتم التوثيق")}</Link>
          </aside>
        </section>

        <section id="contact" className="vms-sec vms-contact">
          <div>
            <h2>{L("Get in touch", "تواصل معنا")}</h2>
            <p className="pdp2-empty">{L("Send a request with what you need, or reveal our number. Hukum logs every reveal so both sides stay protected.", "أرسل طلباً بما تحتاجه، أو اكشف رقمنا. حكم يسجّل كل كشف لحماية الطرفين.")}</p>
            {place ? <p className="vsf-place"><MapPin size={14} aria-hidden /> {place}</p> : null}
          </div>
          <div className="vms-contact__act">
            {showCta ? <Link href={rfqHref} className="vms-btn vms-btn--brand"><Send size={15} aria-hidden /> {ctaLabel}</Link> : null}
            {phone || email ? (
              <div className="vsf-revealed" dir="ltr">
                {phone ? <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a> : null}
                {email ? <a href={`mailto:${email}`}>{email}</a> : null}
              </div>
            ) : vendorHasContact(vendor) ? (
              <ContactRevealGate locale={isAr ? "ar" : "en"} vendorId={vendorId} hasContact onRevealed={setRevealed} />
            ) : null}
          </div>
        </section>
      </main>

      <footer className="vms-foot">
        <div className="vms-wrap vms-foot__in">
          <div className="vms-head__id">
            <span className="vms-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? <img src={logo} alt="" /> : <Building2 size={20} aria-hidden />}
            </span>
            <b>{displayName}</b>
          </div>
          <nav aria-label={L("Footer", "التذييل")}>
            {nav.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
            <Link href={`/${locale}/report?ref=${encodeURIComponent(`/vendors/${slug}`)}`}><Flag size={13} aria-hidden /> {L("Report", "إبلاغ")}</Link>
          </nav>
          <Link href={`/${locale}`} className="vms-foot__hukum">{L("Listed on", "معروض على")} <BrandMark size={26} /></Link>
        </div>
      </footer>
    </div>
  );
}
