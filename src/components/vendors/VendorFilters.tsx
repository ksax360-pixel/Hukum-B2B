"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { t as loc } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { KtSelect } from "@/components/ui/KtSelect";

export type Named = { _id: unknown; name?: { en?: string; ar?: string } };

const COMPANY_TYPES = [
  { value: "manufacturer", en: "Manufacturer", ar: "مصنّع" },
  { value: "distributor", en: "Distributor", ar: "موزّع" },
  { value: "wholesaler", en: "Wholesaler", ar: "تاجر جملة" },
  { value: "retailer", en: "Retailer", ar: "تاجر تجزئة" },
  { value: "importer", en: "Importer", ar: "مستورد" },
  { value: "exporter", en: "Exporter", ar: "مصدّر" },
  { value: "service_provider", en: "Service provider", ar: "مزوّد خدمة" },
  { value: "contractor", en: "Contractor", ar: "مقاول" },
  { value: "trading_company", en: "Trading company", ar: "شركة تجارية" },
  { value: "oem", en: "OEM", ar: "تصنيع أصلي" },
  { value: "odm", en: "ODM", ar: "تصميم وتصنيع" },
  { value: "brand_owner", en: "Brand owner", ar: "مالك علامة" },
  { value: "agent", en: "Agent", ar: "وكيل" },
  { value: "other", en: "Other", ar: "أخرى" },
] as const;

const CITIES = [
  { value: "Riyadh", en: "Riyadh", ar: "الرياض" },
  { value: "Jeddah", en: "Jeddah", ar: "جدة" },
  { value: "Dammam", en: "Dammam", ar: "الدمام" },
  { value: "Qassim", en: "Qassim", ar: "القصيم" },
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

const SORTS = [
  { value: "newest", en: "Newest", ar: "الأحدث" },
  { value: "name", en: "Name A–Z", ar: "الاسم" },
  { value: "featured", en: "Featured first", ar: "المميز أولاً" },
] as const;

const ADVANCED_KEYS = ["companyType", "city", "sort", "verified", "featured"] as const;

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

export function VendorFilters({
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
  const action = `/${locale}/vendors`;
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const advancedCount = useMemo(() => countAdvanced(params), [params]);
  const anyLabel = isAr ? "الكل" : "Any";

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
              <h2 className="filter-rail__title">{isAr ? "بحث الموردين" : "Vendor search"}</h2>
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
              <label className="filter-label" htmlFor="vendor-q">
                {isAr ? "بحث" : "Search"}
              </label>
              <div className="filter-input-wrap">
                <Search size={15} className="filter-input-icon" strokeWidth={1.75} />
                <input
                  id="vendor-q"
                  name="q"
                  defaultValue={params.q || ""}
                  placeholder={isAr ? "اسم الشركة…" : "Company name…"}
                  className="filter-input filter-input--icon"
                />
              </div>
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="vendor-industry">
                {isAr ? "القطاع" : "Industry"}
              </label>
              <KtSelect
                id="vendor-industry"
                name="industryId"
                defaultValue={params.industryId || ""}
                options={industryOptions}
                placeholder={isAr ? "كل القطاعات" : "All industries"}
              />
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="vendor-category">
                {isAr ? "التصنيف" : "Category"}
              </label>
              <KtSelect
                id="vendor-category"
                name="categoryId"
                defaultValue={params.categoryId || ""}
                options={categoryOptions}
                placeholder={isAr ? "كل التصنيفات" : "All categories"}
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

          {(params.q || params.industryId || params.categoryId || advancedCount > 0) && (
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
              {params.industryId ? <input type="hidden" name="industryId" value={params.industryId} /> : null}
              {params.categoryId ? <input type="hidden" name="categoryId" value={params.categoryId} /> : null}

              <div className="filter-modal__grid">
                <div className="filter-field">
                  <label className="filter-label" htmlFor="vf-type">
                    {isAr ? "نوع الشركة" : "Company type"}
                  </label>
                  <KtSelect
                    id="vf-type"
                    name="companyType"
                    defaultValue={params.companyType || ""}
                    options={localizedOptions(COMPANY_TYPES, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="vf-city">
                    {isAr ? "المدينة" : "City"}
                  </label>
                  <KtSelect
                    id="vf-city"
                    name="city"
                    defaultValue={params.city || ""}
                    options={localizedOptions(CITIES, isAr, anyLabel)}
                    placeholder={anyLabel}
                  />
                </div>

                <div className="filter-field">
                  <label className="filter-label" htmlFor="vf-sort">
                    {isAr ? "الترتيب" : "Sort by"}
                  </label>
                  <KtSelect
                    id="vf-sort"
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
                    <em>{isAr ? "موردون موثّقون" : "Verified supplier profiles"}</em>
                  </span>
                </label>
                <label className="filter-check">
                  <input type="checkbox" name="featured" value="true" defaultChecked={params.featured === "true"} />
                  <span>
                    <strong>{isAr ? "مميز" : "Featured"}</strong>
                    <em>{isAr ? "موردون مميزون في السوق" : "Spotlight marketplace vendors"}</em>
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
