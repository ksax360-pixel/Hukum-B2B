// src/components/browse/ResultsToolbar.tsx
// Count, sort and grid/list switch above any results list.
// Sort stays in the URL; view can switch client-side without a refresh.

import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { ResultsView } from "./OfferResults";

type Props = {
  locale: Locale;
  base: string;
  /** Current URL params (page is dropped when anything changes). */
  params: Record<string, string | undefined>;
  total: number;
  /** When false, sort controls are omitted (e.g. moved into a sidebar). */
  showSort?: boolean;
  /** Controlled view (client switch). Falls back to params.view. */
  view?: ResultsView;
  /** When set, grid/list toggles locally instead of navigating. */
  onViewChange?: (view: ResultsView) => void;
};

export function ResultsToolbar({
  locale,
  base,
  params,
  total,
  showSort = true,
  view: viewProp,
  onViewChange,
}: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const href = (key: "sort" | "view", value?: string): string => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== key && k !== "page") p.set(k, v);
    if (value) p.set(key, value);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const sort =
    params.sort === "price" ? "price" : params.sort === "featured" ? "featured" : "newest";
  const view = viewProp ?? (params.view === "list" ? "list" : "grid");

  return (
    <div className="ofr-bar">
      <p className="ofr-bar__count">
        <b>{total.toLocaleString("en-US")}</b> {L(total === 1 ? "listing" : "listings", "عرض")}
      </p>
      <div className="ofr-bar__ctl">
        {showSort ? (
          <nav className="brw__sort" aria-label={L("Sort", "الترتيب")}>
            <Link
              href={href("sort")}
              aria-current={sort === "newest" || undefined}
              className={sort === "newest" ? "is-on" : ""}
            >
              {L("Newest", "الأحدث")}
            </Link>
            <Link href={href("sort", "price")} aria-current={sort === "price" || undefined} className={sort === "price" ? "is-on" : ""}>
              {L("Lowest price", "الأقل سعراً")}
            </Link>
            <Link
              href={href("sort", "featured")}
              aria-current={sort === "featured" || undefined}
              className={sort === "featured" ? "is-on" : ""}
            >
              {L("Featured", "مميزة")}
            </Link>
          </nav>
        ) : null}
        <nav className="ofr-bar__view" aria-label={L("View", "العرض")}>
          {onViewChange ? (
            <>
              <button
                type="button"
                aria-current={view === "grid" || undefined}
                className={view === "grid" ? "is-on" : ""}
                onClick={() => onViewChange("grid")}
              >
                <LayoutGrid size={15} aria-hidden />
                <span>{L("Grid", "شبكة")}</span>
              </button>
              <button
                type="button"
                aria-current={view === "list" || undefined}
                className={view === "list" ? "is-on" : ""}
                onClick={() => onViewChange("list")}
              >
                <List size={15} aria-hidden />
                <span>{L("List", "قائمة")}</span>
              </button>
            </>
          ) : (
            <>
              <Link href={href("view")} aria-current={view === "grid" || undefined} className={view === "grid" ? "is-on" : ""}>
                <LayoutGrid size={15} aria-hidden />
                <span>{L("Grid", "شبكة")}</span>
              </Link>
              <Link href={href("view", "list")} aria-current={view === "list" || undefined} className={view === "list" ? "is-on" : ""}>
                <List size={15} aria-hidden />
                <span>{L("List", "قائمة")}</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
