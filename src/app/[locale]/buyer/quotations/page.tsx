"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { QuoteCompareMatrix } from "@/components/quotations/QuoteCompareMatrix";
import {
  QuoteLifecycleBadge,
  QuoteVatHijriNote,
} from "@/components/quotations/QuoteLifecycleBadge";
import { dashT } from "@/i18n/dash-copy";
import { t } from "@/lib/utils";

type QuoteLine = {
  name?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  notes?: string;
};

type QuotationRow = {
  _id: string;
  rfqId?:
    | string
    | {
        _id?: string;
        title?: { en?: string; ar?: string };
        status?: string;
        deadline?: string;
        currency?: string;
      };
  total?: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  status?: string;
  leadTime?: string;
  deliveryTime?: string;
  paymentTerms?: string;
  warranty?: string;
  notes?: string;
  validity?: string;
  validityHijri?: string;
  vatIncluded?: boolean;
  lines?: QuoteLine[];
  vendorId?: {
    legalName?: { en?: string; ar?: string };
    tradeName?: string;
    verificationStatus?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    company?: string;
  };
  conversationId?: string;
  deal?: { status?: string; total?: number; currency?: string };
  createdAt?: string;
};

type LifecycleAction =
  | "accept"
  | "reject"
  | "shortlist"
  | "clarify"
  | "confirm_deal"
  | "mark_reviewed";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 mb-0 text-sm font-medium text-[var(--ink)]">{children ?? "—"}</p>
    </div>
  );
}

function rfqRef(q: QuotationRow, locale: string) {
  if (typeof q.rfqId === "object" && q.rfqId) {
    return t(locale, q.rfqId.title) || String(q.rfqId._id || "").slice(-8) || "RFQ";
  }
  return q.rfqId ? String(q.rfqId).slice(-8) : "—";
}

function rfqIdOf(q: QuotationRow) {
  if (typeof q.rfqId === "object" && q.rfqId?._id) return String(q.rfqId._id);
  return q.rfqId ? String(q.rfqId) : "";
}

function QuotationsInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const deepLinkId = searchParams.get("id") || "";

  const [items, setItems] = useState<QuotationRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(deepLinkId);
  const [detail, setDetail] = useState<QuotationRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch("/api/quotations")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (deepLinkId) setSelectedId(deepLinkId);
  }, [deepLinkId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const fromList = items.find((q) => q._id === selectedId);
    if (fromList?.lines) {
      setDetail(fromList);
    }
    setDetailLoading(true);
    fetch(`/api/quotations?id=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setDetail(j.data as QuotationRow);
      })
      .catch(() => {
        if (!fromList) setDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId, items]);

  const currency = detail?.currency || "SAR";

  const selectedSummary = useMemo(
    () => items.find((q) => q._id === selectedId) || detail,
    [items, selectedId, detail]
  );

  async function decide(action: LifecycleAction) {
    if (!selectedId) return;
    if (action === "accept") {
      const vendorLabel =
        t(locale, selectedSummary?.vendorId?.legalName) ||
        selectedSummary?.vendorId?.tradeName ||
        "supplier";
      const totalLabel =
        selectedSummary?.total != null
          ? `${selectedSummary.currency || "SAR"} ${selectedSummary.total}`
          : "";
      const ok = window.confirm(
        isAr
          ? `تأكيد قبول عرض ${vendorLabel}${totalLabel ? ` (${totalLabel})` : ""}؟ سيتم رفض العروض الأخرى وفتح بيانات التواصل وإنشاء سجل صفقة.`
          : `Accept quote from ${vendorLabel}${totalLabel ? ` (${totalLabel})` : ""}? Other quotes will be declined, supplier contact unlocked, and a deal record created.`
      );
      if (!ok) return;
    }
    setActionBusy(true);
    setActionMsg("");
    setError("");
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: selectedId, action }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Action failed");
      const labels: Record<LifecycleAction, string> = {
        accept: isAr ? "تم قبول العرض — تم فتح التواصل وإنشاء الصفقة" : "Quote accepted — contact unlocked, deal created",
        reject: isAr ? "تم الرفض" : "Quotation rejected",
        shortlist: isAr ? "أُدرج في القائمة المختصرة" : "Shortlisted",
        clarify: isAr ? "بانتظار التوضيح" : "Marked clarifying",
        confirm_deal: isAr ? "تم تأكيد الصفقة" : "Deal confirmed",
        mark_reviewed: isAr ? "تم التقييم" : "Marked reviewed",
      };
      setActionMsg(labels[action]);
      await load();
      setDetail(json.data as QuotationRow);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionBusy(false);
    }
  }

  async function messageSeller() {
    if (!selectedId) return;
    setActionBusy(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          quotationId: selectedId,
          rfqId: rfqIdOf(detail || selectedSummary || { _id: "" }),
          subject: isAr ? "مناقشة عرض السعر" : "Quotation discussion",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Could not start chat");
      window.location.href = `/${locale}/buyer/messages`;
    } catch (e) {
      setError((e as Error).message);
      setActionBusy(false);
    }
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{dashT(locale, "Quotations")}</h1>
          <p className="text-[var(--muted)]">
            {isAr
              ? "عروض الأسعار من البائعين — البنود والمجاميع وحالة الطلب."
              : "Vendor responses to your RFQs — lines, totals, status, and RFQ reference."}
          </p>
        </div>
        <Link href={`/${locale}/buyer/rfqs`} className="btn-secondary">
          {isAr ? "طلبات الأسعار" : "Your RFQs"}
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--accent)]">{error}</p> : null}
      {actionMsg ? <p className="mb-4 text-sm text-[var(--gold,#c9a962)]">{actionMsg}</p> : null}

      <QuoteCompareMatrix
        locale={locale}
        quotes={items}
        selectedIds={compareIds}
        onToggle={(id) =>
          setCompareIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id]
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)]">
        <div className="surface-card overflow-hidden">
          {loading ? (
            <div className="skeleton m-4 h-24" />
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">
                {isAr ? "لا توجد عروض بعد" : "No quotations received"}
              </p>
              <p className="mt-2 text-sm">
                {isAr
                  ? "ستظهر عروض البائعين المدعوين هنا."
                  : "Quotes from matched vendors will appear here."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="p-4 label-caps">{isAr ? "البائع" : "Vendor"}</th>
                  <th className="p-4 label-caps">{isAr ? "الطلب" : "RFQ"}</th>
                  <th className="p-4 label-caps">{isAr ? "الإجمالي" : "Total"}</th>
                  <th className="p-4 label-caps">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-4 label-caps" />
                </tr>
              </thead>
              <tbody>
                {items.map((q) => (
                  <tr
                    key={q._id}
                    className={`table-row ${selectedId === q._id ? "bg-[var(--surface-2)]" : ""}`}
                  >
                    <td className="p-4 font-medium">
                      {t(locale, q.vendorId?.legalName) || q.vendorId?.tradeName || "Vendor"}
                    </td>
                    <td className="p-4 text-[var(--muted)]">{rfqRef(q, locale)}</td>
                    <td className="p-4">
                      {q.total != null ? `${q.currency || "SAR"} ${q.total}` : "—"}
                    </td>
                    <td className="p-4">
                      <QuoteLifecycleBadge status={q.status} locale={locale} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        className="btn-ghost px-3 py-2 text-xs"
                        onClick={() => setSelectedId(q._id)}
                      >
                        {isAr ? "التفاصيل" : "Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="surface-card h-fit p-5">
          {!selectedId ? (
            <p className="m-0 text-sm text-[var(--muted)]">
              {isAr ? "اختر عرض سعر لعرض التفاصيل." : "Select a quotation to view full details."}
            </p>
          ) : detailLoading && !detail ? (
            <p className="m-0 text-sm text-[var(--muted)]">{isAr ? "جاري التحميل…" : "Loading…"}</p>
          ) : detail || selectedSummary ? (
            <div className="space-y-4">
              {(() => {
                const q = detail || selectedSummary!;
                const rid = rfqIdOf(q);
                return (
                  <>
                    <div>
                      <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--accent)]">
                        {isAr ? "عرض سعر" : "Quotation"}
                      </p>
                      <h2 className="mt-1 mb-0 text-lg font-semibold text-[var(--ink)]">
                        {t(locale, q.vendorId?.legalName) || q.vendorId?.tradeName || "Vendor"}
                      </h2>
                      <div className="mt-2">
                        <QuoteLifecycleBadge status={q.status} locale={locale} />
                      </div>
                      <p className="mt-2 mb-0 text-xs text-[var(--muted)]">
                        {isAr ? "مرجع الطلب" : "RFQ ref"}: {rfqRef(q, locale)}
                      </p>
                    </div>

                    <QuoteVatHijriNote
                      locale={locale}
                      vatIncluded={q.vatIncluded}
                      validity={q.validity}
                      validityHijri={q.validityHijri}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={isAr ? "الإجمالي" : "Total"}>
                        {q.total != null ? `${currency} ${q.total}` : "—"}
                      </Field>
                      <Field label={isAr ? "المجموع الفرعي" : "Subtotal"}>
                        {q.subtotal != null ? `${currency} ${q.subtotal}` : "—"}
                      </Field>
                      <Field
                        label={
                          q.vatIncluded
                            ? isAr
                              ? "ضريبة القيمة المضافة (مشمولة)"
                              : "VAT (included)"
                            : isAr
                              ? "ضريبة القيمة المضافة (غير مشمولة)"
                              : "VAT (excl.)"
                        }
                      >
                        {q.tax != null ? `${currency} ${q.tax}` : "—"}
                      </Field>
                      <Field label={isAr ? "الشحن" : "Shipping"}>
                        {q.shipping != null ? `${currency} ${q.shipping}` : "—"}
                      </Field>
                      <Field label={isAr ? "مدة التوريد" : "Lead time"}>{q.leadTime || "—"}</Field>
                      <Field label={isAr ? "الدفع" : "Payment"}>{q.paymentTerms || "—"}</Field>
                      <Field label={isAr ? "الضمان" : "Warranty"}>{q.warranty || "—"}</Field>
                      <Field label={isAr ? "صالح حتى" : "Valid until"}>
                        {q.validity ? new Date(q.validity).toLocaleDateString(locale) : "—"}
                        {q.validityHijri ? ` · ${q.validityHijri}` : ""}
                      </Field>
                    </div>

                    {(q.lines || []).length > 0 ? (
                      <div>
                        <p className="mb-2 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                          {isAr ? "بنود العرض" : "Quote lines"}
                        </p>
                        <ul className="m-0 space-y-2 p-0">
                          {(q.lines || []).map((line, idx) => (
                            <li
                              key={idx}
                              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                            >
                              <p className="m-0 font-medium">{line.name || `Line ${idx + 1}`}</p>
                              <p className="mt-1 mb-0 text-xs text-[var(--muted)]">
                                {line.quantity ?? "—"} × {currency} {line.unitPrice ?? "—"}
                                {line.total != null ? ` = ${currency} ${line.total}` : ""}
                              </p>
                              {line.notes ? (
                                <p className="mt-1 mb-0 text-xs text-[var(--muted)]">{line.notes}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="m-0 text-xs text-[var(--muted)]">
                        {isAr ? "لا توجد بنود مفصّلة." : "No line items on this quotation."}
                      </p>
                    )}

                    {q.notes ? (
                      <Field label={isAr ? "ملاحظات" : "Notes"}>
                        <span className="whitespace-pre-wrap font-normal">{q.notes}</span>
                      </Field>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {["submitted", "revised", "clarifying"].includes(q.status || "submitted") ? (
                        <>
                          <button
                            type="button"
                            className="btn-secondary text-sm"
                            disabled={actionBusy}
                            onClick={() => void decide("shortlist")}
                          >
                            {isAr ? "قائمة مختصرة" : "Shortlist"}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost text-sm"
                            disabled={actionBusy}
                            onClick={() => void decide("clarify")}
                          >
                            {isAr ? "طلب توضيح" : "Ask clarifying"}
                          </button>
                          <button
                            type="button"
                            className="btn-primary text-sm"
                            disabled={actionBusy}
                            onClick={() => void decide("accept")}
                          >
                            {isAr ? "قبول العرض" : "Accept quote"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-sm"
                            disabled={actionBusy}
                            onClick={() => void decide("reject")}
                          >
                            {isAr ? "رفض" : "Reject"}
                          </button>
                        </>
                      ) : null}
                      {(q.status || "") === "shortlisted" ? (
                        <>
                          <button
                            type="button"
                            className="btn-primary text-sm"
                            disabled={actionBusy}
                            onClick={() => void decide("accept")}
                          >
                            {isAr ? "قبول العرض" : "Accept quote"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-sm"
                            disabled={actionBusy}
                            onClick={() => void decide("reject")}
                          >
                            {isAr ? "رفض" : "Reject"}
                          </button>
                        </>
                      ) : null}
                      {(q.status || "") === "accepted" || (q.status || "") === "deal_confirmed" ? (
                        <div className="w-full space-y-2 rounded-lg border border-[var(--gold,#c9a962)]/40 bg-[var(--gold,#c9a962)]/10 p-3">
                          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--gold,#c9a962)]">
                            {isAr ? "بيانات المورد · صفقة مفتوحة" : "Supplier contact · deal open"}
                          </p>
                          <p className="m-0 text-sm">
                            {q.contact?.company ||
                              t(locale, q.vendorId?.legalName) ||
                              q.vendorId?.tradeName ||
                              "—"}
                          </p>
                          <p className="m-0 text-sm">
                            {isAr ? "هاتف" : "Phone"}:{" "}
                            {q.contact?.phone || q.vendorId?.phone || "—"}
                          </p>
                          <p className="m-0 text-sm">
                            Email: {q.contact?.email || q.vendorId?.email || "—"}
                          </p>
                          <p className="m-0 text-sm">
                            WhatsApp: {q.contact?.whatsapp || q.vendorId?.whatsapp || q.contact?.phone || "—"}
                          </p>
                          {q.deal ? (
                            <p className="m-0 text-xs text-[var(--muted)]">
                              {isAr ? "سجل الصفقة" : "Deal record"}: {q.deal.status || "open"} ·{" "}
                              {q.deal.total != null
                                ? `${q.deal.currency || currency} ${q.deal.total}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      {(q.status || "") === "accepted" ? (
                        <button
                          type="button"
                          className="btn-primary text-sm"
                          disabled={actionBusy}
                          onClick={() => void decide("confirm_deal")}
                        >
                          {isAr ? "تأكيد الصفقة" : "Confirm deal closed"}
                        </button>
                      ) : null}
                      {["deal_confirmed", "accepted"].includes(q.status || "") ? (
                        <button
                          type="button"
                          className="btn-secondary text-sm"
                          disabled={actionBusy}
                          onClick={() => void decide("mark_reviewed")}
                        >
                          {isAr ? "تقييم المورد" : "Leave review"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn-ghost text-sm"
                        disabled={actionBusy}
                        onClick={() => void messageSeller()}
                      >
                        {isAr ? "مراسلة البائع" : "Message seller"}
                      </button>
                      {rid ? (
                        <Link
                          href={`/${locale}/buyer/rfqs`}
                          className="btn-secondary inline-flex text-sm"
                          onClick={() => {
                            try {
                              sessionStorage.setItem("kt_buyer_rfq_focus", rid);
                            } catch {
                              /* ignore */
                            }
                          }}
                        >
                          {isAr ? "فتح طلب السعر" : "Open related RFQ"}
                        </Link>
                      ) : null}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">
              {isAr ? "تعذر تحميل التفاصيل." : "Could not load quotation details."}
            </p>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

export default function BuyerQuotationsPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell locale="en" title="Buyer" nav={[...BUYER_NAV]}>
          <div className="skeleton h-24" />
        </DashboardShell>
      }
    >
      <QuotationsInner />
    </Suspense>
  );
}
