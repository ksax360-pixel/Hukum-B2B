"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Expand,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Star,
  Ruler,
  Shield,
  Sparkles,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { InterestHeartButton } from "./InterestHeartButton";
import { SaveProductButton } from "./SaveProductButton";
import { ContactRevealGate, type RevealedContact } from "./ContactRevealGate";
import { ProductReviews } from "./ProductReviews";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import { vendorHasContact } from "@/lib/public-vendor";
import { pushViewHistory } from "@/lib/view-history";
import {
  formatDocSize,
  formatPrice,
  mediaList,
  pickHighlights,
  productSlug,
  vendorLogoUrl,
  whatsappLink,
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
  vendorProductCount: number;
  enquiryCount?: number;
  reviewScore?: number;
  reviewCount?: number;
};

type TabKey =
  | "details"
  | "specs"
  | "certs"
  | "docs"
  | "supplier"
  | "reviews"
  | "qa";

const PANEL = "rounded-xl border border-[#e6e2da] bg-transparent";
const SOFT = "rounded-xl border border-[#e6d7b8] bg-[#f0e8d8]/55";
const FEATURE_ICONS = [Shield, Ruler, BadgeCheck, Sparkles];

function Gallery({
  title,
  media,
  locale,
  productId,
  vendorId,
}: {
  title: string;
  media: MediaItem[];
  locale: Locale;
  productId: string;
  vendorId?: string;
}) {
  const items =
    media.length > 0 ? media : [{ url: "/products/default.jpg", type: "image", alt: title }];
  const [index, setIndex] = useState(0);
  const current = items[index] || items[0];
  const isVideo = current?.type === "video";

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <div className="flex gap-2.5 md:gap-3">
      {items.length > 1 ? (
        <div className="hidden w-[68px] shrink-0 flex-col gap-2 md:flex lg:w-[76px]">
          {items.slice(0, 6).map((item, i) => (
            <button
              key={`${item.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative aspect-square w-full overflow-hidden rounded-lg border bg-[#f0eeea] ${
                i === index ? "border-[#c9a962] ring-1 ring-[#c9a962]/40" : "border-[#e6e2da]"
              }`}
            >
              {item.type === "video" ? (
                <span className="flex h-full w-full items-center justify-center text-[#1a1612]/70">
                  <Play size={14} fill="currentColor" />
                </span>
              ) : item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border border-[#e6e2da] bg-[#f0eeea] md:min-h-[400px] lg:min-h-[440px]">
        {current?.url ? (
          isVideo ? (
            <video key={current.url} className="h-full w-full object-contain" controls>
              <source src={current.url} />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.alt || title}
              className="h-full w-full object-contain p-2"
            />
          )
        ) : null}

        <div className="absolute end-3 top-3 z-30 pointer-events-auto">
          <InterestHeartButton
            locale={locale === "ar" ? "ar" : "en"}
            productId={productId}
            productName={title}
            vendorId={vendorId}
            size={20}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[#16a34a] hover:text-[#15803d]"
          />
        </div>

        <button
          type="button"
          className="absolute end-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#e6e2da] bg-[#f5f3ef]/95 text-[#1a1612]"
          aria-label="Expand"
          onClick={() => current?.url && window.open(current.url, "_blank")}
        >
          <Expand size={15} />
        </button>

        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute start-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6e2da] bg-[#f5f3ef]/95 text-[#1a1612]"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6e2da] bg-[#f5f3ef]/95 text-[#1a1612]"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

const IMG_BG = "bg-[#f0eeea]";

function RelatedCard({
  locale,
  product,
  isAr,
}: {
  locale: Locale;
  product: Related;
  isAr: boolean;
}) {
  const href = `/${locale}/products/${productSlug(product)}`;
  const name = isAr
    ? product.name?.ar || product.name?.en || ""
    : product.name?.en || product.name?.ar || "";
  const img = mediaList(product)[0]?.url;
  const price = formatPrice(product, locale);
  const relatedVendorId =
    product.vendorId && typeof product.vendorId === "object" && "_id" in product.vendorId
      ? String((product.vendorId as VendorLike)._id)
      : undefined;

  return (
    <article className="group w-[min(220px,70vw)] shrink-0 overflow-hidden rounded-xl border border-[#e6e2da] bg-transparent snap-start md:w-[240px]">
      <div className={`relative aspect-[4/3] ${IMG_BG}`}>
        <Link href={href} className="absolute inset-0 block">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={name}
              className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
            />
          ) : null}
        </Link>
        <div className="absolute end-2.5 top-2.5 z-10">
          <InterestHeartButton
            locale={locale === "ar" ? "ar" : "en"}
            productId={String(product._id)}
            productName={name}
            vendorId={relatedVendorId}
            size={16}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#16a34a] hover:text-[#15803d]"
          />
        </div>
      </div>
      <div className="px-3 py-3">
        <Link
          href={href}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[#1a1612] hover:text-[#b8953d]"
        >
          {name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold text-[#1a1612]">{price.label}</span>
          {price.compareLabel ? (
            <span className="text-xs text-[#9a9a9a] line-through">{price.compareLabel}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function RelatedRail({
  locale,
  products,
  isAr,
}: {
  locale: Locale;
  products: Related[];
  isAr: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 4;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [products.length]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(520, Math.max(240, el.clientWidth * 0.75));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  if (!products.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByDir(-1)}
        disabled={!canPrev}
        aria-label={isAr ? "السابق" : "Previous"}
        className="absolute start-0 top-[38%] z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6e2da] bg-[#f5f3ef] text-[#1a1612] shadow-sm disabled:pointer-events-none disabled:opacity-30 md:start-0 md:-translate-x-1/2"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => scrollByDir(1)}
        disabled={!canNext}
        aria-label={isAr ? "التالي" : "Next"}
        className="absolute end-0 top-[38%] z-10 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6e2da] bg-[#f5f3ef] text-[#1a1612] shadow-sm disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={20} />
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth px-1 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-4"
      >
        {products.map((p) => (
          <RelatedCard key={String(p._id)} locale={locale} product={p} isAr={isAr} />
        ))}
      </div>
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
  highlights,
  specRows,
  keyFeatures,
  docs,
  relatedProducts,
  vendorProductCount,
  enquiryCount,
  reviewScore,
  reviewCount,
}: Props) {
  const isAr = locale === "ar";
  const productId = String(product._id);
  const vendorId = vendor?._id ? String(vendor._id) : undefined;
  const displayTitle = isAr ? titleAr || titleEn : titleEn;
  const secondaryTitle = isAr ? titleEn : titleAr;
  // Only show real metrics — never invent public counts (PDF p.18).
  const rating = reviewScore;
  const reviews = reviewCount;
  const enquiries = enquiryCount;
  const [tab, setTab] = useState<TabKey>("details");
  const [revealed, setRevealed] = useState<RevealedContact | null>(null);
  const price = formatPrice(product, locale);
  // Contacts only after /api/contact-reveal — never trust SSR/API vendor fields (Risk C1).
  const contactPhone = revealed?.phone || "";
  const contactEmail = revealed?.email || "";
  const contactWa = revealed?.whatsapp || "";
  const contactWebsite = revealed?.website || "";
  const canShowContact = Boolean(contactPhone || contactEmail || contactWa || contactWebsite);
  const needsReveal = !canShowContact && vendorHasContact(vendor);

  useEffect(() => {
    pushViewHistory({
      id: productId,
      slug: productSlug(product),
      name: displayTitle,
      vendorName: vendor
        ? (isAr ? vendor.legalName?.ar || vendor.legalName?.en : vendor.legalName?.en) || vendor.tradeName
        : undefined,
      image: mediaList(product)[0]?.url,
    });
  }, [productId, product, displayTitle, vendor, isAr]);

  const media = useMemo(
    () =>
      mediaList(product).map((m) => ({
        url: m.url,
        type: m.type,
        alt: (isAr ? m.alt?.ar : m.alt?.en) || displayTitle,
      })),
    [product, isAr, displayTitle]
  );

  const vendorName = vendor
    ? (isAr ? vendor.legalName?.ar || vendor.legalName?.en : vendor.legalName?.en || vendor.legalName?.ar) ||
      vendor.tradeName ||
      "Supplier"
    : isAr
      ? "مورد"
      : "Supplier";
  const vendorPlace = [vendor?.location?.city, vendor?.location?.country === "SA" ? (isAr ? "السعودية" : "Saudi Arabia") : vendor?.location?.country || (isAr ? "السعودية" : "Saudi Arabia")]
    .filter(Boolean)
    .join(", ");
  const vendorHref = vendor ? `/${locale}/vendors/${vendor.slug?.en || vendor._id}` : null;
  const years =
    vendor?.yearEstablished && vendor.yearEstablished > 1900
      ? Math.max(1, new Date().getFullYear() - vendor.yearEstablished)
      : null;
  const wa = whatsappLink(contactWa);
  const certs = [
    ...(product.certifications || []),
    ...(vendor?.certifications || []),
  ].filter((c, i, arr) => arr.indexOf(c) === i);
  const contactName =
    vendor?.legal?.authorizedRepresentative ||
    vendor?.tradeName ||
    (isAr ? "فريق المبيعات" : "Sales Team");
  const featureItems =
    highlights.length > 0
      ? highlights.slice(0, 4)
      : pickHighlights(product, locale).slice(0, 4);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "details", label: isAr ? "تفاصيل المنتج" : "Product Details" },
    { key: "specs", label: isAr ? "المواصفات" : "Specifications" },
    { key: "certs", label: isAr ? "الشهادات" : "Certifications" },
    { key: "docs", label: isAr ? "المستندات الفنية" : "Technical Documents" },
    { key: "supplier", label: isAr ? "معلومات المورد" : "Supplier Information" },
    { key: "reviews", label: isAr ? (reviews != null ? `التقييمات (${reviews})` : "التقييمات") : reviews != null ? `Reviews (${reviews})` : "Reviews" },
    { key: "qa", label: isAr ? "أسئلة وأجوبة" : "Q&A" },
  ];

  const featuresList =
    keyFeatures.length > 0
      ? keyFeatures
      : [
          isAr ? "جودة صناعية موثوقة للتوريد B2B" : "Industrial-grade quality for B2B procurement",
          isAr ? "متوافق مع متطلبات المشاريع السعودية" : "Suitable for Saudi project requirements",
          product.moq != null
            ? isAr
              ? `حد أدنى للطلب: ${product.moq}${product.unit ? ` ${product.unit}` : ""}`
              : `MOQ: ${product.moq}${product.unit ? ` ${product.unit}` : ""}`
            : isAr
              ? "طلبات بالجملة والمواصفات المخصصة"
              : "Bulk orders and custom specifications",
          product.leadTime
            ? isAr
              ? `مدة التوريد: ${product.leadTime}`
              : `Lead time: ${product.leadTime}`
            : isAr
              ? "توريد سريع داخل المملكة"
              : "Fast supply across the Kingdom",
          certs[0]
            ? isAr
              ? `شهادات: ${certs.slice(0, 3).join("، ")}`
              : `Certifications: ${certs.slice(0, 3).join(", ")}`
            : vendor?.verificationStatus === "verified"
              ? isAr
                ? "من مورد موثّق على Hukum"
                : "From a verified Hukum supplier"
              : isAr
                ? "معروض على Hukum"
                : "Listed on Hukum",
          applicationsText ||
            (isAr ? "مناسب لمواقع الإنشاء والمنشآت الصناعية" : "Ideal for construction and industrial sites"),
        ].filter(Boolean) as string[];

  const tableRows =
    specRows.length > 0
      ? specRows
      : [
          { label: isAr ? "العلامة" : "Brand", value: product.brand || "—" },
          { label: isAr ? "رمز المنتج" : "SKU", value: product.sku || "—" },
          {
            label: isAr ? "المنشأ" : "Country of Origin",
            value: product.countryOfOrigin || "Saudi Arabia",
          },
          { label: isAr ? "مدة التوريد" : "Lead Time", value: product.leadTime || "—" },
        ];

  return (
    <div className="min-h-screen bg-[#f5f3ef]">
      <div className="container-custom py-6 md:py-8">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#8a8a8a]">
          <Link href={`/${locale}`} className="hover:text-[#1a1612]">
            {isAr ? "الرئيسية" : "Home"}
          </Link>
          {categoryTrail.map((c) => (
            <span key={c.href} className="inline-flex items-center gap-2">
              <span>/</span>
              <Link href={c.href} className="hover:text-[#1a1612]">
                {c.name}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="text-[#1a1612]">{displayTitle}</span>
        </nav>

        {/* Hero: gallery | info | supplier */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_290px]">
          <Gallery
            title={displayTitle}
            media={media}
            locale={locale}
            productId={productId}
            vendorId={vendorId}
          />

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              {vendor?.verificationStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe8d8] bg-[#e8f6ee]/70 px-2.5 py-1 text-xs font-semibold text-[#1f7a45]">
                  <BadgeCheck size={12} />
                  {isAr ? "مورد موثّق" : "Verified Supplier"}
                </span>
              ) : null}
              {certs[0] ? (
                <span className="inline-flex items-center rounded-full border border-[#e6d7b8] bg-[#f3ead7]/70 px-2.5 py-1 text-xs font-semibold text-[#8a6a2b]">
                  {certs[0]} {isAr ? "معتمد" : "Certified"}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-[#d5dde8] bg-[#e8eef5]/70 px-2.5 py-1 text-xs font-semibold text-[#3d5a80]">
                {product.featured
                  ? isAr
                    ? "منتج شائع"
                    : "Popular Product"
                  : isAr
                    ? "منتج مميز"
                    : "Featured Listing"}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <h1 className="m-0 min-w-0 flex-1 text-[1.7rem] font-bold leading-[1.15] tracking-tight text-[#1a1612] md:text-[2rem]">
                {displayTitle}
              </h1>
              <div className="mt-1 flex shrink-0 items-center gap-1.5">
                <InterestHeartButton
                  locale={isAr ? "ar" : "en"}
                  productId={productId}
                  productName={displayTitle}
                  vendorId={vendorId}
                  size={20}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[#16a34a] hover:text-[#15803d]"
                />
                <SaveProductButton locale={isAr ? "ar" : "en"} productId={productId} />
              </div>
            </div>
            {secondaryTitle && secondaryTitle !== displayTitle ? (
              <p className="mt-1.5 mb-0 text-lg text-[#5c5c5c] md:text-xl" dir={isAr ? "ltr" : "rtl"}>
                {secondaryTitle}
              </p>
            ) : null}

            {rating != null && reviews != null ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#5c5c5c]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#1a1612]">
                  <Star size={14} className="fill-[#c9a962] text-[#c9a962]" />
                  {rating}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[#c9a962]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < Math.round(rating) ? "fill-[#c9a962] text-[#c9a962]" : "text-[#d9d3c8]"}
                    />
                  ))}
                </span>
                <span>
                  ({reviews} {isAr ? "تقييم" : "reviews"})
                </span>
                {enquiries != null ? (
                  <>
                    <span className="text-[#cfc8bc]">|</span>
                    <span>
                      {enquiries.toLocaleString()} {isAr ? "استفسار" : "enquiries"}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-bold tracking-tight text-[#1a1612] md:text-[1.75rem]">
                {price.label}
              </span>
              {price.compareLabel ? (
                <span className="text-base text-[#9a9a9a] line-through decoration-[#9a9a9a]">
                  {price.compareLabel}
                </span>
              ) : null}
              {price.detail ? (
                <span className="text-sm text-[#8a8a8a]">{price.detail}</span>
              ) : null}
            </div>

            {(shortDescription || description) && (
              <p className="mt-4 mb-0 text-sm leading-relaxed text-[#4a4a4a] md:text-[0.95rem]">
                {shortDescription || description}
              </p>
            )}

            {featureItems.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
                {featureItems.map((item, i) => {
                  const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                  return (
                    <div key={`${item.label}-${i}`} className="text-center">
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a962] text-[#c9a962]">
                        <Icon size={20} strokeWidth={1.6} />
                      </div>
                      <p className="m-0 text-[0.72rem] font-semibold leading-snug text-[#1a1612]">
                        {item.value}
                      </p>
                      <p className="m-0 mt-0.5 text-[0.62rem] text-[#8a8a8a]">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className={`mt-5 flex items-start gap-3 px-4 py-3.5 ${SOFT}`}>
              <ClipboardList size={18} className="mt-0.5 shrink-0 text-[#c9a962]" />
              <div>
                <p className="m-0 text-sm font-semibold text-[#1a1612]">
                  {isAr ? "طلبات بالجملة ومواصفات مخصصة" : "Bulk Orders & Custom Specifications"}
                </p>
                <p className="mt-0.5 mb-0 text-xs leading-relaxed text-[#6b6b6b]">
                  {isAr
                    ? "احصل على أفضل الأسعار للكميات الكبيرة ومتطلبات المشاريع."
                    : "Get best prices for large quantities and project requirements."}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier sidebar */}
          <aside className={`${PANEL} p-4`}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e6e2da] bg-[#ebe7df]">
                {vendorLogoUrl(vendor) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendorLogoUrl(vendor)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-[#c9a962]">{vendorName.slice(0, 1)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-bold text-[#1a1612]">{vendorName}</p>
                {vendor?.verificationStatus === "verified" ? (
                  <p className="mt-0.5 mb-0 inline-flex items-center gap-1 text-xs font-semibold text-[#1f7a45]">
                    <BadgeCheck size={12} />
                    {isAr ? "مورد موثّق" : "Verified Supplier"}
                  </p>
                ) : null}
                {vendorPlace ? (
                  <p className="mt-1 mb-0 inline-flex items-center gap-1 text-xs text-[#8a8a8a]">
                    <MapPin size={12} />
                    {vendorPlace}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#e6e2da] py-3 text-center">
              <div>
                <p className="m-0 text-sm font-bold text-[#1a1612]">{rating != null ? rating : "—"}</p>
                <p className="m-0 text-[0.62rem] leading-tight text-[#8a8a8a]">
                  {isAr ? "تقييم المورد" : "Supplier Rating"}
                </p>
              </div>
              <div>
                <p className="m-0 text-sm font-bold text-[#1a1612]">{years != null ? `${years}+` : "—"}</p>
                <p className="m-0 text-[0.62rem] leading-tight text-[#8a8a8a]">
                  {isAr ? "سنوات عمل" : "Years in Business"}
                </p>
              </div>
              <div>
                <p className="m-0 text-sm font-bold text-[#1a1612]">{vendorProductCount > 0 ? `${vendorProductCount}` : "—"}</p>
                <p className="m-0 text-[0.62rem] leading-tight text-[#8a8a8a]">
                  {isAr ? "منتجات" : "Products"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <InterestHeartButton
                locale={isAr ? "ar" : "en"}
                productId={productId}
                productName={displayTitle}
                vendorId={vendorId}
                variant="button"
                size={16}
              />
              <Link
                href={`/${locale}/rfq?product=${productId}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c9a962] px-3 py-3 text-sm font-semibold text-white hover:bg-[#b8953d]"
              >
                <Mail size={16} />
                {isAr ? "طلب عرض سعر" : "Request a Quote"}
              </Link>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#25D366]/35 bg-transparent px-3 py-2.5 text-sm font-semibold text-[#128C7E] hover:bg-[#e8f6ee]/50"
                >
                  <MessageCircle size={16} />
                  {isAr ? "محادثة واتساب" : "Chat on WhatsApp"}
                </a>
              ) : (
                <Link
                  href={`/${locale}/rfq?product=${productId}&intent=inquiry`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e6e2da] bg-transparent px-3 py-2.5 text-sm font-semibold text-[#1a1612] hover:border-[#c9a962]/50"
                >
                  <MessageCircle size={16} />
                  {isAr ? "أرسل استفساراً" : "Send Inquiry"}
                </Link>
              )}
              <Link
                href={`/${locale}/rfq?product=${productId}&intent=add`}
                className="inline-flex items-center justify-center rounded-lg border border-[#e6e2da] bg-transparent px-2 py-2 text-xs font-semibold text-[#1a1612] hover:border-[#c9a962]/50"
              >
                {isAr ? "أضف لطلب السعر" : "Add to RFQ"}
              </Link>
            </div>

            <div className="mt-4 rounded-lg border border-[#e6e2da] bg-[#ebe7df]/45 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6e2da] bg-[#ebe7df] text-xs font-bold text-[#1a1612]">
                  {contactName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="m-0 text-xs font-semibold text-[#1a1612]">{contactName}</p>
                  <p className="m-0 text-[0.65rem] text-[#8a8a8a]">
                    {isAr ? "مدير المبيعات" : "Sales Manager"}
                  </p>
                </div>
              </div>
              {contactPhone ? (
                <a
                  href={`tel:${contactPhone.replace(/\s/g, "")}`}
                  className="mt-2 flex items-center gap-2 text-xs text-[#1a1612] hover:text-[#c9a962]"
                >
                  <Phone size={12} />
                  {contactPhone}
                </a>
              ) : null}
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-1 flex items-center gap-2 text-xs text-[#1a1612] hover:text-[#c9a962]"
                >
                  <Mail size={12} />
                  {contactEmail}
                </a>
              ) : null}
              {contactWebsite ? (
                <a
                  href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-xs text-[#1a1612] hover:text-[#c9a962]"
                >
                  {contactWebsite}
                </a>
              ) : null}
              {needsReveal ? (
                <ContactRevealGate
                  locale={isAr ? "ar" : "en"}
                  productId={productId}
                  vendorId={vendorId}
                  hasContact
                  onRevealed={setRevealed}
                />
              ) : null}
              <div className="mt-2">
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
                    verified: vendor?.verificationStatus === "verified",
                  }}
                />
              </div>
            </div>

            {vendorHref ? (
              <Link
                href={vendorHref}
                className={`mt-3 inline-flex w-full items-center justify-center px-3 py-2.5 text-xs font-semibold text-[#8a6a2b] hover:text-[#1a1612] ${SOFT}`}
              >
                {isAr ? "عرض ملف الشركة ←" : "View Company Profile →"}
              </Link>
            ) : null}
          </aside>
        </div>

        {/* Tabs */}
        <div className="mt-8 overflow-x-auto border-b border-[#e6e2da]">
          <div className="flex min-w-max gap-0.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-3 text-sm font-semibold transition md:px-4 ${
                  tab === t.key
                    ? "border-b-2 border-[#c9a962] text-[#1a1612]"
                    : "text-[#8a8a8a] hover:text-[#1a1612]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {tab === "details" || tab === "specs" ? (
            <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr_0.9fr]">
              <section className={`${PANEL} p-5`}>
                <h2 className="m-0 text-base font-bold text-[#1a1612]">
                  {isAr ? "وصف المنتج" : "Product Description"}
                </h2>
                <p className="mt-3 mb-0 text-sm leading-relaxed text-[#4a4a4a]">
                  {description ||
                    shortDescription ||
                    (vendor?.verificationStatus === "verified"
                      ? isAr
                        ? "منتج B2B معروض على Hukum من مورد موثّق."
                        : "B2B product listed on Hukum from a verified supplier."
                      : isAr
                        ? "منتج B2B معروض على Hukum."
                        : "B2B product listed on Hukum.")}
                </p>
                {applicationsText ? (
                  <p className="mt-3 mb-0 text-sm leading-relaxed text-[#4a4a4a]">
                    <strong className="text-[#1a1612]">
                      {isAr ? "الاستخدامات: " : "Applications: "}
                    </strong>
                    {applicationsText}
                  </p>
                ) : null}

                <h3 className="mt-5 mb-3 text-sm font-bold text-[#1a1612]">
                  {isAr ? "الميزات الرئيسية" : "Key Features"}
                </h3>
                <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
                  {featuresList.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#4a4a4a]">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#c9a962]" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={`${PANEL} p-5`}>
                <h2 className="m-0 mb-3 text-base font-bold text-[#1a1612]">
                  {isAr ? "المواصفات الفنية" : "Technical Specifications"}
                </h2>
                <div className="overflow-hidden rounded-lg border border-[#e6e2da]">
                  <table className="w-full text-sm">
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr
                          key={row.label}
                          className={i % 2 === 0 ? "bg-[#ebe7df]/55" : "bg-transparent"}
                        >
                          <th className="w-[44%] px-3 py-2.5 text-start font-medium text-[#6b6b6b]">
                            {row.label}
                          </th>
                          <td className="px-3 py-2.5 capitalize text-[#1a1612]">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="flex flex-col gap-4">
                <section className={`${PANEL} p-5`}>
                  <h2 className="m-0 mb-3 text-base font-bold text-[#1a1612]">
                    {isAr ? "الشهادات" : "Certifications"}
                  </h2>
                  {certs.length ? (
                    <div className="grid grid-cols-3 gap-2">
                      {certs.slice(0, 3).map((c) => (
                        <div
                          key={c}
                          className="flex aspect-[3/4] flex-col items-center justify-center rounded-lg border border-[#e6e2da] bg-[#ebe7df]/45 p-2 text-center"
                        >
                          <FileText size={20} className="mb-2 text-[#c9a962]" />
                          <span className="text-[0.62rem] font-semibold leading-tight text-[#1a1612]">
                            {c}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-sm text-[#8a8a8a]">
                      {isAr ? "لا توجد شهادات مرفقة بعد." : "No certificates attached yet."}
                    </p>
                  )}
                </section>

                <section className={`${SOFT} p-5`}>
                  <h2 className="m-0 text-base font-bold text-[#1a1612]">
                    {isAr ? "تحتاج مواصفة مختلفة؟" : "Need Different Specification?"}
                  </h2>
                  <p className="mt-2 mb-4 text-xs leading-relaxed text-[#6b6b6b]">
                    {isAr
                      ? "اطلب عرض سعر مخصص للمقاسات والكميات والمعايير التي تحتاجها."
                      : "Request a custom quotation from our verified suppliers."}
                  </p>
                  <Link
                    href={`/${locale}/rfq?product=${productId}&intent=custom`}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#c9a962] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#b8953d]"
                  >
                    {isAr ? "طلب عرض مخصص" : "Request a Custom Quote"}
                  </Link>
                </section>
              </aside>
            </div>
          ) : null}

          {tab === "certs" ? (
            <section className={`${PANEL} p-5`}>
              <h2 className="m-0 mb-4 text-base font-bold text-[#1a1612]">
                {isAr ? "الشهادات والامتثال" : "Certifications & Compliance"}
              </h2>
              {certs.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {certs.map((c) => (
                    <div
                      key={c}
                      className="flex items-center gap-3 rounded-lg border border-[#e6e2da] bg-[#ebe7df]/45 p-3"
                    >
                      <BadgeCheck className="text-[#c9a962]" size={20} />
                      <span className="text-sm font-semibold text-[#1a1612]">{c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-sm text-[#8a8a8a]">
                  {isAr ? "لا توجد شهادات مرفقة." : "No certifications listed."}
                </p>
              )}
            </section>
          ) : null}

          {tab === "docs" ? (
            <section className={`${PANEL} p-5`}>
              <h2 className="m-0 mb-4 text-base font-bold text-[#1a1612]">
                {isAr ? "المستندات الفنية" : "Technical Documents"}
              </h2>
              {docs.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {docs.map((doc) => (
                    <a
                      key={String(doc._id)}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-[#e6e2da] bg-transparent px-3 py-3 hover:border-[#c9a962]"
                    >
                      <Download size={16} className="text-[#c9a962]" />
                      <span className="min-w-0">
                        <strong className="block truncate text-sm text-[#1a1612]">
                          {doc.name || doc.type}
                        </strong>
                        <span className="text-xs text-[#8a8a8a]">
                          {[doc.type?.replace(/_/g, " "), formatDocSize(doc.size)]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-[#e6e2da] bg-[#ebe7df]/45 p-4 text-sm text-[#6b6b6b]">
                  {isAr
                    ? "المستندات غير متاحة للتحميل العام — اطلبها عبر عرض السعر."
                    : "Documents are not publicly downloadable — request them via quote."}
                  <Link
                    href={`/${locale}/rfq?product=${productId}&intent=documents`}
                    className="mt-3 inline-flex rounded-lg bg-[#c9a962] px-3 py-2 text-xs font-semibold text-white"
                  >
                    {isAr ? "طلب المستندات" : "Request Documents"}
                  </Link>
                </div>
              )}
            </section>
          ) : null}

          {tab === "supplier" && vendor ? (
            <section className={`${PANEL} p-5`}>
              <h2 className="m-0 mb-3 text-base font-bold text-[#1a1612]">
                {isAr ? "معلومات المورد" : "Supplier Information"}
              </h2>
              <p className="m-0 text-sm leading-relaxed text-[#4a4a4a]">
                {(isAr ? vendor.description?.ar : vendor.description?.en) ||
                  (isAr
                    ? `${vendorName} مورد على Hukum من ${vendorPlace || "السعودية"}.`
                    : `${vendorName} is a Hukum supplier based in ${vendorPlace || "Saudi Arabia"}.`)}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: isAr ? "النوع" : "Type", value: vendor.companyType?.replace(/_/g, " ") },
                  { label: isAr ? "الموقع" : "Location", value: vendorPlace },
                  {
                    label: isAr ? "الشهادات" : "Certifications",
                    value: vendor.certifications?.join(", "),
                  },
                  { label: isAr ? "شروط الدفع" : "Payment terms", value: vendor.paymentTerms },
                  { label: isAr ? "مدة التوريد" : "Lead time", value: vendor.leadTime },
                  { label: isAr ? "الحد الأدنى" : "MOQ", value: vendor.moq },
                ]
                  .filter((r) => r.value)
                  .map((r) => (
                    <div
                      key={r.label}
                      className="rounded-lg border border-[#e6e2da] bg-[#ebe7df]/45 px-3 py-2.5"
                    >
                      <p className="m-0 text-[0.65rem] uppercase tracking-wide text-[#8a8a8a]">
                        {r.label}
                      </p>
                      <p className="m-0 mt-1 text-sm font-semibold capitalize text-[#1a1612]">
                        {r.value}
                      </p>
                    </div>
                  ))}
              </div>
              {vendorHref ? (
                <Link
                  href={vendorHref}
                  className="mt-4 inline-flex text-sm font-semibold text-[#c9a962] hover:underline"
                >
                  {isAr ? "عرض ملف الشركة الكامل ←" : "View full company profile →"}
                </Link>
              ) : null}
            </section>
          ) : null}

          {tab === "reviews" ? (
            <section className={`${PANEL} p-5`}>
              <h2 className="m-0 mb-3 text-base font-bold text-[#1a1612]">
                {isAr ? "التقييمات" : "Reviews"}
              </h2>
              <ProductReviews
                locale={isAr ? "ar" : "en"}
                productId={productId}
                averageHint={rating}
                countHint={reviews}
              />
            </section>
          ) : null}

          {tab === "qa" ? (
            <section className={`${PANEL} p-5`}>
              <h2 className="m-0 mb-4 text-base font-bold text-[#1a1612]">
                {isAr ? "أسئلة وأجوبة" : "Q&A"}
              </h2>
              <div className="space-y-3">
                {[
                  product.moq != null
                    ? {
                        q: isAr ? "ما الحد الأدنى للطلب؟" : "What is the MOQ?",
                        a: `${product.moq}${product.unit ? ` ${product.unit}` : ""}`,
                      }
                    : null,
                  product.leadTime
                    ? {
                        q: isAr ? "ما مدة التوريد؟" : "What is the lead time?",
                        a: product.leadTime,
                      }
                    : null,
                  {
                    q: isAr ? "هل يمكن تخصيص المواصفات؟" : "Can specifications be customized?",
                    a: isAr
                      ? "نعم — أرسل طلب عرض مخصص عبر الزر الذهبي."
                      : "Yes — submit a custom quote request using the gold CTA.",
                  },
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <details
                      key={item!.q}
                      className="rounded-lg border border-[#e6e2da] bg-[#ebe7df]/45 px-4 py-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-[#1a1612]">
                        {item!.q}
                      </summary>
                      <p className="mt-2 mb-0 text-sm text-[#4a4a4a]">{item!.a}</p>
                    </details>
                  ))}
              </div>
            </section>
          ) : null}
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="m-0 text-lg font-bold text-[#1a1612]">
                {isAr ? "منتجات ذات صلة" : "Related Products"}
              </h2>
              <p className="m-0 text-xs text-[#8a8a8a]">
                {relatedProducts.length} {isAr ? "منتج" : "products"}
              </p>
            </div>
            <RelatedRail locale={locale} products={relatedProducts} isAr={isAr} />
          </section>
        ) : null}
      </div>

    </div>
  );
}
