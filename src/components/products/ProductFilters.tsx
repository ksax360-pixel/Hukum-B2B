"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { t as loc } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { KtSelect } from "@/components/ui/KtSelect";

export type Named = { _id: unknown; name?: { en?: string; ar?: string } };

const PRICE_TYPES = [
  { value: "fixed", en: "Fixed price", ar: "سعر ثابت" },
  { value: "starting_from", en: "Starting from", ar: "يبدأ من" },
  { value: "price_on_request", en: "Price on request", ar: "السعر عند الطلب" },
  { value: "negotiable", en: "Negotiable", ar: "قابل للتفاوض" },
  { value: "contact_supplier", en: "Contact supplier", ar: "تواصل مع المورد" },
  { value: "tiered", en: "Tiered pricing", ar: "تسعير متدرج" },
  { value: "quantity_based", en: "Quantity based", ar: "حسب الكمية" },
  { value: "contract", en: "Contract pricing", ar: "تسعير تعاقدي" },
] as const;

const AVAILABILITY = [
  { value: "in_stock", en: "In stock", ar: "متوفر" },
  { value: "made_to_order", en: "Made to order", ar: "حسب الطلب" },
  { value: "limited", en: "Limited", ar: "محدود" },
  { value: "out_of_stock", en: "Out of stock", ar: "غير متوفر" },
] as const;

const CONDITIONS = [
  { value: "new", en: "New", ar: "جديد" },
  { value: "refurbished", en: "Refurbished", ar: "مجدّد" },
  { value: "used", en: "Used", ar: "مستعمل" },
  { value: "made_to_order", en: "Made to order", ar: "حسب الطلب" },
  { value: "custom_manufactured", en: "Custom manufactured", ar: "تصنيع مخصص" },
  { value: "pre_owned", en: "Pre-owned", ar: "مستعمل مسبقاً" },
  { value: "sample", en: "Sample", ar: "عينة" },
] as const;

const UNITS = [
  { value: "piece", en: "Piece", ar: "قطعة" },
  { value: "unit", en: "Unit", ar: "وحدة" },
  { value: "set", en: "Set", ar: "طقم" },
  { value: "box", en: "Box", ar: "صندوق" },
  { value: "carton", en: "Carton", ar: "كرتون" },
  { value: "kg", en: "Kilogram", ar: "كيلوغرام" },
  { value: "ton", en: "Ton", ar: "طن" },
  { value: "meter", en: "Meter", ar: "متر" },
  { value: "sqm", en: "Square meter", ar: "متر مربع" },
  { value: "pallet", en: "Pallet", ar: "طبلية" },
  { value: "container", en: "Container", ar: "حاوية" },
] as const;

const CURRENCIES = [
  { value: "SAR", en: "SAR", ar: "ر.س" },
  { value: "USD", en: "USD", ar: "دولار" },
  { value: "EUR", en: "EUR", ar: "يورو" },
  { value: "AED", en: "AED", ar: "درهم" },
] as const;

const SORTS = [
  { value: "newest", en: "Newest", ar: "الأحدث" },
  { value: "price_asc", en: "Price: low to high", ar: "السعر: من الأقل" },
  { value: "price_desc", en: "Price: high to low", ar: "السعر: من الأعلى" },
  { value: "featured", en: "Featured first", ar: "المميز أولاً" },
] as const;

const ORIGINS = [
  { value: "SA", en: "Saudi Arabia", ar: "السعودية" },
  { value: "AE", en: "United Arab Emirates", ar: "الإمارات" },
  { value: "CN", en: "China", ar: "الصين" },
  { value: "IN", en: "India", ar: "الهند" },
  { value: "DE", en: "Germany", ar: "ألمانيا" },
  { value: "US", en: "United States", ar: "الولايات المتحدة" },
  { value: "TR", en: "Turkey", ar: "تركيا" },
] as const;

