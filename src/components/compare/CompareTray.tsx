"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Columns2, X } from "lucide-react";
import {
  COMPARE_EVENT,
  clearCompare,
  readCompare,
  removeFromCompare,
  type CompareItem,
} from "@/lib/compare-store";

export function CompareTray({ locale }: { locale: "en" | "ar" }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-2 rounded-xl border border-[#e6e2da] bg-white/95 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          <Columns2 className="h-4 w-4 shrink-0 text-[#c9a962]" />
          {items.map((it) => (
            <div
              key={it.id}
              className="flex max-w-[140px] shrink-0 items-center gap-1.5 rounded-lg border border-[#eee] bg-[#faf9f7] px-2 py-1"
            >
              <span className="truncate text-[11px] font-medium text-[#1a1612]">{it.name}</span>
              <button
                type="button"
                aria-label="Remove"
                className="text-[#8a8a8a] hover:text-[#1a1612]"
                onClick={() => setItems(removeFromCompare(it.id))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              clearCompare();
              setItems([]);
            }}
            className="text-[11px] text-[#8a8a8a] underline"
          >
            {isAr ? "مسح" : "Clear"}
          </button>
          <Link
            href={`/${locale}/compare`}
            className="inline-flex items-center rounded-lg bg-[#c9a962] px-3 py-2 text-xs font-semibold text-white hover:bg-[#b8953d]"
          >
            {isAr ? `قارن (${items.length})` : `Compare (${items.length})`}
          </Link>
        </div>
      </div>
    </div>
  );
}
