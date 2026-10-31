"use client";

import { useEffect, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";

type Props = {
  locale: "en" | "ar";
  productId: string;
  className?: string;
};

export function SaveProductButton({ locale, productId, className = "" }: Props) {
  const isAr = locale === "ar";
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kt_saved_products");
      const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      setSaved(Boolean(map[productId]));
    } catch {
      /* ignore */
    }
  }, [productId]);

  async function toggle() {
    setBusy(true);
    setNeedsLogin(false);
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_product", productId }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (res.status === 401 || !json.success) {
        // Guest: keep local bookmark so UX still works; prompt login for sync.
        const next = !saved;
        setSaved(next);
        try {
          const raw = localStorage.getItem("kt_saved_products");
          const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
          if (next) map[productId] = true;
          else delete map[productId];
          localStorage.setItem("kt_saved_products", JSON.stringify(map));
        } catch {
          /* ignore */
        }
        if (res.status === 401) setNeedsLogin(true);
        return;
      }
      setSaved(true);
      try {
        const raw = localStorage.getItem("kt_saved_products");
        const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
        map[productId] = true;
        localStorage.setItem("kt_saved_products", JSON.stringify(map));
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#e6e2da] bg-transparent px-3 py-2 text-xs font-semibold text-[#1a1612] hover:border-[#c9a962]/55 disabled:opacity-60"
        aria-label={isAr ? "حفظ" : "Save"}
        title={saved ? (isAr ? "محفوظ" : "Saved") : isAr ? "حفظ المنتج" : "Save product"}
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Bookmark size={14} className={saved ? "fill-[#c9a962] text-[#c9a962]" : ""} />
        )}
        {saved ? (isAr ? "محفوظ" : "Saved") : isAr ? "حفظ" : "Save"}
      </button>
      {needsLogin ? (
        <p className="mt-1 m-0 text-[0.65rem] text-[#8a8a8a]">
          {isAr ? "سُجّل محلياً — سجّل الدخول للمزامنة." : "Saved on this device — sign in to sync."}
        </p>
      ) : null}
    </div>
  );
}
