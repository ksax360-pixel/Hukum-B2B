// src/components/browse/ResultsToolbar.tsx
// Count, sort and grid/list switch above any results list. Plain links so filters stay in the URL.

import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  base: string;
  /** Current URL params (page is dropped when anything changes). */
  params: Record<string, string | undefined>;
  total: number;
};

export function ResultsToolbar({ locale, base, params, total }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const href = (key: "sort" | "view", value?: string): string => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== key && k !== "page") p.set(k, v);
    if (value) p.set(key, value);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const sort = params.sort === "price" || params.sort === "newest" ? params.sort : "";
  const view = params.view === "list" ? "list" : "grid";

  return (
    <div className="ofr-bar">
      <p className="ofr-bar__count">
        <b>{total.toLocaleString("en-US")}</b> {L(total === 1 ? "listing" : "listings", "عرض")}
      </p>
      <div className="ofr-bar__ctl">
        <nav className="brw__sort" aria-label={L("Sort", "الترتيب")}>
          <Link href={href("sort")} aria-current={!sort || undefined} className={!sort ? "is-on" : ""}>{L("Relevant", "الأنسب")}</Link>
          <Link href={href("sort", "price")} aria-current={sort === "price" || undefined} className={sort === "price" ? "is-on" : ""}>{L("Lowest price", "الأقل سعراً")}</Link>
          <Link href={href("sort", "newest")} aria-current={sort === "newest" || undefined} className={sort === "newest" ? "is-on" : ""}>{L("Newest", "الأحدث")}</Link>
        </nav>
        <nav className="ofr-bar__view" aria-label={L("View", "العرض")}>
          <Link href={href("view")} aria-label={L("Grid", "شبكة")} aria-current={view === "grid" || undefined} className={view === "grid" ? "is-on" : ""}>
            <LayoutGrid size={16} aria-hidden />
          </Link>
          <Link href={href("view", "list")} aria-label={L("List", "قائمة")} aria-current={view === "list" || undefined} className={view === "list" ? "is-on" : ""}>
            <List size={16} aria-hidden />
          </Link>
        </nav>
      </div>
    </div>
  );
}
