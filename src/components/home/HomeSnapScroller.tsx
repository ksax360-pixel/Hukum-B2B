"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Full-page snap scroller for the homepage.
 * CSS snap alone often fails on Windows wheel/trackpad; this advances
 * one panel per intentional gesture.
 */
export function HomeSnapScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const locked = useRef(false);
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const sections = () =>
      Array.from(root.querySelectorAll<HTMLElement>(".home-snap-section"));

    const currentIndex = () => {
      const items = sections();
      if (!items.length) return 0;
      const top = root.scrollTop;
      let best = 0;
      let bestDist = Infinity;
      items.forEach((el, i) => {
        const dist = Math.abs(el.offsetTop - top);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    };

    const goTo = (index: number) => {
      const items = sections();
      if (!items.length) return;
      const next = Math.max(0, Math.min(items.length - 1, index));
      const target = items[next];
      if (!target) return;
      locked.current = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        locked.current = false;
      }, 700);
    };

    const onWheel = (e: WheelEvent) => {
      if (locked.current) {
        e.preventDefault();
        return;
      }
      // Ignore tiny trackpad noise
      if (Math.abs(e.deltaY) < 8) return;
      e.preventDefault();
      goTo(currentIndex() + (e.deltaY > 0 ? 1 : -1));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (locked.current) return;
      const keys = ["ArrowDown", "PageDown", "ArrowUp", "PageUp", "Home", "End", " "];
      if (!keys.includes(e.key)) return;
      // Don't steal space/arrows from inputs
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      const i = currentIndex();
      if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(sections().length - 1);
      else if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") goTo(i + 1);
      else goTo(i - 1);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchY.current == null || locked.current) return;
      const endY = e.changedTouches[0]?.clientY;
      if (endY == null) return;
      const delta = touchY.current - endY;
      touchY.current = null;
      if (Math.abs(delta) < 36) return;
      goTo(currentIndex() + (delta > 0 ? 1 : -1));
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={ref} className="home-snap-scroller" tabIndex={-1}>
      {children}
    </div>
  );
}
