"use client";

// Quotes for one request side by side, cheapest landed cost first. The best value in each row is marked,
// and the decision (accept, ask a question) sits under each supplier's column.

import { normalizeQuote, recommendQuote, type RawQuote } from "@/lib/quote-normalize";
import { formatMoney } from "@/lib/money";
import { leadDays } from "@/components/browse/group-offers";

type Props = {
  locale: string;
  quotes: RawQuote[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAccept?: (id: string) => void;
  onAsk?: (id: string) => void;
  busy?: boolean;
};

type N = ReturnType<typeof normalizeQuote>;
type Row = { key: string; label: string; value: (n: N) => string; score?: (n: N) => number };

export function QuoteCompareMatrix({ locale, quotes, selectedIds, onToggle, onAccept, onAsk, busy }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const money = (v: unknown, n: N): string => (v == null || v === "" ? "—" : formatMoney(Number(v), locale, n.currency || "SAR"));
  const normalized = quotes
    .filter((q) => selectedIds.includes(String(q._id)))
    .map((q) => normalizeQuote(q, locale))
    .sort((a, b) => Number(a.landedPerUnit) - Number(b.landedPerUnit));
  const bestId = recommendQuote(normalized);

  if (quotes.length < 2) return null;

  const date = (n: N): string => {
    const d = n.validity ? new Date(n.validity) : null;
    if (!d || Number.isNaN(d.getTime())) return n.validity || "—";
    return d.toLocaleDateString(isAr ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const hijri = (n: N): string => {
    const d = n.validity ? new Date(n.validity) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(isAr ? "ar-SA-u-ca-islamic-umalqura-nu-latn" : "en-u-ca-islamic-umalqura", { day: "numeric", month: "short", year: "numeric" });
  };

  const rows: Row[] = [
    { key: "landed", label: L("Per unit, landed", "الوحدة شاملة كل شيء"), value: (n) => money(n.landedPerUnit, n), score: (n) => Number(n.landedPerUnit) },
    { key: "unit", label: L("Unit price", "سعر الوحدة"), value: (n) => money(n.unitPrice, n), score: (n) => Number(n.unitPrice) },
    { key: "sub", label: L("Subtotal", "المجموع الفرعي"), value: (n) => money(n.subtotal, n) },
    { key: "vat", label: L("VAT", "الضريبة"), value: (n) => (n.tax ? money(n.tax, n) : n.taxIncludedHint ? L("Included?", "مشمولة؟") : money(0, n)) },
    { key: "ship", label: L("Delivery", "التوصيل"), value: (n) => (Number(n.shipping) ? money(n.shipping, n) : L("Free", "مجاني")) },
    { key: "lead", label: L("Lead time", "مدة التوريد"), value: (n) => n.leadTime || "—", score: (n) => leadDays(n.leadTime) },
    { key: "pay", label: L("Payment", "الدفع"), value: (n) => n.paymentTerms || "—" },
    { key: "valid", label: L("Valid until", "صالح حتى"), value: date },
  ];
  const bestIn = (r: Row): string | undefined => {
    if (!r.score || normalized.length < 2) return undefined;
    const scored = normalized.map((n) => ({ id: n.id, s: r.score!(n) })).filter((x) => Number.isFinite(x.s));
    if (scored.length < 2) return undefined;
    const min = Math.min(...scored.map((x) => x.s));
    const winners = scored.filter((x) => x.s === min);
    return winners.length === 1 ? winners[0].id : undefined;
  };

  return (
    <section className="qcm" dir={isAr ? "rtl" : "ltr"} aria-labelledby="qcm-h">
      <div className="qcm__head">
        <h2 id="qcm-h">{L("Compare side by side", "قارن جنباً إلى جنب")}</h2>
        <div className="qcm__pick" role="group" aria-label={L("Quotes in the comparison", "العروض في المقارنة")}>
          {quotes.map((q) => {
            const id = String(q._id);
            const on = selectedIds.includes(id);
            const label = (isAr ? q.vendorId?.legalName?.ar : q.vendorId?.legalName?.en) || q.vendorId?.tradeName || id.slice(-6);
            return (
              <button key={id} type="button" aria-pressed={on} className={on ? "is-on" : ""} onClick={() => onToggle(id)}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {normalized.length >= 2 ? (
        <div className="qcm__scroll">
          <table className="qcm__table">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">{L("Field", "البند")}</span></th>
                {normalized.map((n) => (
                  <th key={n.id} scope="col" className={bestId === n.id ? "is-best" : ""}>
                    <span className="qcm__vendor">{n.vendorLabel}</span>
                    {bestId === n.id ? <span className="qcm__tag">{L("Best value", "الأفضل قيمة")}</span> : null}
                    <b className="qcm__total">{money(n.total, n)}</b>
                    <small>{L("total incl. VAT and delivery", "الإجمالي شامل الضريبة والتوصيل")}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const win = bestIn(r);
                return (
                  <tr key={r.key}>
                    <th scope="row">{r.label}</th>
                    {normalized.map((n) => (
                      <td key={n.id} className={win === n.id ? "is-win" : ""}>
                        {r.value(n)}
                        {r.key === "valid" && hijri(n) ? <small className="qcm__hijri">{hijri(n)}</small> : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            {onAccept || onAsk ? (
              <tfoot>
                <tr>
                  <th scope="row"><span className="sr-only">{L("Decide", "القرار")}</span></th>
                  {normalized.map((n) => (
                    <td key={n.id}>
                      {onAccept ? (
                        <button type="button" className={`qcm__accept${bestId === n.id ? "" : " is-alt"}`} disabled={busy} onClick={() => onAccept(n.id)}>
                          {L("Accept this quote", "اقبل هذا العرض")}
                        </button>
                      ) : null}
                      {onAsk ? (
                        <button type="button" className="qcm__ask" disabled={busy} onClick={() => onAsk(n.id)}>
                          {L("Ask a question", "اسأل سؤالاً")}
                        </button>
                      ) : null}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
          <p className="qcm__note">
            {L("Per unit, landed = unit price plus VAT and delivery, so quotes with different terms compare fairly.", "الوحدة شاملة كل شيء = سعر الوحدة مع الضريبة والتوصيل، عشان تكون المقارنة عادلة.")}
          </p>
        </div>
      ) : (
        <p className="qcm__note">{L("Pick two or more quotes to compare.", "اختر عرضين أو أكثر للمقارنة.")}</p>
      )}
    </section>
  );
}
