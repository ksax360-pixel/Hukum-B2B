"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BadgeCheck, Factory, RotateCcw, Search } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { CITY_AR } from "@/lib/cities";
import { KtSelect } from "@/components/ui/KtSelect";
import type { BrowseFilters } from "@/modules/browse/browse.service";

const SAUDI_CITIES = [
  "Riyadh",
  "Jeddah",
  "Dammam",
  "Khobar",
  "Dhahran",
  "Jubail",
  "Yanbu",
  "Mecca",
  "Medina",
  "Tabuk",
  "Abha",
  "Qassim",
  "NEOM",
] as const;

const SUPPLIER_TYPES = [
  { value: "manufacturer", en: "Manufacturer", ar: "مصنّع" },
  { value: "distributor", en: "Distributor", ar: "موزّع" },
  { value: "wholesaler", en: "Wholesaler / trader", ar: "تاجر جملة" },
  { value: "service", en: "Service provider", ar: "مزوّد خدمة" },
] as const;

const AVAILABILITY = [
  { value: "in_stock", en: "In stock", ar: "متوفر" },
  { value: "made_to_order", en: "Made to order", ar: "حسب الطلب" },
  { value: "limited", en: "Limited", ar: "محدود" },
] as const;

const SORTS = [
  { value: "relevant", en: "Relevant", ar: "الأنسب" },
  { value: "price", en: "Lowest price", ar: "الأقل سعراً" },
  { value: "newest", en: "Newest", ar: "الأحدث" },
] as const;

type Props = {
  locale: Locale;
  action: string;
  filters: BrowseFilters;
  cities: Array<{ city: string; count: number }>;
  view?: "grid" | "list";
};

export function BrowseFiltersPanel({ locale, action, filters, cities, view }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string) => (isAr ? ar : en);
  const cityLabel = (c: string) => (isAr ? CITY_AR[c] || c : c);

  const cityOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: Array<{ value: string; label: string }> = [{ value: "", label: L("All cities", "كل المدن") }];
    for (const row of cities) {
      const key = row.city.trim();
      if (!key || seen.has(key.toLowerCase())) continue;
      seen.add(key.toLowerCase());
      opts.push({ value: key, label: `${cityLabel(key)} (${row.count})` });
    }
    for (const c of SAUDI_CITIES) {
      if (seen.has(c.toLowerCase())) continue;
      seen.add(c.toLowerCase());
      opts.push({ value: c, label: cityLabel(c) });
    }
    return opts;
  }, [cities, isAr]);

  const activeCount = [
    filters.q,
    filters.city,
    filters.verified,
    filters.saudi,
    filters.type,
    filters.availability,
    filters.featured,
    filters.sort && filters.sort !== "relevant" ? filters.sort : "",
  ].filter(Boolean).length;

  return (
    <section className="brw-lux" aria-label={L("Filters", "التصفية")}>
      <header className="brw-lux__head">
        <p className="brw-lux__eyebrow">صقل</p>
        <h2 className="brw-lux__title">{L("Advanced filters", "تصفية متقدمة")}</h2>
      </header>

      <form action={action} method="get" className="brw-lux__form">
        {view === "list" ? <input type="hidden" name="view" value="list" /> : null}

        <div className="brw-lux__field">
          <label className="brw-lux__label" htmlFor="brw-q">
            {L("Search", "بحث")}
          </label>
          <div className="brw-lux__search">
            <Search size={14} strokeWidth={1.75} aria-hidden />
            <input
              id="brw-q"
              name="q"
              defaultValue={filters.q || ""}
              placeholder={L("Product, brand, SKU…", "منتج، علامة، رمز…")}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="brw-lux__field">
          <label className="brw-lux__label" htmlFor="brw-city">
            {L("City", "المدينة")}
          </label>
          <KtSelect
            id="brw-city"
            name="city"
            defaultValue={filters.city || ""}
            options={cityOptions}
            placeholder={L("All cities", "كل المدن")}
          />
        </div>

        <div className="brw-lux__field">
          <span className="brw-lux__label">{L("Supplier trust", "ثقة المورد")}</span>
          <div className="brw-lux__toggles" role="group" aria-label={L("Supplier trust", "ثقة المورد")}>
            <label className={`brw-lux__tog${filters.verified ? " is-on" : ""}`} title={L("Verified", "موثّق")}>
              <input type="checkbox" name="verified" value="1" defaultChecked={Boolean(filters.verified)} />
              <BadgeCheck size={12} aria-hidden />
              <span>{L("Verified", "موثّق")}</span>
            </label>
            <label className={`brw-lux__tog${filters.saudi ? " is-on" : ""}`} title={L("Saudi made", "صنع سعودي")}>
              <input type="checkbox" name="saudi" value="1" defaultChecked={Boolean(filters.saudi)} />
              <Factory size={12} aria-hidden />
              <span>{L("Saudi made", "صنع سعودي")}</span>
            </label>
          </div>
        </div>

        <div className="brw-lux__field">
          <label className="brw-lux__label" htmlFor="brw-type">
            {L("Supplier type", "نوع المورد")}
          </label>
          <KtSelect
            id="brw-type"
            name="type"
            defaultValue={filters.type || ""}
            options={[
              { value: "", label: L("Any type", "أي نوع") },
              ...SUPPLIER_TYPES.map((t) => ({ value: t.value, label: isAr ? t.ar : t.en })),
            ]}
            placeholder={L("Any type", "أي نوع")}
          />
        </div>

        <div className="brw-lux__row">
          <div className="brw-lux__field">
            <label className="brw-lux__label" htmlFor="brw-avail">
              {L("Availability", "التوفر")}
            </label>
            <KtSelect
              id="brw-avail"
              name="availability"
              defaultValue={filters.availability || ""}
              options={[
                { value: "", label: L("Any", "الكل") },
                ...AVAILABILITY.map((a) => ({ value: a.value, label: isAr ? a.ar : a.en })),
              ]}
              placeholder={L("Any", "الكل")}
            />
          </div>
          <div className="brw-lux__field">
            <label className="brw-lux__label" htmlFor="brw-sort">
              {L("Sort", "الترتيب")}
            </label>
            <KtSelect
              id="brw-sort"
              name="sort"
              defaultValue={filters.sort && filters.sort !== "relevant" ? filters.sort : "relevant"}
              options={SORTS.map((s) => ({ value: s.value, label: isAr ? s.ar : s.en }))}
              placeholder={L("Relevant", "الأنسب")}
            />
          </div>
        </div>

        <label className={`brw-lux__check${filters.featured ? " is-on" : ""}`}>
          <input type="checkbox" name="featured" value="1" defaultChecked={Boolean(filters.featured)} />
          <span>
            <strong>{L("Featured only", "المميزة فقط")}</strong>
            <em>{L("Spotlight picks", "اختيارات مميزة")}</em>
          </span>
        </label>

        <button type="submit" className="brw-lux__apply">
          <Search size={14} strokeWidth={1.75} aria-hidden />
          {L("Apply filters", "تطبيق التصفية")}
          {activeCount ? <span className="brw-lux__badge">{activeCount}</span> : null}
        </button>
      </form>

      {activeCount > 0 ? (
        <Link href={action} className="brw-lux__clear">
          <RotateCcw size={12} strokeWidth={1.75} aria-hidden />
          {L("Clear all", "مسح الكل")}
        </Link>
      ) : null}
    </section>
  );
}
