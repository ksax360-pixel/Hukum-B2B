"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, MessageCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { ask, toast } from "@/components/ui/Feedback";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { QuoteCompareMatrix } from "@/components/quotations/QuoteCompareMatrix";
import {
  QuoteLifecycleBadge,
  QuoteVatHijriNote,
} from "@/components/quotations/QuoteLifecycleBadge";
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
  // ?rfq= opens one request's quotes side by side (linked from the buyer home).
  const rfqFilter = searchParams.get("rfq") || "";
  const rfqName = (searchParams.get("title") || "").slice(0, 120);

  const [items, setItems] = useState<QuotationRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(deepLinkId);
  const [detail, setDetail] = useState<QuotationRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
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

  const shown = useMemo(() => (rfqFilter ? items.filter((q) => rfqIdOf(q) === rfqFilter) : items), [items, rfqFilter]);
  useEffect(() => {
    if (rfqFilter && shown.length > 1) setCompareIds(shown.slice(0, 5).map((q) => q._id));
  }, [rfqFilter, shown]);

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

  /** Acts on the open quote, or on a quote picked straight from the comparison table. */
  async function decide(action: LifecycleAction, id: string = selectedId) {
    if (!id) return;
    const target = items.find((q) => q._id === id) || (id === selectedId ? selectedSummary : null);
    const vendorLabel =
      t(locale, target?.vendorId?.legalName) || target?.vendorId?.tradeName || (isAr ? "المورد" : "the supplier");
    const totalLabel = target?.total != null ? formatMoney(Number(target.total), locale) : "";
    let reason = "";
    if (action === "accept") {
      const r = await ask({
        title: isAr ? `قبول عرض ${vendorLabel}؟` : `Accept the quote from ${vendorLabel}?`,
        body: isAr
          ? `${totalLabel ? `${totalLabel}. ` : ""}نعتذر عن العروض الأخرى لهذا الطلب، وتتبادل أنت والمورد بيانات التواصل للاتفاق على الطلب.`
          : `${totalLabel ? `${totalLabel}. ` : ""}Other quotes for this request are declined. You and this supplier both get each other's contact to agree the order.`,
        confirmLabel: isAr ? "قبول العرض" : "Accept quote",
      });
      if (!r.ok) return;
    }
    if (action === "reject") {
      const r = await ask({
        title: isAr ? "تعتذر عن هذا العرض؟" : "Decline this quote?",
        body: isAr ? "نرسل السبب للمورد ليحسّن عرضه القادم." : "We pass your reason to the supplier so their next quote fits better.",
        confirmLabel: isAr ? "اعتذر" : "Decline quote",
        tone: "danger",
        reason: {
          label: isAr ? "السبب (اختياري)" : "Reason (optional)",
          presets: isAr
            ? ["السعر مرتفع", "مدة التوريد طويلة", "لا يطابق المواصفات", "اخترنا مورداً آخر"]
            : ["Price too high", "Lead time too long", "Doesn't match the spec", "Chose another supplier"],
        },
      });
      if (!r.ok) return;
      reason = r.reason;
    }
    if (action === "clarify") {
      const r = await ask({
        title: isAr ? "اسأل المورد" : "Ask the supplier",
        confirmLabel: isAr ? "إرسال السؤال" : "Send question",
        reason: { label: isAr ? "سؤالك" : "Your question", placeholder: isAr ? "مثال: هل يمكن التوصيل خلال 5 أيام؟" : "e.g. Can you deliver within 5 days?", required: true },
      });
      if (!r.ok) return;
      reason = r.reason;
    }
    setActionBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, action, ...(reason ? { reason, message: reason, note: reason } : {}) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Action failed");
      const labels: Record<LifecycleAction, string> = {
        accept: isAr ? "تم قبول العرض. بيانات المورد ظاهرة الآن." : "Quote accepted. The supplier's contact is now shown.",
        reject: isAr ? "تم الاعتذار عن العرض" : "Quote declined",
        shortlist: isAr ? "أُدرج في القائمة المختصرة" : "Shortlisted",
        clarify: isAr ? "أُرسل سؤالك" : "Question sent",
        confirm_deal: isAr ? "تم تسجيله كطلب" : "Marked as ordered",
        mark_reviewed: isAr ? "شكراً لتقييمك" : "Thanks for rating",
      };
      toast(labels[action]);
      await load();
      setSelectedId(id);
      setDetail(json.data as QuotationRow);
    } catch (e) {
      setError((e as Error).message);
      toast((e as Error).message, "error");
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

  const vendorName = (q: QuotationRow): string => t(locale, q.vendorId?.legalName) || q.vendorId?.tradeName || (isAr ? "مورد" : "Supplier");
  const money = (v?: number): string => (v != null ? formatMoney(Number(v), locale) : "—");
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const open = (s?: string): boolean => ["submitted", "revised", "clarifying", "shortlisted"].includes(s || "submitted");

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className={`bh vrq bq${selectedId ? " has-detail" : ""}`} dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>
              {rfqFilter && shown[0]
                ? L(`Quotes for “${rfqName || rfqRef(shown[0], locale)}”`, `عروض «${rfqName || rfqRef(shown[0], locale)}»`)
                : L("Quotes", "العروض")}
            </h1>
            <p>{rfqFilter ? L("Compare them side by side. Accept one to get the supplier's contact and agree the order with them.", "قارنها جنب بعض. اقبل واحد لتحصل على بيانات تواصل المورد وتتفق معه على الطلب.") : L("Every quote on your requests.", "كل العروض على طلباتك.")}</p>
          </div>
          <Link href={rfqFilter ? `/${locale}/buyer/quotations` : `/${locale}/buyer/rfqs`} className="bh-btn">
            {rfqFilter ? L("All quotes", "كل العروض") : L("Your requests", "طلباتك")}
          </Link>
        </header>

        {error ? <p className="sfe-status is-rejected">{error}</p> : null}

        <QuoteCompareMatrix
          locale={locale}
          quotes={shown}
          selectedIds={compareIds}
          busy={actionBusy}
          onAccept={(id) => void decide("accept", id)}
          onAsk={(id) => void decide("clarify", id)}
          onToggle={(id) => setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id]))}
        />

        <div className="vrq-body">
          <section className="vrq-list" aria-label={L("Quotes", "العروض")}>
            {loading ? (
              <p className="vrq-pick">{L("Loading…", "جارٍ التحميل…")}</p>
            ) : shown.length === 0 ? (
              <p className="pdp2-empty vrq-empty">
                {L("No quotes yet. They show here as suppliers reply to your requests.", "ما فيه عروض بعد. تظهر هنا أول ما يرد الموردون على طلباتك.")}{" "}
                <Link href={`/${locale}/rfq`}>{L("Ask for a price", "اطلب سعر")}</Link>
              </p>
            ) : (
              <ul>
                {shown.map((q) => (
                  <li key={q._id}>
                    <button type="button" className={`vrq-item${selectedId === q._id ? " is-on" : ""}`} aria-current={selectedId === q._id ? "true" : undefined} onClick={() => setSelectedId(q._id)}>
                      <span className="vrq-item__top">
                        <b>{vendorName(q)}</b>
                        <QuoteLifecycleBadge status={q.status} locale={locale} />
                      </span>
                      <span className="vrq-item__meta">
                        <span className="bq-total">{money(q.total)}</span>
                        {!rfqFilter ? <span>{rfqRef(q, locale)}</span> : null}
                        {q.leadTime ? <span>{q.leadTime}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="vrq-detail" aria-label={L("Quote details", "تفاصيل العرض")}>
            {!selectedId ? (
              <p className="vrq-pick">{shown.length ? L("Pick a quote to see every line and the terms.", "اختر عرضاً لتشوف كل البنود والشروط.") : ""}</p>
            ) : detailLoading && !detail ? (
              <p className="vrq-pick">{L("Loading…", "جارٍ التحميل…")}</p>
            ) : detail || selectedSummary ? (
              (() => {
                const q = (detail || selectedSummary)!;
                const accepted = ["accepted", "deal_confirmed", "reviewed"].includes(q.status || "");
                return (
                  <div className="qb">
                    <button type="button" className="qb-back" onClick={() => setSelectedId("")}>{L("All quotes", "كل العروض")}</button>
                    <div className="qb-head">
                      <h2>{vendorName(q)} {q.vendorId?.verificationStatus === "verified" ? <BadgeCheck size={18} aria-label={L("Verified", "موثّق")} className="sv-tick" /> : null}</h2>
                      <p className="qb-meta"><QuoteLifecycleBadge status={q.status} locale={locale} /><span>{rfqRef(q, locale)}</span></p>
                    </div>

                    {(q.lines || []).length ? (
                      <div className="qb-lines">
                        <div className="qb-line qb-line--head"><span>{L("Item", "البند")}</span><span>{L("Qty", "الكمية")}</span><span>{L("Unit price", "سعر الوحدة")}</span><span>{L("Line total", "الإجمالي")}</span></div>
                        {(q.lines || []).map((line, idx) => (
                          <div key={idx} className="qb-line">
                            <span className="qb-item"><b>{line.name || L(`Line ${idx + 1}`, `بند ${idx + 1}`)}</b>{line.notes ? <small>{line.notes}</small> : null}</span>
                            <span className="qb-num">{line.quantity ?? "—"}</span>
                            <span className="qb-num">{money(line.unitPrice)}</span>
                            <span className="qb-num">{money(line.total)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="qb-total">
                      <dl className="bq-terms">
                        <div><dt>{L("Lead time", "مدة التوريد")}</dt><dd>{q.leadTime || "—"}</dd></div>
                        <div><dt>{L("Payment", "الدفع")}</dt><dd>{q.paymentTerms || "—"}</dd></div>
                        <div><dt>{L("Valid until", "صالح حتى")}</dt><dd>{q.validity ? new Date(q.validity).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}{q.validityHijri ? ` · ${q.validityHijri}` : ""}</dd></div>
                        {q.warranty ? <div><dt>{L("Warranty", "الضمان")}</dt><dd>{q.warranty}</dd></div> : null}
                      </dl>
                      <dl>
                        <div><dt>{L("Subtotal", "المجموع")}</dt><dd>{money(q.subtotal)}</dd></div>
                        <div><dt>{L("Delivery", "التوصيل")}</dt><dd>{q.shipping ? money(q.shipping) : L("Free", "مجاني")}</dd></div>
                        <div><dt>{q.vatIncluded ? L("VAT included", "شامل الضريبة") : L("VAT 15%", "الضريبة ١٥٪")}</dt><dd>{money(q.tax)}</dd></div>
                        <div className="is-total"><dt>{L("Total", "الإجمالي")}</dt><dd>{money(q.total)}</dd></div>
                      </dl>
                    </div>
                    <QuoteVatHijriNote locale={locale} vatIncluded={q.vatIncluded} validity={q.validity} validityHijri={q.validityHijri} />
                    {q.notes ? <p className="qb-desc bq-note">{q.notes}</p> : null}

                    {accepted ? (
                      <div className="qb-sent bq-contact">
                        <div>
                          <b>{L("You accepted this quote", "قبلت هذا العرض")}</b>
                          <p>{L("Contact the supplier to agree the order, delivery and payment.", "تواصل مع المورد للاتفاق على الطلب والتوصيل والدفع.")}</p>
                          <dl>
                            {(q.contact?.phone || q.vendorId?.phone) ? <div><dt>{L("Phone", "الجوال")}</dt><dd dir="ltr"><a href={`tel:${q.contact?.phone || q.vendorId?.phone}`}>{q.contact?.phone || q.vendorId?.phone}</a></dd></div> : null}
                            {(q.contact?.email || q.vendorId?.email) ? <div><dt>{L("Email", "البريد")}</dt><dd dir="ltr"><a href={`mailto:${q.contact?.email || q.vendorId?.email}`}>{q.contact?.email || q.vendorId?.email}</a></dd></div> : null}
                          </dl>
                        </div>
                      </div>
                    ) : null}

                    <div className="qb-act">
                      {open(q.status) ? (
                        <>
                          <button type="button" className="qb-send" disabled={actionBusy} onClick={() => void decide("accept")}><Check size={17} aria-hidden /> {L("Accept quote", "اقبل العرض")}</button>
                          <button type="button" className="bh-btn" disabled={actionBusy} onClick={() => void decide("clarify")}>{L("Ask a question", "اسأل سؤال")}</button>
                          <button type="button" className="qb-pass" disabled={actionBusy} onClick={() => void decide("reject")}>{L("Decline", "اعتذر")}</button>
                        </>
                      ) : null}
                      {(q.status || "") === "accepted" ? (
                        <button type="button" className="bh-btn" disabled={actionBusy} onClick={() => void decide("confirm_deal")}>{L("Mark as ordered", "تم الطلب")}</button>
                      ) : null}
                      {["deal_confirmed", "accepted"].includes(q.status || "") ? (
                        <button type="button" className="bh-btn" disabled={actionBusy} onClick={() => void decide("mark_reviewed")}>{L("Rate this supplier", "قيّم المورد")}</button>
                      ) : null}
                      <button type="button" className="qb-pass" disabled={actionBusy} onClick={() => void messageSeller()}><MessageCircle size={15} aria-hidden /> {L("Message", "راسل")}</button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="vrq-pick">{L("Couldn't load this quote.", "تعذّر تحميل العرض.")}</p>
            )}
          </section>
        </div>
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
