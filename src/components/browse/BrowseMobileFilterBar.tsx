"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, BadgeCheck, Factory, SlidersHorizontal, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { BrowseFilters } from "@/modules/browse/browse.service";
import { BrowseFiltersPanel } from "./BrowseFiltersPanel";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  action: string;
  filters: BrowseFilters;
  cities: Array<{ city: string; count: number }>;
  view?: "grid" | "list";
};

function buildHref(
  action: string,
  filters: BrowseFilters,
  patch: Partial<BrowseFilters> & { clear?: boolean },
  view?: "grid" | "list"
) {
  if (patch.clear) {
    const p = new URLSearchParams();
    if (view === "list") p.set("view", "list");
    const qs = p.toString();
    return qs ? `${action}?${qs}` : action;
  }

  const next: BrowseFilters = { ...filters, ...patch };
  const p = new URLSearchParams();
  if (next.q) p.set("q", next.q);
  if (next.city) p.set("city", next.city);
  if (next.verified) p.set("verified", "1");
  if (next.saudi) p.set("saudi", "1");
  if (next.iso) p.set("iso", "1");
  if (next.type) p.set("type", next.type);
  if (next.availability) p.set("availability", next.availability);
  if (next.featured) p.set("featured", "1");
  if (next.sort && next.sort !== "relevant") p.set("sort", next.sort);
  if (view === "list") p.set("view", "list");
  const qs = p.toString();
  return qs ? `${action}?${qs}` : action;
}

export function BrowseMobileFilterBar({ locale, action, filters, cities, view }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string) => (isAr ? ar : en);
  const titleId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(72);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Pin under the header once the bar reaches it (more reliable than CSS sticky on mobile).
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || typeof IntersectionObserver === "undefined") return;

    let io: IntersectionObserver | null = null;

    const headerPx = () => {
      const spacer = document.querySelector<HTMLElement>(".hh-spacer");
      return Math.max(56, spacer?.offsetHeight || 72);
    };

    const connect = () => {
      io?.disconnect();
      const offset = headerPx();
      setHeaderOffset(offset);
      document.documentElement.style.setProperty("--brw-header-offset", `${offset}px`);
      io = new IntersectionObserver(
        ([entry]) => {
          setStuck(!entry.isIntersecting);
        },
        {
          root: null,
          rootMargin: `-${offset}px 0px 0px 0px`,
          threshold: 0,
        }
      );
      io.observe(anchor);
    };

    connect();
    window.addEventListener("resize", connect, { passive: true });
    return () => {
      window.removeEventListener("resize", connect);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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

  const basics: Array<{
    key: string;
    label: string;
    on: boolean;
    href: string;
    Icon?: typeof BadgeCheck;
  }> = [
    {
      key: "verified",
      label: L("Verified", "موثّق"),
      on: Boolean(filters.verified),
      href: buildHref(action, filters, { verified: !filters.verified }, view),
      Icon: BadgeCheck,
    },
    {
      key: "saudi",
      label: L("Saudi made", "صنع سعودي"),
      on: Boolean(filters.saudi),
      href: buildHref(action, filters, { saudi: !filters.saudi }, view),
      Icon: Factory,
    },
    {
      key: "featured",
      label: L("Featured", "مميز"),
      on: Boolean(filters.featured),
      href: buildHref(action, filters, { featured: !filters.featured }, view),
    },
  ];

  const topCities = cities.slice(0, 2);

  const bar = (
    <div className="brw-mbar__inner">
      <div className="brw-mbar__label" aria-hidden>
        <SlidersHorizontal size={13} strokeWidth={1.75} />
        {activeCount ? <em className="brw-mbar__count">{activeCount}</em> : null}
      </div>

      <div className="brw-mbar__chips" role="toolbar" aria-label={L("Filters", "التصفية")}>
        {basics.map((b) => (
          <Link
            key={b.key}
            href={b.href}
            className={cn("brw-mbar__chip", b.on && "is-on")}
            aria-pressed={b.on}
            scroll={false}
          >
            {b.Icon ? <b.Icon size={11} strokeWidth={1.75} aria-hidden /> : null}
            <span>{b.label}</span>
          </Link>
        ))}
        {topCities.map((c) => {
          const on = filters.city?.toLowerCase() === c.city.toLowerCase();
          return (
            <Link
              key={c.city}
              href={buildHref(action, filters, { city: on ? "" : c.city }, view)}
              className={cn("brw-mbar__chip", on && "is-on")}
              aria-pressed={on}
              scroll={false}
            >
              <span>{c.city}</span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        className="brw-mbar__advanced"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={L("Advanced filtration", "تصفية متقدمة")}
      >
        <span>{L("Advanced", "متقدم")}</span>
        <ArrowUpRight size={13} strokeWidth={1.85} aria-hidden />
      </button>
    </div>
  );

  return (
    <>
      <div className="brw-mbar-wrap" dir={isAr ? "rtl" : "ltr"}>
        <header className="brw-mbar__section">
          <p className="brw-mbar__section-eyebrow">
            <SlidersHorizontal size={13} strokeWidth={1.75} aria-hidden />
            <span>{L("Filtration", "التصفية")}</span>
          </p>
          <p className="brw-mbar__section-hint">
            {L("Quick filters for this category", "تصفية سريعة لهذا التصنيف")}
          </p>
        </header>
      </div>

      {/* Sentinel: when this leaves the viewport under the header, pin the bar */}
      <div ref={anchorRef} className="brw-mbar-anchor" aria-hidden />

      <div
        className={cn("brw-mbar", stuck && "is-stuck")}
        dir={isAr ? "rtl" : "ltr"}
        style={{ ["--brw-header-offset" as string]: `${headerOffset}px` } as CSSProperties}
      >
        {bar}
      </div>
      {stuck ? <div className="brw-mbar-spacer" aria-hidden /> : null}

      {portalReady &&
        open &&
        createPortal(
          <div className="brw-msheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="brw-msheet__backdrop" onClick={() => setOpen(false)} aria-hidden />
            <div className="brw-msheet__panel" dir={isAr ? "rtl" : "ltr"}>
              <header className="brw-msheet__head">
                <div>
                  <p className="brw-msheet__eyebrow">{L("Refine", "صقل")}</p>
                  <h2 id={titleId} className="brw-msheet__title">
                    {L("Advanced filtration", "تصفية متقدمة")}
                  </h2>
                </div>
                <button
                  type="button"
                  className="brw-msheet__close"
                  aria-label={L("Close", "إغلاق")}
                  onClick={() => setOpen(false)}
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </header>
              <div className="brw-msheet__body">
                <BrowseFiltersPanel
                  locale={locale}
                  action={action}
                  filters={filters}
                  cities={cities}
                  view={view}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
