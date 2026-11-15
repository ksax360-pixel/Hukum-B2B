"use client";

import { useEffect, useState } from "react";
import { Columns2, Check } from "lucide-react";
import {
  addToCompare,
  COMPARE_EVENT,
  isInCompare,
  removeFromCompare,
  type CompareItem,
} from "@/lib/compare-store";
import { track } from "@/lib/track-client";

type Props = {
  locale: "en" | "ar";
  item: CompareItem;
  className?: string;
};

export function AddToCompareButton({ locale, item, className = "" }: Props) {
  const isAr = locale === "ar";
  const [on, setOn] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sync = () => setOn(isInCompare(item.id));
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [item.id]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (on) {
      removeFromCompare(item.id);
      setOn(false);
      return;
    }
    const res = addToCompare(item);
    if (!res.ok) {
      setToast(isAr ? "حد أقصى 4 منتجات" : "Max 4 products");
      setTimeout(() => setToast(""), 2000);
      return;
    }
    setOn(true);
    void track({ type: "add_to_compare", productId: item.id, meta: { slug: item.slug } });
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={toggle}
        title={isAr ? "مقارنة" : "Compare"}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
          on
            ? "border-[#c9a962] bg-[#c9a962]/15 text-[#1a1612]"
            : "border-[#e6e2da] bg-transparent text-[#5c5c5c] hover:border-[#c9a962]/50"
        }`}
      >
        {on ? <Check size={12} /> : <Columns2 size={12} />}
        {isAr ? "مقارنة" : "Compare"}
      </button>
      {toast ? (
        <span className="absolute start-0 top-full z-20 mt-1 whitespace-nowrap rounded bg-[#1a1612] px-2 py-1 text-[10px] text-white">
          {toast}
        </span>
      ) : null}
    </span>
  );
}
