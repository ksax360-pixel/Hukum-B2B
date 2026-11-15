"use client";

import { useMemo, useRef, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  renderShowcaseCard,
  type ShowcaseCardItem,
} from "@/components/home/ShowcaseCards";

/** Distinct column speeds — Apple-style staggered parallax. */
const COLUMN_DURATIONS = ["22s", "34s", "27s"] as const;
/** Negative delays keep the -50% loop seamless while offsetting columns. */
const COLUMN_DELAYS = ["0s", "-11s", "-5.5s"] as const;
const FLOAT_PHASES = ["a", "b", "c", "d"] as const;

function splitColumns(items: ShowcaseCardItem[], columns: number): ShowcaseCardItem[][] {
  const cols: ShowcaseCardItem[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, i) => {
    cols[i % columns].push(item);
  });
  return cols.map((col) => {
    if (col.length === 0) return col;
    if (col.length >= 4) return col;
    const padded = [...col];
    while (padded.length < 4) {
      padded.push(
        ...col.map((c, idx) => ({
          ...c,
          id: `${c.id}-pad-${padded.length}-${idx}`,
        }))
      );
    }
    return padded;
  });
}

export function ProductShowcase({
  items,
  emptyLabel,
}: {
  items: ShowcaseCardItem[];
  emptyLabel: string;
}) {
  const columns = useMemo(() => splitColumns(items, 3), [items]);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(rootRef, { once: true, amount: 0.2 });

  if (!items.length) {
    return (
      <div className="hukum-showcase hukum-showcase--empty" role="status">
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <motion.div
      ref={rootRef}
      className="hukum-showcase"
      aria-label="Featured products"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      animate={
        reduceMotion || inView
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 28 }
      }
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hukum-showcase__glow hukum-showcase__glow--a" aria-hidden />
      <div className="hukum-showcase__glow hukum-showcase__glow--b" aria-hidden />
      <div className="hukum-showcase__glow hukum-showcase__glow--c" aria-hidden />
      <div className="hukum-showcase__fade hukum-showcase__fade--top" aria-hidden />
      <div className="hukum-showcase__fade hukum-showcase__fade--bottom" aria-hidden />

      <div className="hukum-showcase__stage">
        {columns.map((col, colIndex) => {
          if (!col.length) return null;
          const loop = [...col, ...col];
          return (
            <motion.div
              key={colIndex}
              className={`hukum-showcase__col hukum-showcase__col--${colIndex + 1}`}
              style={
                {
                  "--hukum-duration": COLUMN_DURATIONS[colIndex] || "28s",
                  "--hukum-delay": COLUMN_DELAYS[colIndex] || "0s",
                } as CSSProperties
              }
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              animate={
                reduceMotion || inView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 40 }
              }
              transition={{
                duration: 0.85,
                delay: 0.12 + colIndex * 0.14,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="hukum-showcase__track">
                {loop.map((item, i) => {
                  const phase = FLOAT_PHASES[i % FLOAT_PHASES.length];
                  const tilt =
                    i % 5 === 1 ? "tilt-left" : i % 5 === 3 ? "tilt-right" : "tilt-none";
                  return (
                    <div
                      key={`${item.id}-${i}`}
                      className={`hukum-showcase__item hukum-showcase__item--float-${phase} hukum-showcase__item--${tilt}`}
                      aria-hidden={i >= col.length}
                    >
                      {renderShowcaseCard(item, colIndex * 10 + i)}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