const CITIES = [
  { value: "Riyadh", en: "Riyadh", ar: "الرياض" },
  { value: "Jeddah", en: "Jeddah", ar: "جدة" },
  { value: "Dammam", en: "Dammam", ar: "الدمام" },
  { value: "Khobar", en: "Khobar", ar: "الخبر" },
  { value: "Dhahran", en: "Dhahran", ar: "الظهران" },
  { value: "Mecca", en: "Mecca", ar: "مكة" },
  { value: "Medina", en: "Medina", ar: "المدينة" },
  { value: "Tabuk", en: "Tabuk", ar: "تبوك" },
  { value: "Abha", en: "Abha", ar: "أبها" },
  { value: "Jubail", en: "Jubail", ar: "الجبيل" },
  { value: "Yanbu", en: "Yanbu", ar: "ينبع" },
  { value: "Neom", en: "NEOM", ar: "نيوم" },
] as const;

const ADVANCED_KEYS = [
  "priceType",
  "availability",
  "condition",
  "unit",
  "currency",
  "origin",
  "sort",
  "verified",
  "featured",
  "negotiable",
  "requestQuote",
] as const;

function countAdvanced(params: Record<string, string | undefined>) {
  let n = 0;
  for (const key of ADVANCED_KEYS) {
    if (!params[key]) continue;
    if (key === "sort" && params[key] === "newest") continue;
    n += 1;
  }
  return n;
}

function HiddenAdvanced({ params }: { params: Record<string, string | undefined> }) {
  return (
    <>
      {ADVANCED_KEYS.map((key) =>
        params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null
      )}
    </>
  );
}

function localizedOptions(
  items: readonly { value: string; en: string; ar: string }[],
  isAr: boolean,
  anyLabel: string
) {
  return [
    { value: "", label: anyLabel },
    ...items.map((opt) => ({ value: opt.value, label: isAr ? opt.ar : opt.en })),
  ];
}

