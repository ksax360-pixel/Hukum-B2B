"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Shield,
  Sparkles,
  Truck,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { InterestHeartButton } from "@/components/products/InterestHeartButton";
import { ContactRevealGate, type RevealedContact } from "@/components/products/ContactRevealGate";
import { vendorHasContact } from "@/lib/public-vendor";
import {
  formatPrice,
  mediaList,
  productSlug,
  vendorLogoUrl,
  type ProductLike,
  type VendorLike,
} from "@/components/products/product-helpers";

type CatChip = { key: string; label: string; image?: string; count: number };

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

export function VendorStorefront({
  locale,
  vendor,
  products,
  name,
  nameSecondary,
  description,
  place,
  verified,
}: Props) {
  const isAr = locale === "ar";
  const vendorId = String(vendor._id);
  const design = vendor.storefront?.published || null;
  const primary = design?.primaryColor || "#17634B";
  const accent = design?.accentColor || "#C4A574";
  const layout = design?.layout || "classic";
  const displayName =
    (isAr ? design?.headline?.ar || design?.headline?.en : design?.headline?.en || design?.headline?.ar) ||
    name;
  const displayDesc =
    (isAr ? design?.about?.ar || design?.about?.en : design?.about?.en || design?.about?.ar) ||
    description;
  const tagline = isAr
    ? design?.tagline?.ar || design?.tagline?.en || ""
    : design?.tagline?.en || design?.tagline?.ar || "";
  const bannerText = isAr
    ? design?.bannerText?.ar || design?.bannerText?.en || ""
    : design?.bannerText?.en || design?.bannerText?.ar || "";
  const ctaLabel = isAr
    ? design?.ctaLabel?.ar || design?.ctaLabel?.en || "اطلب عرض سعر"
    : design?.ctaLabel?.en || design?.ctaLabel?.ar || "Request quotation";
  const logo = design?.logo || vendorLogoUrl(vendor);
  const bannerImages = useMemo(() => {
    const fromDesign = Array.isArray(design?.bannerImages)
      ? design!.bannerImages!.map((u) => String(u || "").trim()).filter(Boolean)
      : [];
    if (fromDesign.length) return fromDesign.slice(0, 2);
    const fallback =
      design?.coverImage ||
      vendor.coverImage ||
      mediaList(products[0] || {})[0]?.url ||
      "/categories/safety-equipment.jpg";
    return fallback ? [fallback] : [];
  }, [design, vendor.coverImage, products]);
  const cover =
    bannerImages[0] ||
    design?.coverImage ||
    vendor.coverImage ||
    "/categories/safety-equipment.jpg";
  const showProducts = design?.showProducts !== false;
  const showCerts = design?.showCertifications !== false;
  const showCta = design?.showContactCta !== false;
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [revealed, setRevealed] = useState<RevealedContact | null>(null);
  const contactPhone = revealed?.phone || vendor.phone || "";
  const contactEmail = revealed?.email || vendor.email || "";
  const needsReveal = !contactPhone && !contactEmail && vendorHasContact(vendor);

  useEffect(() => {
    if (bannerImages.length < 2) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % bannerImages.length), 5000);
    return () => clearInterval(t);
  }, [bannerImages.length]);

  const categories = useMemo(() => {
    const map = new Map<string, CatChip>();
    for (const p of products) {
      const key =
        (p.tags || []).find((t) => t.includes("-") && t.length > 3) ||
        p.brand ||
        "general";
      const label = key.replace(/-/g, " ");
      const img = mediaList(p)[0]?.url;
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        if (!prev.image && img) prev.image = img;
      } else {
        map.set(key, { key, label, image: img, count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCat !== "all") {
      list = list.filter((p) => {
        const key =
          (p.tags || []).find((t) => t.includes("-") && t.length > 3) ||
          p.brand ||
          "general";
        return key === activeCat;
      });
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((p) => {
        const blob = `${p.name?.en || ""} ${p.name?.ar || ""} ${p.brand || ""} ${p.sku || ""}`.toLowerCase();
        return blob.includes(needle);
      });
    }
    return list;
  }, [products, activeCat, q]);

  // Only show years when yearEstablished is real — no demo fallback (e.g. hardcoded "5+").
  const years =
    vendor.yearEstablished && vendor.yearEstablished > 1900
      ? Math.max(1, new Date().getFullYear() - vendor.yearEstablished)
      : null;
  const certs = (vendor.certifications || []).filter(Boolean);
  const typeLabel = vendor.companyType ? vendor.companyType.replace(/_/g, " ") : "";

  const features = [
    {
      icon: Package,
      label: isAr ? "نطاق منتجات واسع" : "Wide Product Range",
    },
    {
      icon: Truck,
      label: isAr ? "توريد موثوق" : "Reliable Supply",
    },
    {
      icon: Sparkles,
      label: isAr ? "حلول مخصصة" : "Customized Solutions",
    },
    {
      icon: Globe2,
      label: isAr ? "معايير سعودية" : "Saudi Standards",
    },
  ];

  return (
    <div
      className={`min-h-screen text-[var(--hukum-ink)] ${layout === "bold" ? "bg-[var(--hukum-green-dark)]" : "bg-[var(--hukum-surface)]"}`}
      style={
        {
          ["--sf-primary" as string]: primary,
          ["--sf-accent" as string]: accent,
        } as CSSProperties
      }
      data-sf-layout={layout}
    >
      {bannerText ? (
        <div className="px-4 py-2 text-center text-xs font-semibold text-white" style={{ background: accent }}>
          {bannerText}
        </div>
      ) : null}
      {/* Vendor utility bar — mockup style */}
      <div className="bg-[var(--hukum-green-dark)] text-white">
        <div className="container-custom flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-white/85">
            {contactPhone ? (
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Phone size={12} />
                {contactPhone}
              </a>
            ) : null}
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Mail size={12} />
                {contactEmail}
              </a>
            ) : null}
            {needsReveal ? (
              <ContactRevealGate
                locale={isAr ? "ar" : "en"}
                vendorId={vendorId}
                hasContact
                compact
                onRevealed={setRevealed}
                className="text-[#e8d5a3]"
              />
            ) : null}
            {place ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} />
                {place}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-white/80">
            {verified ? (
              <span className="inline-flex items-center gap-1 text-[#e8d5a3]">
                <BadgeCheck size={12} />
                {isAr ? "مورد موثّق" : "Verified Seller"}
              </span>
            ) : null}
            <Link href={`/${locale === "ar" ? "en" : "ar"}/vendors/${vendor.slug?.en || vendorId}`} className="hover:text-white">
              {locale === "ar" ? "EN" : "العربية"}
            </Link>
          </div>
        </div>
      </div>

      {/* Vendor sticky nav */}
      <header className="sticky top-0 z-30 border-b border-[#e6e2da] bg-white/95 backdrop-blur">
        <div className="container-custom flex flex-wrap items-center gap-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/${locale}`} className="hidden text-[11px] font-semibold text-[#8a8a8a] hover:text-[var(--hukum-green)] sm:inline">
              Hukum
            </Link>
            <Link href={`/${locale}/vendors/${vendor.slug?.en || vendorId}`} className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e6e2da] bg-[#f0eeea]">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Building2 size={18} style={{ color: accent }} />
                )}
              </span>
              <span className="truncate text-sm font-bold text-[#1a1612]">{displayName}</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-medium text-[#4a4a4a] lg:flex">
            <a href="#home" className="hover:text-[var(--hukum-green)]">
              {isAr ? "الرئيسية" : "Home"}
            </a>
            <a href="#about" className="hover:text-[var(--hukum-green)]">
              {isAr ? "من نحن" : "About Us"}
            </a>
            <a href="#products" className="hover:text-[var(--hukum-green)]">
              {isAr ? "المنتجات" : "Products"}
            </a>
            <a href="#certs" className="hover:text-[var(--hukum-green)]">
              {isAr ? "الشهادات" : "Certifications"}
            </a>
            <a href="#contact" className="hover:text-[var(--hukum-green)]">
              {isAr ? "تواصل" : "Contact"}
            </a>
          </nav>

          <div className="ms-auto flex min-w-[180px] max-w-xs flex-1 items-center gap-2 rounded-lg border border-[#e6e2da] bg-[#f8f8f8] px-3 py-2">
            <Search size={14} className="shrink-0 text-[var(--hukum-green)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isAr ? "ابحث في منتجات هذا المورد…" : "Search this seller’s products…"}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </header>

      {/* Hero — up to 2 uploaded banner images */}
      <section id="home" className="relative min-h-[360px] overflow-hidden md:min-h-[420px]">
        {bannerImages.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="absolute inset-0 scale-105 bg-cover bg-center transition-opacity duration-700"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === bannerIdx % bannerImages.length ? 1 : 0,
            }}
            aria-hidden={i !== bannerIdx % bannerImages.length}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
        {bannerImages.length > 1 ? (
          <div className="absolute bottom-4 start-1/2 z-10 flex -translate-x-1/2 gap-2 md:start-auto md:end-6 md:translate-x-0">
            {bannerImages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setBannerIdx(i)}
                className={`h-2.5 w-2.5 rounded-full border border-white/70 ${
                  i === bannerIdx % bannerImages.length ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        ) : null}
        <div className="container-custom relative grid min-h-[360px] items-end gap-8 py-10 md:min-h-[420px] md:grid-cols-[1.2fr_280px] md:py-14">
          <div className="max-w-2xl pb-1 text-white">
            <p className="m-0 text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>
              {tagline || (isAr ? "فولاذ بجودة أعلى لغد أقوى" : "Quality supply for a stronger tomorrow")}
            </p>
            <h1
              className={`mt-2 mb-0 font-bold leading-tight ${layout === "modern" ? "text-[2.4rem] md:text-[3.1rem]" : "text-[2rem] md:text-[2.6rem]"}`}
            >
              {displayName}
            </h1>
            {nameSecondary && nameSecondary !== displayName ? (
              <p className="mt-1 mb-0 text-lg text-white/85" dir={isAr ? "ltr" : "rtl"}>
                {nameSecondary}
              </p>
            ) : null}
            {displayDesc ? (
              <p className="mt-4 mb-0 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                {displayDesc}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {showCta ? (
                <Link
                  href={`/${locale}/rfq?vendor=${vendorId}`}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                  style={{ background: primary }}
                >
                  <Mail size={16} />
                  {ctaLabel}
                </Link>
              ) : null}
              {showProducts ? (
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/50 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  {isAr ? "منتجاتنا" : "Our Products"}
                  <ArrowRight size={16} />
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 self-center md:gap-3">
            {(
              [
                years != null
                  ? { value: String(years), label: isAr ? "سنوات عمل" : "Years in Business" }
                  : null,
                {
                  value: String(products.length),
                  label: isAr ? "منتجات" : "Products",
                },
                certs[0]
                  ? { value: certs[0], label: isAr ? "اعتماد" : "Certified" }
                  : verified
                    ? { value: isAr ? "موثّق" : "Verified", label: isAr ? "التحقق" : "Status" }
                    : null,
                typeLabel
                  ? {
                      value: typeLabel.split(" ")[0],
                      label: isAr ? "نوع المورد" : "Supplier Type",
                    }
                  : null,
              ] as Array<{ value: string; label: string } | null>
            )
              .filter((s): s is { value: string; label: string } => Boolean(s))
              .map((s) => (
                <div key={s.label} className="rounded-xl border border-white/15 bg-black/45 p-3 backdrop-blur-sm">
                  <p className="m-0 text-lg font-bold capitalize text-[#e8d5a3]">{s.value}</p>
                  <p className="mt-1 mb-0 text-[11px] text-white/70">{s.label}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y border-[#e6e2da] bg-white">
        <div className="container-custom grid grid-cols-2 gap-4 py-5 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3 text-sm font-semibold text-[#1a1612]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#C4A574]/50 text-[var(--hukum-badge)]">
                <f.icon size={16} />
              </span>
              {f.label}
            </div>
          ))}
        </div>
      </section>

      <div className="container-custom py-10 md:py-12">
        {/* Categories */}
        {categories.length > 0 ? (
          <section className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="m-0 text-xl font-bold text-[#1a1612]">
                {isAr ? "فئات المنتجات" : "Our Product Categories"}
              </h2>
              <a href="#products" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--hukum-green)]">
                {isAr ? "عرض الكل" : "View All Categories"}
                <ArrowRight size={14} />
              </a>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setActiveCat("all")}
                className={`w-[140px] shrink-0 overflow-hidden rounded-xl border bg-white text-start ${
                  activeCat === "all" ? "border-[#C4A574] ring-1 ring-[#C4A574]/40" : "border-[var(--hukum-border)]"
                }`}
              >
                <span className="block aspect-[4/3] bg-[#f0eeea]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="block px-3 py-2.5 text-xs font-semibold text-[#1a1612]">
                  {isAr ? "الكل" : "All Products"}
                </span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveCat(c.key)}
                  className={`w-[140px] shrink-0 overflow-hidden rounded-xl border bg-white text-start capitalize ${
                    activeCat === c.key ? "border-[#C4A574] ring-1 ring-[#C4A574]/40" : "border-[var(--hukum-border)]"
                  }`}
                >
                  <span className="block aspect-[4/3] bg-[#f0eeea]">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="block px-3 py-2.5 text-xs font-semibold text-[#1a1612]">
                    {c.label}
                    <em className="mt-0.5 block text-[10px] font-normal not-italic text-[#8a8a8a]">
                      {c.count} {isAr ? "منتج" : "items"}
                    </em>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* Featured / seller products */}
        {showProducts ? (
        <section id="products" className="mb-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="m-0 text-xl font-bold text-[#1a1612]">
                {isAr ? "منتجات هذا المورد" : "Featured Products"}
              </h2>
              <p className="mt-1 mb-0 text-sm text-[#6b6b6b]">
                {filtered.length} {isAr ? "منتج من" : "products from"} {displayName}
              </p>
            </div>
            <Link
              href={`/${locale}/rfq?vendor=${vendorId}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--hukum-green)]"
            >
              {isAr ? "عرض الكل" : "View All Products"}
              <ArrowRight size={14} />
            </Link>
          </div>

          {filtered.length === 0 ? (
            <div className="kt-vendor-empty rounded-xl px-6 py-14 text-sm">
              {isAr ? "لا توجد منتجات مطابقة." : "No products match this filter."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
              {filtered.map((p) => {
                const href = `/${locale}/products/${productSlug(p)}`;
                const title = isAr ? p.name?.ar || p.name?.en || "" : p.name?.en || p.name?.ar || "";
                const img = mediaList(p)[0]?.url;
                const spec = [p.brand, p.sku].filter(Boolean).join(" · ");
                const price = formatPrice(p, locale);
                return (
                  <article
                    key={String(p._id)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-[#e6e2da] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]"
                  >
                    <div className="relative aspect-[4/3] bg-[#f0eeea]">
                      <Link href={href} className="absolute inset-0 block" tabIndex={-1} aria-hidden>
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : null}
                      </Link>
                      <div className="absolute end-2.5 top-2.5 z-20" onClick={(e) => e.stopPropagation()}>
                        <InterestHeartButton
                          locale={locale}
                          productId={String(p._id)}
                          productName={title}
                          vendorId={vendorId}
                          size={14}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#16a34a] hover:text-[#15803d]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
                      <Link
                        href={href}
                        className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[var(--hukum-ink)] hover:text-[var(--hukum-green)]"
                      >
                        {title}
                      </Link>
                      {spec ? <p className="m-0 line-clamp-1 text-xs text-[#8a8a8a]">{spec}</p> : null}
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-bold text-[#1a1612]">{price.label}</span>
                        {price.compareLabel ? (
                          <span className="text-xs text-[#9a9a9a] line-through">{price.compareLabel}</span>
                        ) : null}
                      </div>
                      <Link
                        href={`/${locale}/rfq?product=${p._id}&vendorId=${vendorId}`}
                        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--hukum-green)] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[var(--hukum-green-hover)]"
                      >
                        <Mail size={14} />
                        {isAr ? "طلب عرض سعر" : "Request a Quote"}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        ) : null}

        {/* About + certs */}
        <section id="about" className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-[#e6e2da] bg-white p-6">
            <h2 className="m-0 text-xl font-bold text-[#1a1612]">
              {isAr ? `عن ${displayName}` : `About ${displayName}`}
            </h2>
            <p className="mt-3 mb-0 text-sm leading-relaxed text-[#4a4a4a]">
              {displayDesc ||
                (isAr
                  ? `${displayName} مورد على Hukum يقدّم منتجات B2B موثوقة.`
                  : `${displayName} is a Hukum supplier offering reliable B2B products.`)}
            </p>
            <a
              href="#contact"
              className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              style={{ background: accent }}
            >
              {isAr ? "اعرف المزيد عنا" : "Learn More About Us"}
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#e6e2da] bg-[#f0eeea]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full min-h-[220px] w-full object-cover" />
            ) : null}
          </div>
        </section>

        {showCerts ? (
        <section id="certs" className="mb-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="m-0 text-xl font-bold text-[#1a1612]">
              {isAr ? "شهاداتنا" : "Our Certifications"}
            </h2>
          </div>
          {certs.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {certs.slice(0, 4).map((c) => (
                <div
                  key={c}
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-[#e6e2da] bg-white p-4 text-center"
                >
                  <FileText size={22} className="mb-2" style={{ color: accent }} />
                  <span className="text-xs font-semibold text-[#1a1612]">{c}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-[#8a8a8a]">
              {isAr ? "لا توجد شهادات منشورة بعد." : "No published certifications yet."}
            </p>
          )}
        </section>
        ) : null}

        <section id="contact" className="rounded-xl border border-[#e6e2da] bg-white p-6">
          <h2 className="m-0 mb-4 text-xl font-bold text-[#1a1612]">
            {isAr ? "تواصل مع المورد" : "Contact"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            {contactPhone ? (
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-[var(--hukum-ink)] hover:text-[var(--hukum-green)]">
                <Phone size={14} className="text-[var(--hukum-green)]" />
                {contactPhone}
              </a>
            ) : null}
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 text-[var(--hukum-ink)] hover:text-[var(--hukum-green)]">
                <Mail size={14} className="text-[var(--hukum-green)]" />
                {contactEmail}
              </a>
            ) : null}
            {needsReveal ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <ContactRevealGate
                  locale={isAr ? "ar" : "en"}
                  vendorId={vendorId}
                  hasContact
                  onRevealed={setRevealed}
                />
              </div>
            ) : null}
            {place ? (
              <span className="inline-flex items-center gap-2 text-[#1a1612]">
                <MapPin size={14} className="text-[var(--hukum-green)]" />
                {place}
              </span>
            ) : null}
          </div>
        </section>
      </div>

    </div>
  );
}
