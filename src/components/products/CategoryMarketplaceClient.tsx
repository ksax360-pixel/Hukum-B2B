"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  MapPin,
  ArrowRight,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ListingProductCard } from "./ListingProductCard";
import type { ProductLike, VendorLike } from "./product-helpers";

export type SubCategoryChip = {
  key: string;
  slug: string;
  name: { en?: string; ar?: string };
  image?: string;
  count?: number;
};

type SortKey = "relevance" | "price_asc" | "price_desc" | "newest";

type ListingRow = ProductLike & {
  vendorId?: VendorLike;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  categoryKey?: string;
  subcategoryKeys?: string[];
  certifications?: string[];
};

type Props = {
  locale: Locale;
  titleEn: string;
  titleAr: string;
  description: string;
  heroImage: string;
  categorySlug: string;
  catalogKey: string;
  products: ListingRow[];
  subcategories: SubCategoryChip[];
  productCountLabel?: string;
  vendorCountLabel?: string;
  rfqHref: string;
  parentBreadcrumb?: { name: string; href: string } | null;
};

const PAGE_SIZE = 20;

function stem(token: string) {
  const t = token.toLowerCase();
  if (t.endsWith("ies") && t.length > 4) return t.slice(0, -3) + "y";
  if (t.endsWith("ves") && t.length > 4) return t.slice(0, -3) + "f";
  if (t.endsWith("s") && !t.endsWith("ss") && t.length > 3) return t.slice(0, -1);
  return t;
}

function matchesSub(p: ListingRow, subKey: string, subNameEn?: string) {
  const keys = [p.categoryKey, ...(p.subcategoryKeys || [])].filter(Boolean) as string[];
  if (keys.includes(subKey)) return true;

  const blob = `${p.name?.en || ""} ${p.name?.ar || ""} ${p.sku || ""} ${p.brand || ""}`.toLowerCase();
  // Prefer distinctive tokens (skip generic "safety" / "protection")
  const skip = new Set(["safety", "protection", "equipment", "industrial"]);
  const tokens = subKey
    .split("-")
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 2 && !skip.has(t));
  if (tokens.some((t) => blob.includes(t) || blob.includes(stem(t)))) return true;

  const nameBits = (subNameEn || "")
    .toLowerCase()
    .split(/[\s&/]+/)
    .map((t) => t.replace(/[^a-z0-9-]/g, ""))
    .filter((t) => t.length > 3 && !skip.has(t));
  if (nameBits.some((t) => blob.includes(t) || blob.includes(stem(t)))) return true;
  return false;
}