export function ProductFilters({
  locale,
  industries,
  categories,
  params,
  resultCount,
}: {
  locale: Locale;
  industries: Named[];
  categories: Named[];
  params: Record<string, string | undefined>;
  resultCount: number;
}) {
  const isAr = locale === "ar";
  const action = `/${locale}/products`;
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const advancedCount = useMemo(() => countAdvanced(params), [params]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: isAr ? "كل التصنيفات" : "All categories" },
      ...categories.map((item) => ({
        value: String(item._id),
        label: loc(locale, item.name),
      })),
    ],
    [categories, isAr, locale]
  );

  const industryOptions = useMemo(
    () => [
      { value: "", label: isAr ? "كل القطاعات" : "All industries" },
      ...industries.map((item) => ({
        value: String(item._id),
        label: loc(locale, item.name),
      })),
    ],
    [industries, isAr, locale]
  );

  const anyLabel = isAr ? "الكل" : "Any";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <aside className="products-filters w-full">
        <div className="filter-rail">
          <div className="filter-rail__head">
            <span className="filter-rail__icon">
              <Search size={15} strokeWidth={1.75} />
            </span>
            <div>
              <p className="filter-rail__eyebrow">{isAr ? "بحث" : "Find"}</p>
              <h2 className="filter-rail__title">{isAr ? "بحث المنتجات" : "Product search"}</h2>
            </div>
          </div>

          <p className="filter-rail__count">
            <strong>{resultCount}</strong> {isAr ? "نتيجة" : "results"}
            {advancedCount > 0 ? (
              <span>
                {" "}
                · {advancedCount} {isAr ? "فلتر إضافي" : "extra filters"}
              </span>
            ) : null}
          </p>

          <form action={action} method="get" className="filter-rail__form">
            <div className="filter-field">
              <label className="filter-label" htmlFor="rail-q">
                {isAr ? "بحث" : "Search"}
              </label>
              <div className="filter-input-wrap">
                <Search size={15} className="filter-input-icon" strokeWidth={1.75} />
                <input
                  id="rail-q"
                  name="q"
                  defaultValue={params.q || ""}
                  placeholder={isAr ? "كلمة مفتاحية…" : "Keyword, brand, SKU…"}
                  className="filter-input filter-input--icon"
                />
              </div>
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="rail-seller">
                {isAr ? "اسم البائع" : "Seller name"}
              </label>
              <input
                id="rail-seller"
                name="seller"
                defaultValue={params.seller || params.vendor || ""}
                placeholder={isAr ? "شركة / علامة…" : "Company or trade name…"}
                className="filter-input"
              />
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="rail-city">
                {isAr ? "الموقع / المدينة" : "Location / city"}
              </label>
              <KtSelect
                id="rail-city"
                name="city"
                defaultValue={params.city || params.location || ""}
                options={[
                  { value: "", label: isAr ? "كل المدن" : "All cities" },
                  ...CITIES.map((c) => ({ value: c.value, label: isAr ? c.ar : c.en })),
                ]}
                placeholder={isAr ? "كل المدن" : "All cities"}
              />
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="rail-category">
                {isAr ? "التصنيف" : "Category"}
              </label>
              <KtSelect
                id="rail-category"
                name="categoryId"
                defaultValue={params.categoryId || ""}
                options={categoryOptions}
                placeholder={isAr ? "كل التصنيفات" : "All categories"}
              />
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="rail-industry">
                {isAr ? "القطاع / المنتج" : "Product / industry"}
              </label>
              <KtSelect
                id="rail-industry"
                name="industryId"
                defaultValue={params.industryId || ""}
                options={industryOptions}
                placeholder={isAr ? "كل القطاعات" : "All industries"}
              />
            </div>

            <HiddenAdvanced params={params} />

            <button type="submit" className="filter-search-btn">
              <Search size={15} strokeWidth={1.75} />
              {isAr ? "بحث" : "Search"}
            </button>
          </form>

          <div className="filter-rail__divider" />

          <button type="button" className="filter-more-btn" onClick={() => setOpen(true)}>
            <SlidersHorizontal size={14} strokeWidth={1.75} />
            {isAr ? "عرض المزيد من الفلاتر" : "View more filters"}
            {advancedCount > 0 ? <span className="filter-more-btn__badge">{advancedCount}</span> : null}
          </button>

          {(params.q ||
            params.seller ||
            params.vendor ||
            params.city ||
            params.location ||
            params.categoryId ||
            params.industryId ||
            advancedCount > 0) && (
            <Link href={action} className="filter-rail__clear">
              <RotateCcw size={12} strokeWidth={1.75} />
              {isAr ? "مسح الكل" : "Clear all"}
            </Link>
          )}
        </div>
      </aside>

      {open && (
        <div className="filter-modal" role="presentation">
          <button type="button" className="filter-modal__backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="filter-modal__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="filter-modal__head">
              <div>
                <p className="filter-rail__eyebrow">{isAr ? "بحث متقدم" : "Advanced"}</p>
                <h2 id={titleId} className="filter-modal__title">
                  {isAr ? "المزيد من الفلاتر" : "More filters"}
                </h2>
              </div>
              <button type="button" className="filter-modal__close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form action={action} method="get" className="filter-modal__form">
              {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
              {params.seller || params.vendor ? (
                <input type="hidden" name="seller" value={params.seller || params.vendor} />
              ) : null}
              {params.city || params.location ? (
                <input type="hidden" name="city" value={params.city || params.location} />
              ) : null}
              {params.categoryId ? <input type="hidden" name="categoryId" value={params.categoryId} /> : null}
              {params.industryId ? <input type="hidden" name="industryId" value={params.industryId} /> : null}

              <div className="filter-modal__grid">
                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-seller">
                    {isAr ? "اسم البائع" : "Seller name"}
                  </label>
                  <input
                    id="mf-seller"
                    name="seller"
                    defaultValue={params.seller || params.vendor || ""}
                    placeholder={isAr ? "شركة / علامة…" : "Company or trade name…"}
                    className="filter-input"
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-city">
                    {isAr ? "الموقع / المدينة" : "Location / city"}
                  </label>
                  <KtSelect
                    id="mf-city"
                    name="city"
                    defaultValue={params.city || params.location || ""}
                    options={[
                      { value: "", label: isAr ? "كل المدن" : "All cities" },
                      ...CITIES.map((c) => ({ value: c.value, label: isAr ? c.ar : c.en })),
                    ]}
                    placeholder={isAr ? "كل المدن" : "All cities"}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-price-type">
                    {isAr ? "نوع السعر" : "Price type"}
                  </label>
                  <KtSelect
                    id="mf-price-type"
                    name="priceType"
                    defaultValue={params.priceType || ""}
                    options={localizedOptions(PRICE_TYPES, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-availability">
                    {isAr ? "التوفر" : "Availability"}
                  </label>
                  <KtSelect
                    id="mf-availability"
                    name="availability"
                    defaultValue={params.availability || ""}
                    options={localizedOptions(AVAILABILITY, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-condition">
                    {isAr ? "الحالة" : "Condition"}
                  </label>
                  <KtSelect
                    id="mf-condition"
                    name="condition"
                    defaultValue={params.condition || ""}
                    options={localizedOptions(CONDITIONS, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-unit">
                    {isAr ? "وحدة القياس" : "Unit"}
                  </label>
                  <KtSelect
                    id="mf-unit"
                    name="unit"
                    defaultValue={params.unit || ""}
                    options={localizedOptions(UNITS, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-currency">
                    {isAr ? "العملة" : "Currency"}
                  </label>
                  <KtSelect
                    id="mf-currency"
                    name="currency"
                    defaultValue={params.currency || ""}
                    options={localizedOptions(CURRENCIES, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-origin">
                    {isAr ? "بلد المنشأ" : "Country of origin"}
                  </label>
                  <KtSelect
                    id="mf-origin"
                    name="origin"
                    defaultValue={params.origin || ""}
                    options={localizedOptions(ORIGINS, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="mf-sort">
                    {isAr ? "الترتيب" : "Sort by"}
                  </label>
                  <KtSelect
                    id="mf-sort"
                    name="sort"
                    defaultValue={params.sort || "newest"}
                    options={SORTS.map((opt) => ({
                      value: opt.value,
                      label: isAr ? opt.ar : opt.en,
                    }))}
                    placeholder={isAr ? "الأحدث" : "Newest"}
                  />
                </div>
              </div>

              <div className="filter-modal__toggles">
                <label className="filter-check">
                  <input type="checkbox" name="verified" value="true" defaultChecked={params.verified === "true"} />
                  <span>
                    <strong>{isAr ? "موثّق فقط" : "Verified only"}</strong>
                    <em>{isAr ? "منتجات مورّدين موثقين" : "Verified vendor listings"}</em>
                  </span>
                </label>
                <label className="filter-check">
                  <input type="checkbox" name="featured" value="true" defaultChecked={params.featured === "true"} />
                  <span>
                    <strong>{isAr ? "مميز" : "Featured"}</strong>
                    <em>{isAr ? "عروض مميزة في السوق" : "Spotlight marketplace picks"}</em>
                  </span>
                </label>
                <label className="filter-check">
                  <input
                    type="checkbox"
                    name="negotiable"
                    value="true"
                    defaultChecked={params.negotiable === "true"}
                  />
                  <span>
                    <strong>{isAr ? "قابل للتفاوض" : "Negotiable"}</strong>
                    <em>{isAr ? "أسعار مفتوحة للتفاوض" : "Open to price negotiation"}</em>
                  </span>
                </label>
                <label className="filter-check">
                  <input
                    type="checkbox"
                    name="requestQuote"
                    value="true"
                    defaultChecked={params.requestQuote === "true"}
                  />
                  <span>
                    <strong>{isAr ? "طلب عرض سعر" : "Request quote"}</strong>
                    <em>{isAr ? "منتجات تدعم طلب التسعير" : "Listings that accept RFQ quotes"}</em>
                  </span>
                </label>
              </div>

              <div className="filter-modal__foot">
                <Link href={action} className="filter-reset" onClick={() => setOpen(false)}>
                  <RotateCcw size={13} strokeWidth={1.75} />
                  {isAr ? "مسح الكل" : "Clear all"}
                </Link>
                <button type="submit" className="filter-apply">
                  {isAr ? "تطبيق الفلاتر" : "Apply filters"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
