"use client";

// Suggestion panel under a search input: products, categories, suppliers, and a last row that turns
// the typed text into a request. Keyboard: ↑/↓ to move, Enter to open, Esc to close (D5, D7).

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, LayoutGrid, Send, Store } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Suggestions } from "@/modules/search/smart-search";

const DEBOUNCE_MS = 180;

type Row = { href: string; key: string };

/** Fetches suggestions for `q` (debounced, stale responses dropped). */
function useSuggestions(q: string, locale: Locale): Suggestions | null {
  const [data, setData] = useState<Suggestions | null>(null);
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setData(null);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}&locale=${locale}`, { signal: ctrl.signal });
        const body = await res.json();
        if (body?.success) setData(body.data as Suggestions);
      } catch {
        // Aborted or offline: keep the last list; Enter still runs a full search.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, locale]);
  return data;
}

/**
 * Suggestion state + panel for a search input. The panel is portalled to <body> with fixed position under
 * `anchorRef`, because the home hero sits inside several overflow:hidden snap sections that would clip it.
 */
export function useSearchSuggestions(
  q: string,
  locale: Locale,
  onPick: (href: string) => void,
  anchorRef: React.RefObject<HTMLElement | null>
) {
  const data = useSuggestions(q, locale);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [active, setActive] = useState(-1);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  useEffect(() => setActive(-1), [data]);

  const visible = open && Boolean(data) && q.trim().length >= 2;

  useLayoutEffect(() => {
    if (!visible) return;
    const place = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 8, left: r.left, width: r.width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [visible, anchorRef]);

  // Close on a click outside both the input and the (portalled) panel.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!anchorRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchorRef]);

  const u = data?.understood;
  const rfq = new URLSearchParams();
  if (u?.terms.length) rfq.set("q", u.terms.join(" "));
  else if (q.trim()) rfq.set("q", q.trim());
  if (u?.quantity) rfq.set("qty", String(u.quantity));
  if (u?.unit) rfq.set("unit", u.unit);
  if (u?.city) rfq.set("city", u.city);

  const rows: Row[] = data
    ? [
        ...data.products.map((p) => ({ key: `p-${p.slug}`, href: `/${locale}/products/${p.slug}` })),
        ...data.categories.map((c) => ({ key: `c-${c.id}`, href: `/${locale}/products?categoryId=${c.id}` })),
        ...data.suppliers.map((s) => ({ key: `s-${s.slug}`, href: `/${locale}/vendors/${s.slug}` })),
        { key: "rfq", href: `/${locale}/rfq?${rfq}` },
      ]
    : [];

  /** Returns true when the key was handled (so the form should not submit). */
  const onKeyDown = (e: React.KeyboardEvent): boolean => {
    if (!open || !rows.length) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      // -1 is the input itself; cycle input → rows → input.
      setActive((i) => ((i + 1 + step + rows.length + 1) % (rows.length + 1)) - 1);
      return true;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return true;
    }
    if (e.key === "Enter" && active >= 0 && rows[active]) {
      e.preventDefault();
      onPick(rows[active].href);
      setOpen(false);
      return true;
    }
    return false;
  };

  const idx = (key: string): number => rows.findIndex((r) => r.key === key);
  const itemProps = (key: string) => ({
    id: `sugg-${key}`,
    role: "option" as const,
    "aria-selected": rows[active]?.key === key,
    className: "disc-search__item",
    onMouseEnter: () => setActive(idx(key)),
    onClick: () => setOpen(false),
  });

  const panel =
    visible && data && rect ? (
      <div
        ref={panelRef}
        className="disc-search__panel"
        role="listbox"
        aria-label={L("Suggestions", "اقتراحات")}
        style={{ top: rect.top, left: rect.left, width: rect.width, maxHeight: `min(520px, calc(100vh - ${rect.top + 16}px))` }}
      >
        {u && (u.quantity || u.city) ? (
          <div className="disc-search__understood">
            {L("Understood:", "فهمنا:")}
            {u.terms.length ? <span className="disc-chip disc-chip--on">{u.terms.join(" ")}</span> : null}
            {u.quantity ? <span className="disc-chip disc-chip--on">{u.quantity.toLocaleString("en-US")}{u.unit ? ` ${u.unit}` : ""}</span> : null}
            {u.city ? <span className="disc-chip disc-chip--on">{u.city}</span> : null}
          </div>
        ) : null}

        {data.products.length ? (
          <div className="disc-search__group">
            <div className="disc-search__head">{L("Products", "منتجات")}</div>
            {data.products.map((p) => (
              <Link key={p.slug} href={`/${locale}/products/${p.slug}`} {...itemProps(`p-${p.slug}`)}>
                {p.image ? <img src={p.image} alt="" className="disc-search__thumb" /> : <span className="disc-search__thumb" />}
                <span className="disc-search__text">
                  <b>{p.name}</b>
                  {p.vendor ? <small>{p.vendor}{p.city ? `, ${p.city}` : ""}</small> : null}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {data.categories.length ? (
          <div className="disc-search__group">
            <div className="disc-search__head">{L("Categories", "فئات")}</div>
            {data.categories.map((c) => (
              <Link key={c.id} href={`/${locale}/products?categoryId=${c.id}`} {...itemProps(`c-${c.id}`)}>
                <span className="disc-search__icon"><LayoutGrid size={16} aria-hidden /></span>
                <span className="disc-search__text"><b>{c.name}</b></span>
              </Link>
            ))}
          </div>
        ) : null}

        {data.suppliers.length ? (
          <div className="disc-search__group">
            <div className="disc-search__head">{L("Suppliers", "موردون")}</div>
            {data.suppliers.map((s) => (
              <Link key={s.slug} href={`/${locale}/vendors/${s.slug}`} {...itemProps(`s-${s.slug}`)}>
                <span className="disc-search__icon"><Store size={16} aria-hidden /></span>
                <span className="disc-search__text">
                  <b>
                    {s.name} {s.verified ? <BadgeCheck size={14} className="disc-search__source" aria-label={L("Verified", "موثّق")} /> : null}
                  </b>
                  {s.city ? <small>{s.city}</small> : null}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="disc-search__group">
          <Link href={`/${locale}/rfq?${rfq}`} {...itemProps("rfq")}>
            <span className="disc-search__icon"><Send size={16} aria-hidden /></span>
            <span className="disc-search__text">
              <b>{L(`Can't find it? Request quotes for “${q.trim()}”`, `ما لقيته؟ اطلب عروض لـ «${q.trim()}»`)}</b>
              <small>{L("One request, sent to matching suppliers", "طلب واحد يوصل للموردين المناسبين")}</small>
            </span>
          </Link>
        </div>
      </div>
    ) : null;

  return {
    panel: panel && typeof document !== "undefined" ? createPortal(<div dir={isAr ? "rtl" : "ltr"}>{panel}</div>, document.body) : null,
    onKeyDown,
    open: () => setOpen(true),
    close: () => setOpen(false),
    activeId: active >= 0 && rows[active] ? `sugg-${rows[active].key}` : undefined,
    expanded: Boolean(panel),
  };
}
