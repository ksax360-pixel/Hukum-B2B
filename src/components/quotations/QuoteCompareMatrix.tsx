"use client";

import { normalizeQuote, recommendQuote, type RawQuote } from "@/lib/quote-normalize";

type Props = {
  locale: string;
  quotes: RawQuote[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function QuoteCompareMatrix({ locale, quotes, selectedIds, onToggle }: Props) {
  const isAr = locale === "ar";
  const selected = quotes.filter((q) => selectedIds.includes(String(q._id)));
  const normalized = selected.map((q) => normalizeQuote(q, locale));
  const bestId = recommendQuote(normalized);

  if (quotes.length < 2) return null;

  return (
    <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-semibold text-[var(--ink)]">
          {isAr ? "مقارنة العروض جنباً إلى جنب" : "Side-by-side quote compare"}
        </h3>
        <p className="m-0 text-xs text-[var(--muted)]">
          {isAr ? "اختر عرضين أو أكثر" : "Select 2+ quotes"}
        </p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {quotes.map((q) => {
          const id = String(q._id);
          const on = selectedIds.includes(id);
          const label =
            (locale === "ar" ? q.vendorId?.legalName?.ar : q.vendorId?.legalName?.en) ||
            q.vendorId?.tradeName ||
            id.slice(-6);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                on
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--ink)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {normalized.length >= 2 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-[var(--muted)]">
                <th className="p-2 font-medium">{isAr ? "البند" : "Field"}</th>
                {normalized.map((n) => (
                  <th key={n.id} className={`p-2 font-semibold ${bestId === n.id ? "text-green-700" : ""}`}>
                    {n.vendorLabel}
                    {bestId === n.id ? (isAr ? " ★ موصى" : " ★ best") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["unit", isAr ? "سعر الوحدة" : "Unit price", (n: (typeof normalized)[0]) => `${n.unitPrice} ${n.currency}`],
                  ["landed", isAr ? "التكلفة النهائية/وحدة" : "Landed / unit", (n) => `${n.landedPerUnit} ${n.currency}`],
                  ["sub", isAr ? "المجموع الفرعي" : "Subtotal", (n) => `${n.subtotal}`],
                  ["vat", isAr ? "الضريبة" : "VAT / tax", (n) => (n.tax ? String(n.tax) : n.taxIncludedHint ? (isAr ? "مشمول؟" : "incl.?") : "0")],
                  ["ship", isAr ? "الشحن" : "Delivery", (n) => String(n.shipping)],
                  ["total", isAr ? "الإجمالي" : "Total", (n) => `${n.total} ${n.currency}`],
                  ["lead", isAr ? "التوريد" : "Lead time", (n) => n.leadTime],
                  ["pay", isAr ? "الدفع" : "Payment", (n) => n.paymentTerms],
                  ["valid", isAr ? "الصلاحية" : "Validity", (n) => n.validity],
                ] as const
              ).map(([key, label, get]) => (
                <tr key={key} className="border-b border-[var(--border)]/60">
                  <td className="p-2 text-[var(--muted)]">{label}</td>
                  {normalized.map((n) => (
                    <td key={n.id + key} className="p-2 font-medium text-[var(--ink)]">
                      {get(n)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 mb-0 text-[11px] text-[var(--muted)]">
            {isAr
              ? "التطبيع: سعر الوحدة + الضريبة + الشحن = تكلفة نهائية للمقارنة."
              : "Normalized: unit + VAT + delivery = landed cost for fair compare."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