export function CategoryMarketplaceClient({
  locale,
  titleEn,
  titleAr,
  description,
  heroImage,
  categorySlug,
  catalogKey,
  products,
  subcategories,
  productCountLabel,
  vendorCountLabel,
  rfqHref,
  parentBreadcrumb,
}: Props) {
  const isAr = locale === "ar";
  const [sort, setSort] = useState<SortKey>("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeSub, setActiveSub] = useState<string>("all");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [page, setPage] = useState(1);

  const cities = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const v = p.vendorId as VendorLike | undefined;
      const city = v?.location?.city?.trim();
      const region = v?.location?.region?.trim();
      const label = city || region;
      if (!label) continue;
      map.set(label, (map.get(label) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [products]);

  const certOptions = ["SASO", "ISO", "CE", "Other"];

  const filtered = useMemo(() => {
    let list = [...products];
    const subKeys = activeSub !== "all" ? [activeSub] : selectedCats.length ? selectedCats : [];

    if (subKeys.length) {
      list = list.filter((p) =>
        subKeys.some((key) => {
          const sub = subcategories.find((s) => s.key === key);
          return matchesSub(p, key, sub?.name.en);
        })
      );
    }

    if (selectedCities.length) {
      list = list.filter((p) => {
        const city = (p.vendorId as VendorLike | undefined)?.location?.city || "";
        return selectedCities.includes(city);
      });
    }

    if (selectedCerts.length) {
      const next = list.filter((p) => (p.certifications || []).some((c) => selectedCerts.includes(c)));
      if (next.length) list = next;
    }

    const min = priceMin === "" ? null : Number(priceMin);
    const max = priceMax === "" ? null : Number(priceMax);
    if (min != null && !Number.isNaN(min)) list = list.filter((p) => Number(p.price) >= min);
    if (max != null && !Number.isNaN(max)) list = list.filter((p) => Number(p.price) <= max);

    list.sort((a, b) => {
      if (sort === "price_asc") return (Number(a.price) || 1e12) - (Number(b.price) || 1e12);
      if (sort === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sort === "newest") {
        return (
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
      }
      const af = a.featured ? 1 : 0;
      const bf = b.featured ? 1 : 0;
      if (bf !== af) return bf - af;
      return (
        new Date(b.updatedAt || a.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    });
    return list;
  }, [products, activeSub, selectedCats, selectedCities, selectedCerts, priceMin, priceMax, sort, subcategories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
    setPage(1);
  }

  function selectSub(key: string) {
    if (key === "all") {
      setActiveSub("all");
      setSelectedCats([]);
    } else {
      setActiveSub(key);
      setSelectedCats([key]);
    }
    setPage(1);
  }

  const displayTitle = isAr ? titleAr || titleEn : titleEn;
  const secondaryTitle = isAr ? titleEn : titleAr;
  const vendorCount = Math.max(
    1,
    new Set(products.map((p) => String((p.vendorId as VendorLike | undefined)?._id || ""))).size
  );

  return (
    <div className="min-h-screen bg-[#f5f3ef]">
      <section className="relative min-h-[320px] overflow-hidden md:min-h-[380px]">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/60 to-black/30" />
        <div className="container-custom relative flex min-h-[320px] flex-col justify-end py-10 md:min-h-[380px] md:py-12">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/65 md:mb-5">
            <Link href={`/${locale}`} className="hover:text-white">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span>/</span>
            {parentBreadcrumb ? (
              <>
                <Link href={parentBreadcrumb.href} className="hover:text-white">
                  {parentBreadcrumb.name}
                </Link>
                <span>/</span>
              </>
            ) : null}
            <span className="text-white/90">{displayTitle}</span>
          </nav>

          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="max-w-2xl pb-1">
              <h1 className="m-0 text-[2.15rem] font-bold leading-[1.12] tracking-tight text-white md:text-[2.85rem]">
                {displayTitle}
              </h1>
              {secondaryTitle && secondaryTitle !== displayTitle ? (
                <p className="mt-2 mb-0 text-start text-xl font-medium text-white/90 md:text-[1.65rem] md:leading-snug">
                  {secondaryTitle}
                </p>
              ) : null}
              {description ? (
                <p className="mt-3 mb-0 max-w-xl text-[0.95rem] leading-relaxed text-white/78 md:mt-4 md:text-base">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl bg-[#1a1612]/80 p-5 text-white shadow-lg backdrop-blur-sm md:p-6">
              <p className="m-0 text-[1.75rem] font-bold leading-none text-[#e8d5a3] md:text-[1.95rem]">
                {productCountLabel || String(products.length)}
              </p>
              <p className="mt-1.5 mb-4 text-sm text-white/70">{isAr ? "منتج" : "Products"}</p>
              <p className="m-0 text-[1.75rem] font-bold leading-none text-[#e8d5a3] md:text-[1.95rem]">
                {vendorCountLabel || String(vendorCount)}
              </p>
              <p className="mt-1.5 mb-5 text-sm text-white/70">
                {isAr ? "موردون" : "Suppliers"}
              </p>
              <Link
                href={rfqHref}
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#c9a962] px-3 py-3 text-sm font-semibold text-white hover:bg-[#b8953d]"
              >
                {isAr ? "احصل على عروض تنافسية" : "Get Competitive Quotations"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom py-6 md:py-8">
        {subcategories.length > 0 ? (
          <div className="mb-6 flex gap-4 overflow-x-auto px-0.5 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <SubChip
              active={activeSub === "all"}
              image={heroImage}
              labelEn={isAr ? "الكل" : "All"}
              labelAr=""
              onClick={() => selectSub("all")}
            />
            {subcategories.map((sub) => (
              <SubChip
                key={sub.key}
                active={activeSub === sub.key}
                image={heroImage || `/categories/${catalogKey}.jpg`}
                labelEn={sub.name.en || sub.key}
                labelAr={sub.name.ar || ""}
                isAr={isAr}
                fallbackImage={`/categories/${catalogKey}.jpg`}
                onClick={() => selectSub(sub.key)}
              />
            ))}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-xl border border-[#e6e2da] bg-transparent p-4">
            <h2 className="m-0 mb-4 text-sm font-bold uppercase tracking-wide text-[#1a1a1a]">
              {isAr ? "تصفية" : "Filters"}
            </h2>

            <FilterBlock title={isAr ? "فئة المنتج" : "Product Category"}>
              {subcategories.map((sub) => {
                const label = isAr ? sub.name.ar || sub.name.en : sub.name.en || sub.name.ar;
                return (
                  <label
                    key={sub.key}
                    className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-sm text-[#333]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCats.includes(sub.key) || activeSub === sub.key}
                        onChange={() => {
                          const next = selectedCats.includes(sub.key)
                            ? selectedCats.filter((x) => x !== sub.key)
                            : [...selectedCats.filter((x) => x !== activeSub || activeSub === "all"), sub.key];
                          setSelectedCats(next);
                          setActiveSub(next.length === 1 ? next[0] : next.length ? "all" : "all");
                          if (next.length === 1) setActiveSub(next[0]);
                          else setActiveSub("all");
                          setPage(1);
                        }}
                        className="accent-[#c9a962]"
                      />
                      {label}
                    </span>
                    <span className="text-xs text-[#8a8a8a]">{sub.count ?? 0}</span>
                  </label>
                );
              })}
            </FilterBlock>

            <FilterBlock title={isAr ? "موقع المورد" : "Supplier Location"}>
              {cities.length === 0 ? (
                <p className="m-0 py-1 text-xs text-[#8a8a8a]">
                  {isAr ? "لا توجد مواقع موردين بعد" : "No supplier locations yet"}
                </p>
              ) : (
                cities.map(([city, count]) => (
                  <label
                    key={city}
                    className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-sm text-[#333]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city)}
                        onChange={() => toggle(selectedCities, city, setSelectedCities)}
                        className="accent-[#c9a962]"
                      />
                      <MapPin className="h-3.5 w-3.5 text-[#8a8a8a]" />
                      {city}
                    </span>
                    <span className="text-xs text-[#8a8a8a]">{count}</span>
                  </label>
                ))
              )}
            </FilterBlock>

            <FilterBlock title={isAr ? "نطاق السعر (ر.س)" : "Price Range (SAR)"}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={isAr ? "أدنى" : "Min"}
                  value={priceMin}
                  onChange={(e) => {
                    setPriceMin(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-[#e6e2da] bg-transparent px-2.5 py-2 text-sm outline-none focus:border-[#c9a962]"
                />
                <input
                  type="number"
                  placeholder={isAr ? "أعلى" : "Max"}
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-[#e6e2da] bg-transparent px-2.5 py-2 text-sm outline-none focus:border-[#c9a962]"
                />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c9a962] text-white"
                  aria-label="Apply"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </FilterBlock>

            <FilterBlock title={isAr ? "الشهادات" : "Certification"}>
              {certOptions.map((cert) => (
                <label key={cert} className="flex cursor-pointer items-center gap-2 py-1.5 text-sm text-[#333]">
                  <input
                    type="checkbox"
                    checked={selectedCerts.includes(cert)}
                    onChange={() => toggle(selectedCerts, cert, setSelectedCerts)}
                    className="accent-[#c9a962]"
                  />
                  {cert === "Other"
                    ? isAr
                      ? "أخرى"
                      : "Other"
                    : isAr
                      ? `${cert}`
                      : `${cert} Certified`}
                </label>
              ))}
            </FilterBlock>

            <button
              type="button"
              className="mt-1 w-full rounded-lg border border-[#e8e4dc] py-2 text-sm text-[#6b6b6b] hover:border-[#c9a962] hover:text-[#1a1a1a]"
              onClick={() => {
                setSelectedCats([]);
                setSelectedCities([]);
                setSelectedCerts([]);
                setPriceMin("");
                setPriceMax("");
                setActiveSub("all");
                setPage(1);
              }}
            >
              {isAr ? "مسح التصفية" : "Clear filters"}
            </button>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-0.5 py-1">
              <p className="m-0 text-[15px] font-semibold text-[#1a1a1a]">
                {filtered.length.toLocaleString()} {isAr ? "منتج موجود" : "products found"}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="flex items-center gap-2 text-sm text-[#555]">
                  <span className="whitespace-nowrap">{isAr ? "ترتيب حسب:" : "Sort by:"}</span>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as SortKey);
                      setPage(1);
                    }}
                    className="bg-transparent px-0 py-1 text-sm font-medium text-[#1a1a1a] outline-none"
                  >
                    <option value="relevance">{isAr ? "الأهمية" : "Relevance"}</option>
                    <option value="price_asc">{isAr ? "السعر من الأقل" : "Price — Low to High"}</option>
                    <option value="price_desc">{isAr ? "السعر من الأعلى" : "Price — High to Low"}</option>
                    <option value="newest">{isAr ? "الأحدث" : "Newest First"}</option>
                  </select>
                </label>
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                      view === "grid" ? "bg-[#c9a962] text-white" : "text-[#6b6b6b] hover:bg-black/5"
                    }`}
                    aria-label="Grid"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                      view === "list" ? "bg-[#c9a962] text-white" : "text-[#6b6b6b] hover:bg-black/5"
                    }`}
                    aria-label="List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {pageItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e6e2da] bg-transparent px-6 py-16 text-center text-sm text-[#8a8a8a]">
                {isAr
                  ? "لا توجد منتجات في هذه الفئة الفرعية. جرّب فئة أخرى أو امسح التصفية."
                  : "No products in this subcategory. Try another chip or clear filters."}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {pageItems.map((p) => (
                  <ListingProductCard
                    key={String(p._id)}
                    locale={locale}
                    product={p}
                    vendor={p.vendorId as VendorLike}
                    source={`category:${categorySlug}`}
                    layout="grid"
                    rfqHref={`/${locale}/rfq?productId=${p._id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pageItems.map((p) => (
                  <ListingProductCard
                    key={String(p._id)}
                    locale={locale}
                    product={p}
                    vendor={p.vendorId as VendorLike}
                    source={`category:${categorySlug}`}
                    layout="list"
                    rfqHref={`/${locale}/rfq?productId=${p._id}`}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 ? (
              <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e6e2da] bg-transparent text-[#1a1a1a] disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                        pageSafe === n
                          ? "bg-[#c9a962] text-white"
                          : "border border-[#e6e2da] bg-transparent text-[#1a1a1a]"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                {totalPages > 7 ? <span className="px-1 text-[#8a8a8a]">…</span> : null}
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e6e2da] bg-transparent text-[#1a1a1a] disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function SubChip({
  active,
  image,
  labelEn,
  labelAr,
  isAr,
  fallbackImage,
  onClick,
}: {
  active: boolean;
  image: string;
  labelEn: string;
  labelAr: string;
  isAr?: boolean;
  fallbackImage?: string;
  onClick: () => void;
}) {
  const primary = isAr ? labelAr || labelEn : labelEn;
  const secondary = isAr ? labelEn : labelAr;
  const [src, setSrc] = useState(image || fallbackImage || "");
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`m-0.5 flex w-[124px] shrink-0 flex-col items-stretch rounded-xl border-2 bg-transparent p-3 text-start transition ${
        active
          ? "border-[#c9a962] bg-[#c9a962]/08 shadow-[0_0_0_1px_rgba(201,169,98,0.35)]"
          : "border-[#e6e2da] hover:border-[#c9a962]/55"
      }`}
    >
      <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-lg bg-[#f0eeea]">
        {!failed && src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            onError={() => {
              if (fallbackImage && src !== fallbackImage) {
                setSrc(fallbackImage);
              } else {
                setFailed(true);
              }
            }}
          />
        ) : (
          <span className="text-lg font-semibold text-[#c9a962]">{(primary || "·").slice(0, 1)}</span>
        )}
      </span>
      <span className="mt-2 line-clamp-2 min-h-[2rem] text-xs font-semibold leading-snug text-[#1a1a1a]">
        {primary}
      </span>
      {secondary && secondary !== primary ? (
        <span className="mt-0.5 line-clamp-1 text-start text-[11px] font-medium leading-snug text-[#5c5c5c]">
          {secondary}
        </span>
      ) : null}
    </button>
  );
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4 border-b border-[#f0ece4] pb-4 last:mb-0 last:border-b-0 last:pb-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">{title}</p>
      <div className="max-h-48 space-y-0.5 overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}
