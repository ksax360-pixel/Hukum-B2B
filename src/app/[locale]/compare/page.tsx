"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  COMPARE_EVENT,
  clearCompare,
  readCompare,
  removeFromCompare,
  type CompareItem,
} from "@/lib/compare-store";

export default function ComparePage() {
  const params = useParams();
  const locale = (params.locale === "ar" ? "ar" : "en") as "en" | "ar";
  const isAr = locale === "ar";
  const [items, setItems] = useState<CompareItem[]>([]);
  const [need, setNeed] = useState("");
  const [ai, setAi] = useState<{
    reply?: string;
    bestId?: string | null;
    tradeoffs?: string[];
    questions?: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    return () => window.removeEventListener(COMPARE_EVENT, sync);
  }, []);

  async function runAi() {
    if (items.length < 2) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: items, need, locale }),
      });
      const json = await res.json();
      if (json.success) setAi(json.data);
    } finally {
      setBusy(false);
    }
  }

  const rows: { key: string; label: string; get: (i: CompareItem) => string }[] = [
    { key: "vendor", label: isAr ? "المورد" : "Supplier", get: (i) => i.vendorName || "—" },
    { key: "price", label: isAr ? "السعر" : "Price", get: (i) => i.priceLabel || "—" },
    { key: "moq", label: "MOQ", get: (i) => (i.moq != null && i.moq !== "" ? String(i.moq) : "—") },
    { key: "lead", label: isAr ? "مدة التوريد" : "Lead time", get: (i) => i.leadTime || "—" },
    { key: "city", label: isAr ? "المدينة" : "City", get: (i) => i.city || "—" },
    {
      key: "verified",
      label: isAr ? "التوثيق" : "Verified",
      get: (i) => (i.verified ? (isAr ? "نعم" : "Yes") : isAr ? "لا" : "No"),
    },
  ];

  return (
    <div className="container-custom py-10">
      <header className="mb-8">
        <p className="label-caps m-0">{isAr ? "مقارنة" : "Compare"}</p>
        <h1 className="mt-2 text-2xl font-bold text-[#001730]">
          {isAr ? "مقارنة المنتجات جنباً إلى جنب" : "Side-by-side product compare"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#5c5c5c]">
          {isAr
            ? "اختر حتى 4 منتجات ثم اطلب ملخص الذكاء الاصطناعي لأفضل تطابق."
            : "Select up to 4 products, then ask AI for the best fit and trade-offs."}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e6e2da] p-10 text-center">
          <p className="m-0 text-sm text-[#6b6b6b]">
            {isAr ? "لا توجد منتجات في المقارنة." : "No products in your compare tray."}
          </p>
          <Link href={`/${locale}/products`} className="mt-4 inline-flex text-sm font-semibold text-[#c9a962]">
            {isAr ? "تصفح المنتجات" : "Browse products"}
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#e6e2da]">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#faf9f7]">
                  <th className="p-3 text-start font-semibold text-[#5c5c5c]">{isAr ? "المعيار" : "Spec"}</th>
                  {items.map((it) => (
                    <th key={it.id} className="min-w-[160px] p-3 text-start">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/${locale}/products/${it.slug}`}
                          className={`font-semibold hover:text-[#b8953d] ${
                            ai?.bestId === it.id ? "text-[#1b7a3d]" : "text-[#001730]"
                          }`}
                        >
                          {it.name}
                          {ai?.bestId === it.id ? (isAr ? " ★" : " ★") : ""}
                        </Link>
                        <button
                          type="button"
                          className="text-[11px] text-[#8a8a8a] underline"
                          onClick={() => setItems(removeFromCompare(it.id))}
                        >
                          {isAr ? "إزالة" : "Remove"}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-[#eee]">
                    <td className="p-3 font-medium text-[#5c5c5c]">{row.label}</td>
                    {items.map((it) => (
                      <td key={it.id + row.key} className="p-3 text-[#1a1612]">
                        {row.get(it)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl border border-[#e6e2da] bg-[#faf9f7] p-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">
              {isAr ? "وصف احتياجك (اختياري)" : "Describe your need (optional)"}
            </label>
            <textarea
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-lg border border-[#e6e2da] bg-white px-3 py-2 text-sm"
              placeholder={isAr ? "مثال: خوذات للمشاريع، توصيل الرياض…" : "e.g. helmets for projects, Riyadh delivery…"}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || items.length < 2}
                onClick={() => void runAi()}
                className="rounded-lg bg-[#001730] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy
                  ? isAr
                    ? "جارٍ التحليل…"
                    : "Analyzing…"
                  : isAr
                    ? "ملخص الذكاء الاصطناعي"
                    : "AI compare summary"}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCompare();
                  setItems([]);
                  setAi(null);
                }}
                className="rounded-lg border border-[#e6e2da] px-4 py-2 text-sm"
              >
                {isAr ? "مسح الكل" : "Clear all"}
              </button>
            </div>
            {ai?.reply ? (
              <div className="mt-4 space-y-2 text-sm text-[#1a1612]">
                <p className="m-0 font-medium">{ai.reply}</p>
                {ai.tradeoffs?.length ? (
                  <ul className="m-0 list-disc ps-5 text-[#5c5c5c]">
                    {ai.tradeoffs.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}
                {ai.questions?.length ? (
                  <div>
                    <p className="mb-1 font-semibold">{isAr ? "أسئلة للموردين" : "Questions to ask suppliers"}</p>
                    <ul className="m-0 list-disc ps-5 text-[#5c5c5c]">
                      {ai.questions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
