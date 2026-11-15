// src/components/search/SearchUnderstanding.tsx
// "Understood as" row on the results page: shows what Hukum read from a typed sentence as removable chips,
// offers category narrowing, and turns the search into one request to many suppliers (D5, D15, D18).

import Link from "next/link";
import { rfqPromise } from "@/lib/rfq-promise";
import { Sparkles, X, Send } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { UnderstoodQuery } from "@/modules/search/query-understanding";
import { CITY_AR } from "@/lib/cities";

type Named = { en?: string; ar?: string };
type Props = {
  locale: Locale;
  understood: UnderstoodQuery;
  categories: Array<{ _id: string; name?: Named }>;
  /** Current URL params, so chips keep every other filter. */
  params: Record<string, string | undefined>;
  total: number;
};

const UNIT_LABEL: Record<string, { en: string; ar: string }> = {
  piece: { en: "pcs", ar: "قطعة" }, box: { en: "boxes", ar: "علبة" }, carton: { en: "cartons", ar: "كرتون" },
  pair: { en: "pairs", ar: "زوج" }, kg: { en: "kg", ar: "كجم" }, ton: { en: "t", ar: "طن" }, meter: { en: "m", ar: "متر" },
  roll: { en: "rolls", ar: "لفة" }, bag: { en: "bags", ar: "كيس" }, pallet: { en: "pallets", ar: "طبلية" }, liter: { en: "L", ar: "لتر" },
};


export function SearchUnderstanding({ locale, understood, categories, params, total }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const name = (n?: Named): string => (isAr ? n?.ar || n?.en : n?.en || n?.ar) || "";

  /** Rebuild the query without one understood part, keeping the rest of the URL. */
  const without = (part: "qty" | "city" | "terms"): string => {
    const words = [
      part === "terms" ? "" : understood.terms.join(" "),
      part === "qty" || !understood.quantity ? "" : `${understood.quantity}${understood.unit ? ` ${understood.unit}` : ""}`,
      part === "city" || !understood.city ? "" : `in ${understood.city}`,
    ].filter(Boolean);
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "q" && k !== "page") next.set(k, v);
    if (words.length) next.set("q", words.join(" "));
    const qs = next.toString();
    return `/${locale}/products${qs ? `?${qs}` : ""}`;
  };

  const withCategory = (id: string): string => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") next.set(k, v);
    next.set("categoryId", id);
    return `/${locale}/products?${next}`;
  };

  const rfq = new URLSearchParams();
  if (understood.terms.length) rfq.set("q", understood.terms.join(" "));
  if (understood.quantity) rfq.set("qty", String(understood.quantity));
  if (understood.unit) rfq.set("unit", understood.unit);
  if (understood.city) rfq.set("city", understood.city);

  const unit = understood.unit ? UNIT_LABEL[understood.unit]?.[isAr ? "ar" : "en"] || understood.unit : "";
  const hasExtra = Boolean(understood.quantity || understood.city);

  return (
    <div className="disc-understood">
      {hasExtra || understood.terms.length ? (
        <div className="disc-understood__row" aria-label={L("What Hukum understood", "ما فهمه حكم")}>
          <span className="disc-understood__label">
            <Sparkles size={14} aria-hidden />
            {L("Understood as", "فهمنا طلبك")}
          </span>
          {understood.terms.length ? (
            <Link href={without("terms")} className="disc-chip disc-chip--on" title={L("Remove", "إزالة")}>
              {understood.terms.join(" ")}
              <X size={13} aria-hidden />
            </Link>
          ) : null}
          {understood.quantity ? (
            <Link href={without("qty")} className="disc-chip disc-chip--on" title={L("Remove", "إزالة")}>
              {understood.quantity.toLocaleString("en-US")} {unit}
              <X size={13} aria-hidden />
            </Link>
          ) : null}
          {understood.city ? (
            <Link href={without("city")} className="disc-chip disc-chip--on" title={L("Remove", "إزالة")}>
              {L(`Deliver to ${understood.city}`, `التوصيل إلى ${CITY_AR[understood.city] || understood.city}`)}
              <X size={13} aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : null}

      {categories.length && !params.categoryId ? (
        <div className="disc-understood__row">
          <span className="disc-understood__label">{L("Narrow to", "تضييق إلى")}</span>
          {categories.slice(0, 6).map((c) => (
            <Link key={c._id} href={withCategory(c._id)} className="disc-chip">
              {name(c.name)}
            </Link>
          ))}
        </div>
      ) : null}

      {understood.terms.length ? (
        <div className={`disc-request${total === 0 ? " disc-request--empty" : ""}`}>
          <div>
            <b>
              {total === 0
                ? L("No listed product matches yet", "لا يوجد منتج مطابق حالياً")
                : L("Need prices from several suppliers?", "تبي أسعار من أكثر من مورّد؟")}
            </b>
            <span>
              {rfqPromise(locale)}
            </span>
          </div>
          <Link href={`/${locale}/rfq?${rfq}`} className="disc-request__btn">
            <Send size={15} aria-hidden />
            {understood.quantity
              ? L(`Request quotes for ${understood.quantity.toLocaleString("en-US")} ${unit}`, `اطلب عروض لـ ${understood.quantity} ${unit}`)
              : L("Request quotes", "اطلب عروض أسعار")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
