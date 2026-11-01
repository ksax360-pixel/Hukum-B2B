export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { searchCatalogProducts } from "@/modules/products/catalog-search";
import { ProductFilters, type Named } from "@/components/products/ProductFilters";
import { ProductCard } from "@/components/products/ProductCard";
import { t as loc } from "@/lib/utils";
import { toPlain, type ProductLike, type VendorLike } from "@/components/products/product-helpers";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const faceted = Object.keys(sp).some((k) => !["page"].includes(k));
  return staticPageMetadata(
    params,
    "/products",
    "ignored",
    undefined,
    { indexable: !faceted, seoKey: "products" }
  );
}

export default async function ProductsPage({
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

  let items: Array<Record<string, unknown>> = [];
  let categories: Named[] = [];
  let industries: Named[] = [];
  let total = 0;

  try {
    await connectDB();
    const [{ items: productRows, total: count }, cats, inds] = await Promise.all([
      searchCatalogProducts({
        q: sp.q,
        city: sp.city || sp.location,
        location: sp.location || sp.city,
        seller: sp.seller || sp.vendor,
        industryId: sp.industryId,
        categoryId: sp.categoryId,
        priceType: sp.priceType,
        availability: sp.availability,
        condition: sp.condition,
        unit: sp.unit,
        currency: sp.currency,
        origin: sp.origin,
        verified: sp.verified,
        featured: sp.featured,
        negotiable: sp.negotiable,
        requestQuote: sp.requestQuote,
        sort: sp.sort,
        page: Number(sp.page || 1) || 1,
        limit: 12,
      }),
      Category.find({ status: "active", level: 1 }).sort({ order: 1 }).lean(),
      Industry.find({ status: "active" }).sort({ order: 1 }).lean(),
    ]);
    items = toPlain(productRows) as Array<Record<string, unknown>>;
    total = count;
    categories = toPlain(cats) as unknown as Named[];
    industries = toPlain(inds) as unknown as Named[];
  } catch {
    /* offline */
  }

  const clearParam = (key: string) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (!v || k === key) continue;
      next.set(k, v);
    }
    const qs = next.toString();
    return `/${locale}/products${qs ? `?${qs}` : ""}`;
  };

  const activeChips: { label: string; href: string }[] = [];
  if (sp.q) activeChips.push({ label: `${isAr ? "بحث" : "Search"}: ${sp.q}`, href: clearParam("q") });
  if (sp.seller || sp.vendor) {
    activeChips.push({
      label: `${isAr ? "البائع" : "Seller"}: ${sp.seller || sp.vendor}`,
      href: clearParam(sp.seller ? "seller" : "vendor"),
    });
  }
  if (sp.city || sp.location) {
    activeChips.push({
      label: `${isAr ? "الموقع" : "Location"}: ${sp.city || sp.location}`,
      href: clearParam(sp.city ? "city" : "location"),
    });
  }
  if (sp.industryId) {
    const ind = industries.find((i) => String(i._id) === sp.industryId);
    activeChips.push({
      label: loc(locale, (ind?.name as { en?: string; ar?: string }) || { en: "Industry", ar: "قطاع" }),
      href: clearParam("industryId"),
    });
  }
  if (sp.categoryId) {
    const cat = categories.find((c) => String(c._id) === sp.categoryId);
    activeChips.push({
      label: loc(locale, (cat?.name as { en?: string; ar?: string }) || { en: "Category", ar: "تصنيف" }),
      href: clearParam("categoryId"),
    });
  }
  if (sp.verified === "true") {
    activeChips.push({ label: isAr ? "موثّق" : "Verified", href: clearParam("verified") });
  }
  if (sp.featured === "true") {
    activeChips.push({ label: isAr ? "مميز" : "Featured", href: clearParam("featured") });
  }

  return (
    <div className="products-shell">
      <div className="container-custom products-page">
        <div className="products-layout">
          <ProductFilters
            locale={locale}
            industries={industries}
            categories={categories}
            params={sp}
            resultCount={total}
          />

          <div className="products-main min-w-0">
            <HukumPageHeader
              locale={locale}
              eyebrow={isAr ? "السوق" : "Marketplace"}
              title={isAr ? "المنتجات" : "Products"}
              lead={
                isAr
                  ? "تصفّح منتجات B2B عبر القطاعات والتصنيفات مع فلاتر دقيقة للمشتريات."
                  : "Browse B2B products across Saudi industries with precise procurement filters."
              }
              crumbs={[
                { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
                { label: isAr ? "المنتجات" : "Products" },
              ]}
              goldEyebrow
            />

            <div className="products-toolbar">
              <p className="products-toolbar__count">
                <span className="font-semibold text-[var(--hukum-ink)] tabular-nums">{total}</span>{" "}
                {isAr ? "منتج" : "products"}
              </p>
              {activeChips.length > 0 && (
                <div className="products-toolbar__chips">
                  {activeChips.map((chip) => (
                    <Link
                      key={chip.href + chip.label}
                      href={chip.href}
                      className="products-chip"
                    >
                      {chip.label}
                      <span aria-hidden className="text-[#8a969b]">
                        ×
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="kt-product-grid">
              {items.length === 0 && (
                <div className="hukum-empty col-span-full">
                  {isAr ? "لا توجد منتجات مطابقة." : "No products match these filters."}
                </div>
              )}
              {items.map((p) => {
                const product = p as ProductLike & {
                  vendorId?: VendorLike;
                  categoryId?: { name?: { en?: string; ar?: string } };
                  industryId?: { name?: { en?: string; ar?: string } };
                };
                return (
                  <ProductCard
                    key={String(product._id)}
                    locale={locale}
                    product={product}
                    vendor={product.vendorId}
                    categoryLabel={loc(locale, product.categoryId?.name)}
                    industryLabel={loc(locale, product.industryId?.name)}
                    source="product_listing"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
