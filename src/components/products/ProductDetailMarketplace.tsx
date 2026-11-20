"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  FileText,
  MapPin,
  Play,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { InterestHeartButton } from "./InterestHeartButton";
import { localizeDuration, unitLabel } from "@/lib/money";
import { rfqPromise } from "@/lib/rfq-promise";
import { cityName } from "@/lib/cities";
import { SaveProductButton } from "./SaveProductButton";
import { ProductReviews } from "./ProductReviews";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import { PopularProductCard } from "@/components/home/PopularProductCard";
import { BrowseSupplierMarquee, type MarqueeSupplier } from "@/components/browse/BrowseSupplierMarquee";
import { toCardItem } from "./to-card-item";
import { pushViewHistory } from "@/lib/view-history";
import {
  formatDocSize,
  formatPrice,
  mediaList,
  productSlug,
  vendorLogoUrl,
  type ProductLike,
  type VendorLike,
} from "./product-helpers";

type MediaItem = { url?: string; type?: string; alt?: string };
type SpecRow = { label: string; value: string };
type DocRow = {
  _id?: string;
  name?: string;
  type?: string;
  fileUrl?: string;
  size?: number;
};
type Related = ProductLike & { vendorId?: VendorLike };

type Props = {
  locale: Locale;
  product: ProductLike & {
    featured?: boolean;
    name?: { en?: string; ar?: string };
  };
  vendor: (VendorLike & {
    yearEstablished?: number;
    whatsapp?: string;
    hasContact?: boolean;
    legal?: { authorizedRepresentative?: string };
  }) | null;
  titleEn: string;
  titleAr: string;
  description: string;
  shortDescription: string;
  applicationsText: string;
  categoryTrail: Array<{ name: string; href: string }>;
  highlights: SpecRow[];
  specRows: SpecRow[];
  keyFeatures: string[];
  docs: DocRow[];
  relatedProducts: Related[];
  /** Same item from other suppliers (see products/[slug]/page.tsx). */
  otherOffers?: Related[];
  vendorProductCount: number;
  enquiryCount?: number;
  reviewScore?: number;
  reviewCount?: number;
};

const DELIVERY_CITIES = [
  { en: "Riyadh", ar: "الرياض" }, { en: "Jeddah", ar: "جدة" }, { en: "Dammam", ar: "الدمام" }, { en: "Khobar", ar: "الخبر" },
  { en: "Mecca", ar: "مكة" }, { en: "Medina", ar: "المدينة" }, { en: "Jubail", ar: "الجبيل" }, { en: "Yanbu", ar: "ينبع" },
  { en: "Tabuk", ar: "تبوك" }, { en: "Abha", ar: "أبها" }, { en: "Qassim", ar: "القصيم" }, { en: "NEOM", ar: "نيوم" },
];

const BUSINESS_TYPE_AR: Record<string, string> = {
  manufacturer: "مصنّع", distributor: "موزّع", wholesaler: "تاجر جملة", trading_company: "شركة تجارية",
  service_provider: "مقدّم خدمة", retailer: "تاجر تجزئة",
};
const VALUE_AR: Record<string, string> = { new: "جديد", used: "مستعمل", refurbished: "مجدّد" };
const cityLabel = (city: string | undefined, isAr: boolean): string => cityName(city, isAr ? "ar" : "en");

const vendorDisplayName = (v: VendorLike | null | undefined, isAr: boolean): string =>
  (v ? (isAr ? v.legalName?.ar || v.legalName?.en : v.legalName?.en || v.legalName?.ar) || v.tradeName : "") || "";

