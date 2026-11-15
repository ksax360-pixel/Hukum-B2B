"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SectorTile = {
  slug: string;
  href: string;
  label: string;
  image?: string;
};

type Props = {
  items: SectorTile[];
  ariaLabel: string;
  rtl?: boolean;
  /** Endless smooth marquee — no snap back to the first tile. */
  continuous?: boolean;
};

const AUTO_MS = 3200;
const GAP = 8;
const MIN_TILE = 88;
const MOBILE_MAX_TILE = 96;
/** Original desktop tile width — do not stretch on desktop / ultrawide. */
const DESKTOP_TILE = 138;
const CONTINUOUS_TILE = 118;
const PX_PER_SEC = 32;
const DESKTOP_MQ = "(min-width: 1024px)";

/**
 * Horizontal sector cards. Uses transform (not nested overflow scroll) so
 * vertical page scrolling is never captured. Tile width is computed so the
 * visible row ends flush with the content card width on the right.
 * Pass continuous for a seamless left-to-right loop with no jump.
 */
export function SectorTilesCarousel({
  items,
  ariaLabel,
  rtl = false,
  continuous = false,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [tileW, setTileW] = useState(continuous ? CONTINUOUS_TILE : MIN_TILE);
  const [inView, setInView] = useState(true);
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const vp = viewport.clientWidth;
    if (vp <= 0) return;

    if (continuous) {
      setTileW(CONTINUOUS_TILE);
      return;
    }

    const isDesktop = window.matchMedia(DESKTOP_MQ).matches;

    // Desktop / ultrawide: keep the original fixed tile size (no stretch).
    if (isDesktop) {
      const canFit = Math.max(1, Math.floor((vp + GAP) / (DESKTOP_TILE + GAP)));
      const visible = Math.min(items.length, canFit);
      const max = Math.max(0, items.length - visible);
      setTileW(DESKTOP_TILE);
      setMaxIndex(max);
      setIndex((i) => Math.min(i, max));
      return;
    }

    // Phone / tablet: compact tiles (capped) — do not inflate when few children.
    const canFit = Math.max(1, Math.floor((vp + GAP) / (MIN_TILE + GAP)));
    const visible = Math.min(items.length, canFit);
    const stretched = Math.floor((vp - (visible - 1) * GAP) / visible);
    const width = Math.min(MOBILE_MAX_TILE, Math.max(MIN_TILE, stretched));
    const max = Math.max(0, items.length - visible);

    setTileW(width);
    setMaxIndex(max);
    setIndex((i) => Math.min(i, max));
  }, [items.length, continuous]);

  useEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.2),
      { threshold: [0, 0.2, 0.5] },
    );
    io.observe(viewport);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (continuous) return;
    setOffset(index * (tileW + GAP));
  }, [index, tileW, continuous]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }, [maxIndex]);

  useEffect(() => {
    if (continuous) return;
    if (maxIndex < 1 || paused || !inView) return;
    if (reduceMotion) return;
    const id = window.setInterval(goNext, AUTO_MS);
    return () => window.clearInterval(id);
  }, [maxIndex, paused, inView, goNext, continuous, reduceMotion]);

  const loopWidth = items.length * (tileW + GAP);

  useEffect(() => {
    if (!continuous || reduceMotion || items.length < 2 || loopWidth <= 0) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused && inView) {
        offsetRef.current += PX_PER_SEC * dt;
        if (offsetRef.current >= loopWidth) {
          offsetRef.current -= loopWidth;
        }
        setOffset(offsetRef.current);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [continuous, reduceMotion, items.length, loopWidth, paused, inView]);

  const renderItems = useMemo(() => {
    if (!continuous || reduceMotion) return items.map((c) => ({ ...c, key: c.slug }));
    // Two copies so the seam is invisible when the offset wraps.
    return [0, 1].flatMap((copy) =>
      items.map((c) => ({ ...c, key: `${c.slug}__${copy}` }))
    );
  }, [items, continuous, reduceMotion]);

  if (!items.length) return null;

  const shift = rtl ? offset : -offset;

  return (
    <section
      className={`brw__sectors${continuous ? " brw__sectors--continuous" : ""}`}
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="brw__sectors-viewport" ref={viewportRef}>
        <div
          className="brw__sectors-track"
          ref={trackRef}
          style={{
            transform: `translate3d(${shift}px, 0, 0)`,
            gap: GAP,
            ["--brw-tile-w" as string]: `${tileW}px`,
          }}
        >
          {renderItems.map((c) => (
            <Link key={c.key} href={c.href} className="brw__tile" tabIndex={0}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.image ? <img src={c.image} alt="" loading="lazy" draggable={false} /> : <span className="brw__tile-ph" />}
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