function Gallery({ title, media, isAr }: { title: string; media: MediaItem[]; isAr: boolean }) {
  const items = media.length > 0 ? media : [{ url: "/products/default.jpg", type: "image", alt: title }];
  const [index, setIndex] = useState(0);
  const current = items[index] || items[0];
  const many = items.length > 1;
  const step = (d: number) => setIndex((i) => (i + d + items.length) % items.length);

  return (
    <div className="pdp2-gallery">
      <div className="pdp2-gallery__stage">
        {current?.url ? (
          current.type === "video" ? (
            <video key={current.url} controls>
              <source src={current.url} />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={current.alt || title} />
          )
        ) : null}
        <button
          type="button"
          className="pdp2-gallery__btn pdp2-gallery__btn--expand"
          aria-label={isAr ? "تكبير الصورة" : "Open full size"}
          onClick={() => current?.url && window.open(current.url, "_blank", "noopener")}
        >
          <Expand size={16} aria-hidden />
        </button>
        {many ? (
          <>
            <button type="button" className="pdp2-gallery__btn pdp2-gallery__btn--prev" onClick={() => step(-1)} aria-label={isAr ? "السابق" : "Previous image"}>
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button type="button" className="pdp2-gallery__btn pdp2-gallery__btn--next" onClick={() => step(1)} aria-label={isAr ? "التالي" : "Next image"}>
              <ChevronRight size={18} aria-hidden />
            </button>
            <span className="pdp2-gallery__count">{index + 1} / {items.length}</span>
          </>
        ) : null}
      </div>
      {many ? (
        <div className="pdp2-gallery__thumbs">
          {items.slice(0, 8).map((item, i) => (
            <button
              key={`${item.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${isAr ? "صورة" : "Image"} ${i + 1}`}
              aria-current={i === index}
              className={i === index ? "is-on" : ""}
            >
              {item.type === "video" ? (
                <Play size={14} fill="currentColor" aria-hidden />
              ) : item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProductDetailMarketplace({
  locale,
  product,
  vendor,
  titleEn,
  titleAr,
  description,
  shortDescription,
  applicationsText,
  categoryTrail,
  specRows,
  keyFeatures,
  docs,
  relatedProducts,
  otherOffers = [],
  vendorProductCount,
  reviewScore,
  reviewCount,
}: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const productId = String(product._id);
  const vendorId = vendor?._id ? String(vendor._id) : undefined;
  const displayTitle = isAr ? titleAr || titleEn : titleEn;
  const secondaryTitle = isAr ? titleEn : titleAr;
  const price = formatPrice(product, locale);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    pushViewHistory({
      id: productId,
      slug: productSlug(product),
      name: displayTitle,
      vendorName: vendor ? vendorDisplayName(vendor, isAr) : undefined,
      image: mediaList(product)[0]?.url,
    });
  }, [productId, product, displayTitle, vendor, isAr]);

  const media = useMemo(
    () => mediaList(product).map((m) => ({ url: m.url, type: m.type, alt: (isAr ? m.alt?.ar : m.alt?.en) || displayTitle })),
    [product, isAr, displayTitle]
  );

  const vendorName = vendorDisplayName(vendor, isAr) || L("Supplier", "مورد");
  const verified = vendor?.verificationStatus === "verified";
  const city = cityLabel(vendor?.location?.city, isAr) || L("Saudi Arabia", "السعودية");
  const vendorHref = vendor ? `/${locale}/vendors/${vendor.slug?.en || vendor._id}` : null;
  const founded = vendor?.yearEstablished && vendor.yearEstablished > 1900 ? vendor.yearEstablished : null;
  const certs = [...(product.certifications || []), ...(vendor?.certifications || [])].filter((c, i, arr) => arr.indexOf(c) === i);
  const moqText = product.moq != null ? `${product.moq.toLocaleString("en-US")} ${unitLabel(product.unit, locale)}`.trim() : L("Negotiable", "حسب الاتفاق");
  const leadText = localizeDuration(product.leadTime, locale) || L("On request", "حسب الطلب");
  const quoteHref = `/${locale}/rfq?productId=${productId}${vendorId ? `&vendorId=${vendorId}` : ""}${product.moq ? `&qty=${product.moq}` : ""}`;

  // Offer table: this listing plus the same item from other suppliers, cheapest first.
  const offers = [{ ...product, vendorId: vendor || undefined } as Related, ...otherOffers]
    .map((o) => ({ o, pr: formatPrice(o, locale), v: (o.vendorId || null) as VendorLike | null }))
    .sort((a, b) => (a.pr.amount ?? Infinity) - (b.pr.amount ?? Infinity));
  const pricedCount = offers.filter((x) => x.pr.amount != null).length;

  const specs = (specRows.length
    ? specRows
    : [
        { label: L("Brand", "العلامة"), value: product.brand || "" },
        { label: L("SKU", "رمز المنتج"), value: product.sku || "" },
        { label: L("Lead time", "مدة التوريد"), value: product.leadTime || "" },
      ]
  )
    .filter((r) => r.value)
    .map((r) => (isAr && VALUE_AR[r.value.toLowerCase()] ? { ...r, value: VALUE_AR[r.value.toLowerCase()] } : r));

  const about = description || shortDescription;
  const related = relatedProducts.slice(0, 8);
  const rfqHref = `/${locale}/rfq?productId=${productId}${vendorId ? `&vendorId=${vendorId}` : ""}`;

  const moreSuppliers = useMemo(() => {
    const fallbackName = isAr ? "مورد" : "Supplier";
    const fallbackCity = isAr ? "السعودية" : "Saudi Arabia";
    const map = new Map<string, MarqueeSupplier>();
    const bump = (
      v: (VendorLike & { coverImage?: string }) | null | undefined,
      count = 1,
      imageHint?: string
    ) => {
      if (!v?._id) return;
      const id = String(v._id);
      const slug = v.slug?.en || id;
      const existing = map.get(id);
      if (existing) {
        existing.productCount += count;
        if (!existing.logo && imageHint) existing.logo = imageHint;
        return;
      }
      const logo =
        vendorLogoUrl(v) ||
        (typeof v.coverImage === "string" ? v.coverImage : "") ||
        imageHint ||
        undefined;
      map.set(id, {
        id,
        name: vendorDisplayName(v, isAr) || fallbackName,
        slug,
        cityLabel: cityLabel(v.location?.city, isAr) || fallbackCity,
        verified: v.verificationStatus === "verified",
        logo: logo || undefined,
        productCount: count,
      });
    };
    if (vendor) {
      const primary = mediaList(product as ProductLike)[0]?.url;
      bump(vendor as VendorLike & { coverImage?: string }, Math.max(1, vendorProductCount), primary);
    }
    for (const row of [...otherOffers, ...relatedProducts]) {
      const hint = mediaList(row as ProductLike)[0]?.url;
      bump(row.vendorId as (VendorLike & { coverImage?: string }) | undefined, 1, hint);
    }
    return [...map.values()];
  }, [vendor, vendorProductCount, otherOffers, relatedProducts, isAr, product]);

  return (
    <div className="pdp2" dir={isAr ? "rtl" : "ltr"}>
      <div className="container-custom">
        <nav className="pdp2-crumbs" aria-label={L("Breadcrumb", "مسار التنقل")}>
          <Link href={`/${locale}`}>{L("Home", "الرئيسية")}</Link>
          {categoryTrail.map((c) => (
            <Link key={c.href} href={c.href}>{c.name}</Link>
          ))}
          <span aria-current="page">{displayTitle}</span>
        </nav>

        <div className="pdp2-hero">
          <Gallery title={displayTitle} media={media} isAr={isAr} />

          <div className="pdp2-buy">
            <header className="pdp2-head">
              <h1>{displayTitle}</h1>
              {secondaryTitle && secondaryTitle !== displayTitle ? (
                <p className="pdp2-head__alt" dir={isAr ? "rtl" : "ltr"} lang={isAr ? "en" : "ar"}>{secondaryTitle}</p>
              ) : null}
              <div className="pdp2-head__by">
                {vendorHref ? <Link href={vendorHref}>{vendorName}</Link> : <span>{vendorName}</span>}
                {verified ? (
                  <span className="pdp2-tick"><BadgeCheck size={15} aria-hidden /> {L("Verified", "موثّق")}</span>
                ) : null}
                <span className="pdp2-head__city"><MapPin size={14} aria-hidden /> {city}</span>
                {reviewScore != null && reviewCount ? (
                  <a href="#reviews" className="pdp2-head__rating">
                    <Star size={14} aria-hidden /> {reviewScore.toFixed(1)} <small>({reviewCount})</small>
                  </a>
                ) : null}
              </div>
            </header>

            <div className="pdp2-price">
              <p className="pdp2-price__main">
                <b>{price.label}</b>
                {price.public && price.unit ? <span>{price.unit.replace(/^ \/ /, L("per ", "لكل "))}</span> : null}
              </p>
              {price.compareLabel ? <p className="pdp2-price__was">{L("List price", "السعر المعلن")} <s>{price.compareLabel}</s></p> : null}
              <p className="pdp2-price__hint">{L("Final price depends on quantity and delivery city", "السعر النهائي حسب الكمية ومدينة التوصيل")}</p>
            </div>

            <dl className="pdp2-facts">
              <div><dt>{L("Minimum order", "الحد الأدنى للطلب")}</dt><dd>{moqText}</dd></div>
              <div><dt>{L("Lead time", "مدة التوريد")}</dt><dd>{leadText}</dd></div>
              <div><dt>{L("Ships from", "يُشحن من")}</dt><dd>{city}</dd></div>
            </dl>

            {certs.length ? (
              <ul className="pdp2-certs" aria-label={L("Certifications", "الشهادات")}>
                {certs.slice(0, 4).map((c) => (
                  <li key={c}><ShieldCheck size={14} aria-hidden /> {c}</li>
                ))}
              </ul>
            ) : null}

            <section className="pdp2-act" aria-label={L("Get a price", "اطلب السعر")}>
              <div className="pdp2-act__row">
                <button
                  type="button"
                  className="pdp2-act__primary"
                  aria-expanded={quoteOpen}
                  onClick={() => setQuoteOpen(true)}
                >
                  {L("Request a quote", "اطلب عرض سعر")}
                </button>
                <InterestHeartButton
                  locale={isAr ? "ar" : "en"}
                  productId={productId}
                  productName={displayTitle}
                  vendorId={vendorId}
                  variant="button"
                  size={16}
                  className="pdp2-act__contact-btn"
                />
              </div>

              {quoteOpen ? (
                <form className="pdp2-act__quote" action={`/${locale}/rfq`}>
                  <input type="hidden" name="productId" value={productId} />
                  {vendorId ? <input type="hidden" name="vendorId" value={vendorId} /> : null}
                  <label>
                    <span>{L("Quantity", "الكمية")}</span>
                    <input
                      name="qty"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      defaultValue={product.moq ?? ""}
                      placeholder={L("e.g. 500", "مثال: 500")}
                    />
                  </label>
                  <label>
                    <span>{L("Deliver to", "التوصيل إلى")}</span>
                    <select name="city" required defaultValue="Riyadh">
                      {DELIVERY_CITIES.map((c) => (
                        <option key={c.en} value={c.en}>{isAr ? c.ar : c.en}</option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="pdp2-act__primary pdp2-act__primary--submit">
                    {L("Continue", "متابعة")}
                  </button>
                  <button
                    type="button"
                    className="pdp2-act__cancel"
                    onClick={() => setQuoteOpen(false)}
                  >
                    {L("Cancel", "إلغاء")}
                  </button>
                </form>
              ) : null}

              <p className="pdp2-act__note">{rfqPromise(locale)}</p>

              <div className="pdp2-act__tools">
                <SaveProductButton locale={isAr ? "ar" : "en"} productId={productId} />
                <AddToCompareButton
                  locale={isAr ? "ar" : "en"}
                  item={{
                    id: productId,
                    slug: productSlug(product),
                    name: displayTitle,
                    image: mediaList(product)[0]?.url,
                    vendorName,
                    priceLabel: price.label,
                    moq: product.moq,
                    leadTime: product.leadTime,
                    city: vendor?.location?.city,
                    unit: product.unit,
                    verified,
                  }}
                />
              </div>
            </section>
          </div>
        </div>

        {otherOffers.length ? (
          <section id="offers" className="pdp2-offers" aria-labelledby="pdp2-offers-title">
            <div className="pdp2-sechead">
              <h2 id="pdp2-offers-title">{L(`Compare ${offers.length} suppliers for this item`, `قارن ${offers.length} موردين لهذا المنتج`)}</h2>
              <p>{L("Listed prices before your quote. One request reaches all of them.", "أسعار معروضة قبل عرض السعر. طلب واحد يوصل لهم كلهم.")}</p>
            </div>
            <div className="pdp2-offers__table" role="table" aria-labelledby="pdp2-offers-title">
              <div className="pdp2-offers__row pdp2-offers__row--head" role="row">
                <span role="columnheader">{L("Supplier", "المورد")}</span>
                <span role="columnheader">{L("Price", "السعر")}</span>
                <span role="columnheader">{L("Minimum order", "الحد الأدنى")}</span>
                <span role="columnheader">{L("Lead time", "التوريد")}</span>
              </div>
              {offers.map(({ o, pr, v }, i) => {
                const mine = String(o._id) === productId;
                const row = (
                  <>
                    <span role="cell" className="pdp2-offers__sup">
                      <b>
                        {vendorDisplayName(v, isAr)}
                        {v?.verificationStatus === "verified" ? <BadgeCheck size={14} aria-label={L("Verified", "موثّق")} /> : null}
                      </b>
                      <small>{cityLabel(v?.location?.city, isAr) || L("Saudi Arabia", "السعودية")}</small>
                      {mine ? <em>{L("You are viewing", "المعروض الآن")}</em> : null}
                    </span>
                    <span role="cell" className="pdp2-offers__price">
                      {pr.public ? pr.label : L("Request price", "اطلب السعر")}
                      {i === 0 && pricedCount > 1 ? <em className="is-low">{L("Lowest listed", "الأقل سعراً")}</em> : null}
                    </span>
                    <span role="cell" data-label={L("Min. order", "الحد الأدنى")}>{o.moq != null ? `${o.moq.toLocaleString("en-US")} ${unitLabel(o.unit, locale)}` : "—"}</span>
                    <span role="cell" data-label={L("Lead time", "التوريد")}>{localizeDuration(o.leadTime, locale) || "—"}</span>
                  </>
                );
                return mine ? (
                  <div key={String(o._id)} className="pdp2-offers__row is-mine" role="row">{row}</div>
                ) : (
                  <Link key={String(o._id)} href={`/${locale}/products/${productSlug(o)}`} className="pdp2-offers__row" role="row">{row}</Link>
                );
              })}
            </div>
            <Link href={quoteHref} className="pdp2-offers__cta">{L("Ask all of them for a quote", "اطلب عرض سعر منهم كلهم")}</Link>
          </section>
        ) : null}

        <div className="pdp2-body">
          <div className="pdp2-main">
            <nav className="pdp2-toc" aria-label={L("On this page", "في هذه الصفحة")}>
              <a href="#overview">{L("Overview", "نظرة عامة")}</a>
              {specs.length ? <a href="#specs">{L("Specifications", "المواصفات")}</a> : null}
              <a href="#docs">{L("Documents", "المستندات")}</a>
              <a href="#reviews">{L("Reviews", "التقييمات")}</a>
            </nav>

            <section id="overview" className="pdp2-sec">
              <h2>{L("Overview", "نظرة عامة")}</h2>
              {about ? <p className="pdp2-prose">{about}</p> : <p className="pdp2-empty">{L("The supplier hasn't added a description yet. Ask them in your quote request.", "المورد ما أضاف وصفاً بعد. اسأله في طلب عرض السعر.")}</p>}
              {applicationsText ? (
                <p className="pdp2-prose"><b>{L("Used for", "الاستخدامات")}</b> {applicationsText}</p>
              ) : null}
              {keyFeatures.length ? (
                <ul className="pdp2-points">
                  {keyFeatures.map((f) => <li key={f}>{f}</li>)}
                </ul>
              ) : null}
            </section>

            {specs.length ? (
              <section id="specs" className="pdp2-sec">
                <h2>{L("Specifications", "المواصفات")}</h2>
                <dl className="pdp2-spec">
                  {specs.map((r) => (
                    <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section id="docs" className="pdp2-sec">
              <h2>{L("Certificates and documents", "الشهادات والمستندات")}</h2>
              {docs.length ? (
                <ul className="pdp2-docs">
                  {docs.map((doc) => (
                    <li key={String(doc._id)}>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <FileText size={18} aria-hidden />
                        <span><b>{doc.name || doc.type}</b><small>{[doc.type?.replace(/_/g, " "), formatDocSize(doc.size)].filter(Boolean).join(", ")}</small></span>
                        <Download size={16} aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pdp2-empty">
                  {certs.length
                    ? L(`Listed: ${certs.join(", ")}. Certificate files aren't public yet.`, `المذكور: ${certs.join("، ")}. ملفات الشهادات غير منشورة بعد.`)
                    : L("No documents published yet.", "ما فيه مستندات منشورة بعد.")}{" "}
                  <Link href={`/${locale}/rfq?productId=${productId}&intent=documents`}>{L("Ask for datasheets with your quote", "اطلب النشرات الفنية مع عرض السعر")}</Link>
                </p>
              )}
            </section>

            <section id="reviews" className="pdp2-sec">
              <h2>{L("Reviews", "التقييمات")}</h2>
              <ProductReviews locale={isAr ? "ar" : "en"} productId={productId} averageHint={reviewScore} countHint={reviewCount} />
            </section>
          </div>

          {vendor ? (
            <aside className="pdp2-supplier" aria-label={L("Supplier", "المورد")}>
              <div className="pdp2-supplier__id">
                <span className="pdp2-supplier__logo">
                  {vendorLogoUrl(vendor) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vendorLogoUrl(vendor)} alt="" />
                  ) : (
                    vendorName.slice(0, 1)
                  )}
                </span>
                <span>
                  <b>{vendorName}</b>
                  <small>{city}</small>
                </span>
              </div>
              {verified ? (
                <p className="pdp2-supplier__check"><BadgeCheck size={16} aria-hidden /> {L("Verified: commercial record and documents reviewed by Hukum", "موثّق: راجعت حكم السجل التجاري والمستندات")}</p>
              ) : (
                <p className="pdp2-supplier__check is-off">{L("Not verified yet", "غير موثّق بعد")}</p>
              )}
              <dl className="pdp2-supplier__facts">
                {founded ? <div><dt>{L("Established", "سنة التأسيس")}</dt><dd>{founded}</dd></div> : null}
                {vendorProductCount > 0 ? <div><dt>{L("Products listed", "المنتجات المعروضة")}</dt><dd>{vendorProductCount}</dd></div> : null}
                {vendor.companyType ? <div><dt>{L("Business type", "نوع النشاط")}</dt><dd className="is-cap">{(isAr && BUSINESS_TYPE_AR[vendor.companyType]) || vendor.companyType.replace(/_/g, " ")}</dd></div> : null}
              </dl>
              {vendorHref ? <Link href={vendorHref} className="pdp2-supplier__link">{L("View supplier profile", "ملف المورد")}</Link> : null}
              <Link href={`/${locale}/rfq?productId=${productId}&intent=custom`} className="pdp2-supplier__alt">
                {L("Need a different size or spec? Describe it in a request", "تحتاج مقاس أو مواصفة مختلفة؟ اكتبها في طلب")}
              </Link>
            </aside>
          ) : null}
        </div>

        {related.length ? (
          <section className="pdp2-related" aria-labelledby="pdp2-related-title">
            <div className="pdp2-sechead">
              <h2 id="pdp2-related-title">{L("More in this category", "المزيد في هذا القسم")}</h2>
              {categoryTrail.at(-1) ? <Link href={categoryTrail.at(-1)!.href}>{L("See all", "عرض الكل")}</Link> : null}
            </div>
            <div className="pdp2-related__grid">
              {related.map((p) => (
                <PopularProductCard key={String(p._id)} locale={locale} item={toCardItem(p, locale)} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Mobile: the two actions stay in thumb reach (D14). Sits above the bottom tab bar. */}
        <div className="pdp-sticky" role="group" aria-label={L("Actions", "إجراءات")}>
          <InterestHeartButton locale={isAr ? "ar" : "en"} productId={productId} productName={displayTitle} vendorId={vendorId} variant="button" size={16} />
          <Link href={quoteHref} className="pdp-sticky__quote">{L("Request quotes", "اطلب عروض الأسعار")}</Link>
        </div>
      </div>

      <div className="brw-below pdp2-below">
        {moreSuppliers.length ? (
          <section className="brw-band brw-band--suppliers" aria-labelledby="pdp2-suppliers-title">
            <div className="brw-band__wrap">
              <hr className="brw-band__rule" />
              <header className="brw-band__head">
                <div>
                  <p className="brw-band__eyebrow">{L("In this category", "في هذا القسم")}</p>
                  <h2 id="pdp2-suppliers-title" className="brw-band__title">
                    {L("More suppliers", "المزيد من الموردين")}
                  </h2>
                </div>
                <Link href={`/${locale}/vendors`} className="brw-band__link">
                  {L("All suppliers", "كل الموردين")}
                  <ChevronRight size={14} aria-hidden />
                </Link>
              </header>
            </div>
            <div className="pdp2-below__bleed">
              <BrowseSupplierMarquee
                locale={locale}
                suppliers={moreSuppliers}
                productsLabel={L("products", "منتج")}
                verifiedLabel={L("Verified", "موثّق")}
              />
            </div>
          </section>
        ) : null}

        <section className="brw-band brw-band--ask pdp2-below__ask" aria-labelledby="pdp2-ask-title">
          <div className="pdp2-below__ask-wrap">
            <hr className="brw-band__rule" />
            <div className="brw-ask">
              <div className="brw-ask__copy">
                <p className="brw-ask__eyebrow">خدمات التوريد الخاصة</p>
                <h2 id="pdp2-ask-title" className="brw-ask__title">
                  {L("Can't find the exact spec?", "ما لقيت المواصفات المطلوبة؟")}
                </h2>
                <p className="brw-ask__text">
                  {L(
                    "We'll get you verified quotations from 3 or more suppliers, in days, not weeks. Contact details stay private until you choose.",
                    "نجيب لك عروض أسعار من 3 موردين موثّقين أو أكثر، خلال أيام مو أسابيع. وبياناتك تبقى خاصة حتى تختار."
                  )}
                </p>
              </div>
              <Link href={rfqHref} className="brw-ask__cta">
                <Send size={15} aria-hidden />
                {L("Describe what you need", "اكتب ما تحتاجه")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
