"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { dashT } from "@/i18n/dash-copy";
import { t } from "@/lib/utils";

type RfqRow = {
  _id: string;
  title?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  status?: string;
  deadline?: string;
  createdAt?: string;
  budget?: number;
  currency?: string;
  paymentTerms?: string;
  incoterms?: string;
  additionalRequirements?: string;
  deliveryLocation?: { city?: string; region?: string; address?: string; country?: string };
  items?: Array<{
    name?: { en?: string; ar?: string };
    quantity?: number;
    unit?: string;
    specifications?: string;
  }>;
};

type RfqDetail = {
  rfq: RfqRow;
  invitations?: Array<{
    status?: string;
    matchScore?: number;
    vendorId?: { legalName?: { en?: string }; tradeName?: string };
  }>;
  quotations?: Array<{
    _id: string;
    status?: string;
    total?: number;
    currency?: string;
    subtotal?: number;
    lines?: Array<{ name?: string; quantity?: number; unitPrice?: number; total?: number }>;
    vendorId?: { legalName?: { en?: string }; tradeName?: string };
  }>;
};

type SavedInterest = {
  reference: string;
  productId: string;
  productName?: string;
  vendorId?: string;
  vendorName?: string;
  quantity?: string;
  phone?: string;
  fullName?: string;
  companyName?: string;
  createdAt?: string;
};

function readInterests(): SavedInterest[] {
  try {
    const raw = localStorage.getItem("kt_product_interests");
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string | SavedInterest>;
    return Object.entries(map).map(([productId, value]) => {
      if (typeof value === "string") {
        return { productId, reference: value };
      }
      return { ...value, productId: value.productId || productId };
    });
  } catch {
    return [];
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 mb-0 text-sm font-medium text-[var(--ink)]">{children ?? "—"}</p>
    </div>
  );
}

function BuyerRfqsInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const initialTab = searchParams.get("tab") === "interests" ? "interests" : "rfqs";
  const [tab, setTab] = useState<"rfqs" | "interests">(initialTab);
  const [items, setItems] = useState<RfqRow[]>([]);
  const [interests, setInterests] = useState<SavedInterest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<RfqDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reBusy, setReBusy] = useState(false);
  const [matchBusy, setMatchBusy] = useState(false);
  const [matchMsg, setMatchMsg] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    setInterests(readInterests());
    fetch("/api/rfqs")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function reRfq(rfqId: string) {
    setReBusy(true);
    setError("");
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "re_rfq", rfqId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Re-RFQ failed");
      await load();
      if (json.data?._id) setSelectedId(String(json.data._id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReBusy(false);
    }
  }

  async function setRfqStatus(rfqId: string, status: "cancelled" | "closed") {
    const confirmMsg =
      status === "cancelled"
        ? isAr
          ? "إلغاء هذا الطلب؟ لن يستقبل عروضاً جديدة."
          : "Cancel this RFQ? It will stop accepting new quotes."
        : isAr
          ? "إغلاق هذا الطلب؟"
          : "Close this RFQ?";
    if (!window.confirm(confirmMsg)) return;
    setStatusBusy(true);
    setError("");
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "set_status", rfqId, status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Status update failed");
      setMatchMsg(status === "cancelled" ? (isAr ? "تم الإلغاء" : "RFQ cancelled") : isAr ? "تم الإغلاق" : "RFQ closed");
      await load();
      const d = await fetch(`/api/rfqs?id=${encodeURIComponent(rfqId)}`).then((r) => r.json());
      if (d.success) setDetail(d.data as RfqDetail);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStatusBusy(false);
    }
  }

  async function saveEdit(rfqId: string) {
    setStatusBusy(true);
    setError("");
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update",
          rfqId,
          titleEn: editTitle,
          deliveryLocation: { city: editCity || undefined, country: "SA" },
          deadline: editDeadline || undefined,
          budget: editBudget || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Update failed");
      setEditOpen(false);
      setMatchMsg(isAr ? "تم حفظ التعديلات" : "RFQ updated");
      await load();
      const d = await fetch(`/api/rfqs?id=${encodeURIComponent(rfqId)}`).then((r) => r.json());
      if (d.success) setDetail(d.data as RfqDetail);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStatusBusy(false);
    }
  }

  /** Invite / re-match several suppliers at once for this RFQ. */
  async function inviteMatched(rfqId: string) {
    setMatchBusy(true);
    setMatchMsg("");
    setError("");
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "match", rfqId, limit: 12 }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Match failed");
      const n = Array.isArray(json.data?.matches) ? json.data.matches.length : 0;
      setMatchMsg(
        isAr ? `تمت دعوة ${n} مورداً مطابقاً.` : `Invited ${n} matched suppliers.`
      );
      const d = await fetch(`/api/rfqs?id=${encodeURIComponent(rfqId)}`).then((r) => r.json());
      if (d.success) setDetail(d.data as RfqDetail);
      else setSelectedId(rfqId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMatchBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("tab") === "interests") setTab("interests");
  }, [searchParams]);

  useEffect(() => {
    try {
      const focus = sessionStorage.getItem("kt_buyer_rfq_focus");
      if (focus) {
        sessionStorage.removeItem("kt_buyer_rfq_focus");
        setTab("rfqs");
        setSelectedId(focus);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/rfqs?id=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setDetail(j.data as RfqDetail);
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const selectedInterest = useMemo(
    () => interests.find((i) => i.productId === selectedId) || null,
    [interests, selectedId]
  );

  const rfq = detail?.rfq;

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{dashT(locale, "RFQs")}</h1>
          <p className="text-[var(--muted)]">
            {isAr
              ? "طلبات الأسعار واهتمامات المنتجات المحفوظة."
              : "Your RFQs and saved product interests — full details in one place."}
          </p>
        </div>
        <Link href={`/${locale}/rfq`} className="btn-primary">
          {isAr ? "إنشاء طلب" : "Create RFQ"}
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full border px-4 py-2 text-sm font-medium ${
            tab === "rfqs"
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--ink)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
          onClick={() => {
            setTab("rfqs");
            setSelectedId("");
          }}
        >
          {isAr ? "طلبات الأسعار" : "RFQs"} ({items.length})
        </button>
        <button
          type="button"
          className={`rounded-full border px-4 py-2 text-sm font-medium ${
            tab === "interests"
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--ink)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
          onClick={() => {
            setTab("interests");
            setSelectedId("");
          }}
        >
          {isAr ? "الاهتمامات" : "Interests"} ({interests.length})
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--accent)]">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <div className="surface-card overflow-hidden">
          {loading ? (
            <div className="skeleton m-4 h-24" />
          ) : tab === "rfqs" ? (
            items.length === 0 ? (
              <div className="empty-state">
                <p className="font-medium text-[var(--ink)]">{isAr ? "لا توجد طلبات بعد" : "No RFQs yet"}</p>
                <p className="mt-2 text-sm">
                  {isAr
                    ? "أنشئ طلب عرض سعر من السوق."
                    : "Create a request for quotation from the marketplace."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="p-4 label-caps">{isAr ? "العنوان" : "Title"}</th>
                    <th className="p-4 label-caps">{isAr ? "الحالة" : "Status"}</th>
                    <th className="p-4 label-caps">{isAr ? "الموعد" : "Deadline"}</th>
                    <th className="p-4 label-caps" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r._id} className="table-row">
                      <td className="p-4 font-medium">{t(locale, r.title) || "RFQ"}</td>
                      <td className="p-4 capitalize text-[var(--ink-soft)]">{r.status || "open"}</td>
                      <td className="p-4 text-[var(--muted)]">
                        {r.deadline ? new Date(r.deadline).toLocaleDateString(locale) : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          className="btn-ghost px-3 py-2 text-xs"
                          onClick={() => setSelectedId(r._id)}
                        >
                          {isAr ? "التفاصيل" : "Details"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : interests.length === 0 ? (
            <div className="empty-state">
              <p className="font-medium text-[var(--ink)]">
                {isAr ? "لا توجد اهتمامات بعد" : "No interests yet"}
              </p>
              <p className="mt-2 mb-4 text-sm">
                {isAr
                  ? "اضغط قلب المنتج لحفظ الاهتمام وإرساله للبائع."
                  : "Tap a product heart to save interest and notify the seller."}
              </p>
              <Link href={`/${locale}/products`} className="btn-secondary">
                {isAr ? "تصفح المنتجات" : "Browse products"}
              </Link>
            </div>
          ) : (
            <ul className="m-0 divide-y divide-[var(--border)] p-0">
              {interests.map((row) => (
                <li key={row.productId}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-[var(--surface-2)]"
                    onClick={() => setSelectedId(row.productId)}
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate font-medium text-[var(--ink)]">
                        {row.productName || (isAr ? "منتج" : "Product")}
                      </p>
                      <p className="mt-1 mb-0 text-xs text-[var(--muted)]">
                        {row.vendorName || "—"} · {row.reference}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#e8f6ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1f7a45]">
                      {isAr ? "اهتمام" : "Interested"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="surface-card h-fit p-5">
          {!selectedId ? (
            <p className="m-0 text-sm text-[var(--muted)]">
              {isAr ? "اختر عنصرًا لعرض التفاصيل." : "Select a row to view full details."}
            </p>
          ) : tab === "interests" && selectedInterest ? (
            <div className="space-y-4">
              <div>
                <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--accent)]">
                  {isAr ? "اهتمام محفوظ" : "Saved interest"}
                </p>
                <h2 className="mt-1 mb-0 text-lg font-semibold text-[var(--ink)]">
                  {selectedInterest.productName || (isAr ? "منتج" : "Product")}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={isAr ? "المرجع" : "Reference"}>{selectedInterest.reference}</Field>
                <Field label={isAr ? "البائع" : "Seller"}>
                  {selectedInterest.vendorName || "—"}
                </Field>
                <Field label={isAr ? "الاسم" : "Buyer"}>{selectedInterest.fullName || "—"}</Field>
                <Field label={isAr ? "الشركة" : "Company"}>
                  {selectedInterest.companyName || "—"}
                </Field>
                <Field label={isAr ? "الجوال" : "Phone"}>{selectedInterest.phone || "—"}</Field>
                <Field label={isAr ? "الكمية" : "Quantity"}>
                  {selectedInterest.quantity || "—"}
                </Field>
                <Field label={isAr ? "التاريخ" : "Saved"}>
                  {selectedInterest.createdAt
                    ? new Date(selectedInterest.createdAt).toLocaleString(locale)
                    : "—"}
                </Field>
              </div>
              <p className="m-0 text-xs text-[var(--muted)]">
                {isAr
                  ? "تم إرسال هذا الاهتمام للبائع ولوحة الإدارة."
                  : "This interest was sent to the seller and admin panel."}
              </p>
              <Link
                href={`/${locale}/products/${selectedInterest.productId}`}
                className="btn-secondary inline-flex text-sm"
              >
                {isAr ? "فتح المنتج" : "Open product"}
              </Link>
            </div>
          ) : detailLoading ? (
            <p className="m-0 text-sm text-[var(--muted)]">{isAr ? "جاري التحميل…" : "Loading…"}</p>
          ) : rfq ? (
            <div className="space-y-4">
              <div>
                <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--accent)]">
                  RFQ · {rfq.status || "open"}
                </p>
                <h2 className="mt-1 mb-0 text-lg font-semibold text-[var(--ink)]">
                  {t(locale, rfq.title) || "RFQ"}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["draft", "open", "matching"].includes(rfq.status || "") ? (
                    <button
                      type="button"
                      disabled={statusBusy}
                      onClick={() => {
                        setEditTitle(t(locale, rfq.title) || "");
                        setEditCity(rfq.deliveryLocation?.city || "");
                        setEditDeadline(rfq.deadline ? String(rfq.deadline).slice(0, 10) : "");
                        setEditBudget(rfq.budget != null ? String(rfq.budget) : "");
                        setEditOpen((v) => !v);
                      }}
                      className="btn-secondary inline-flex text-xs disabled:opacity-50"
                    >
                      {isAr ? "تعديل" : "Edit"}
                    </button>
                  ) : null}
                  {!["cancelled", "closed", "awarded"].includes(rfq.status || "") ? (
                    <>
                      <button
                        type="button"
                        disabled={statusBusy}
                        onClick={() => void setRfqStatus(rfq._id, "cancelled")}
                        className="btn-ghost inline-flex text-xs disabled:opacity-50"
                      >
                        {isAr ? "إلغاء" : "Cancel RFQ"}
                      </button>
                      <button
                        type="button"
                        disabled={statusBusy}
                        onClick={() => void setRfqStatus(rfq._id, "closed")}
                        className="btn-ghost inline-flex text-xs disabled:opacity-50"
                      >
                        {isAr ? "إغلاق" : "Close"}
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    disabled={matchBusy}
                    onClick={() => void inviteMatched(rfq._id)}
                    className="btn-primary inline-flex text-xs disabled:opacity-50"
                  >
                    {matchBusy
                      ? isAr
                        ? "جارٍ…"
                        : "Matching…"
                      : isAr
                        ? "دعوة عدة موردين"
                        : "Request quotes from several suppliers"}
                  </button>
                  <button
                    type="button"
                    disabled={reBusy}
                    onClick={() => void reRfq(rfq._id)}
                    className="btn-secondary inline-flex text-xs disabled:opacity-50"
                  >
                    {reBusy
                      ? isAr
                        ? "جارٍ…"
                        : "Working…"
                      : isAr
                        ? "إعادة طلب (Re-RFQ)"
                        : "Re-RFQ / reorder"}
                  </button>
                </div>
                {editOpen ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-[var(--border)] p-3">
                    <input
                      className="input-field"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder={isAr ? "العنوان" : "Title"}
                    />
                    <input
                      className="input-field"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder={isAr ? "المدينة" : "City"}
                    />
                    <input
                      className="input-field"
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                    <input
                      className="input-field"
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      placeholder={isAr ? "الميزانية" : "Budget"}
                    />
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      disabled={statusBusy}
                      onClick={() => void saveEdit(rfq._id)}
                    >
                      {isAr ? "حفظ" : "Save changes"}
                    </button>
                  </div>
                ) : null}
                {matchMsg ? <p className="mt-2 mb-0 text-xs text-[var(--gold,#c9a962)]">{matchMsg}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={isAr ? "الموعد النهائي" : "Deadline"}>
                  {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString(locale) : "—"}
                </Field>
                <Field label={isAr ? "الميزانية" : "Budget"}>
                  {rfq.budget != null ? `${rfq.currency || "SAR"} ${rfq.budget}` : "—"}
                </Field>
                <Field label={isAr ? "المدينة" : "Delivery city"}>
                  {rfq.deliveryLocation?.city || "—"}
                </Field>
                <Field label={isAr ? "العنوان" : "Address"}>
                  {rfq.deliveryLocation?.address || rfq.deliveryLocation?.region || "—"}
                </Field>
                <Field label={isAr ? "الدفع" : "Payment"}>{rfq.paymentTerms || "—"}</Field>
                <Field label="Incoterms">{rfq.incoterms || "—"}</Field>
              </div>
              {t(locale, rfq.description) ? (
                <div>
                  <p className="mb-1 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                    {isAr ? "الوصف" : "Description"}
                  </p>
                  <p className="m-0 whitespace-pre-wrap text-sm text-[var(--ink)]">
                    {t(locale, rfq.description)}
                  </p>
                </div>
              ) : null}
              {(rfq.items || []).length > 0 ? (
                <div>
                  <p className="mb-2 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                    {isAr ? "البنود" : "Line items"}
                  </p>
                  <ul className="m-0 space-y-2 p-0">
                    {(rfq.items || []).map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                      >
                        <p className="m-0 font-medium">
                          {t(locale, item.name) || `Item ${idx + 1}`}
                        </p>
                        <p className="mt-1 mb-0 text-xs text-[var(--muted)]">
                          {item.quantity ?? "—"} {item.unit || "pcs"}
                          {item.specifications ? ` · ${item.specifications}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {rfq.additionalRequirements ? (
                <Field label={isAr ? "متطلبات إضافية" : "Additional requirements"}>
                  <span className="whitespace-pre-wrap font-normal">{rfq.additionalRequirements}</span>
                </Field>
              ) : null}
              {(detail?.invitations || []).length > 0 ? (
                <div>
                  <p className="mb-2 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                    {isAr ? "البائعون المدعوون" : "Invited sellers"} ({detail?.invitations?.length})
                  </p>
                  <ul className="m-0 space-y-1.5 p-0 text-sm">
                    {(detail?.invitations || []).map((inv, idx) => (
                      <li key={idx} className="flex justify-between gap-2 border-b border-[var(--border)] pb-1.5">
                        <span>
                          {inv.vendorId?.legalName?.en || inv.vendorId?.tradeName || "Seller"}
                        </span>
                        <span className="capitalize text-[var(--muted)]">{inv.status || "invited"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(detail?.quotations || []).length > 0 ? (
                <div>
                  <p className="mb-2 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">
                    {isAr ? "عروض الأسعار" : "Quotations"}
                  </p>
                  <ul className="m-0 space-y-2 p-0 text-sm">
                    {(detail?.quotations || []).map((q) => (
                      <li
                        key={q._id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">
                            {q.vendorId?.legalName?.en || q.vendorId?.tradeName || "Seller"}
                          </span>
                          <span className="capitalize text-[var(--muted)]">{q.status || "submitted"}</span>
                        </div>
                        <p className="mt-1 mb-0 text-xs text-[var(--muted)]">
                          {q.total != null
                            ? `${q.currency || "SAR"} ${q.total}`
                            : q.subtotal != null
                              ? `${q.currency || "SAR"} ${q.subtotal}`
                              : "—"}
                          {(q.lines || []).length
                            ? ` · ${(q.lines || []).length} ${isAr ? "بند" : "line(s)"}`
                            : ""}
                        </p>
                        <Link
                          href={`/${locale}/buyer/quotations?id=${encodeURIComponent(q._id)}`}
                          className="mt-2 inline-flex text-xs font-semibold text-[var(--accent)] hover:underline"
                        >
                          {isAr ? "عرض التفاصيل" : "View quotation detail"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">
              {isAr ? "تعذر تحميل التفاصيل." : "Could not load details."}
            </p>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

export default function BuyerRfqsPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell locale="en" title="Buyer" nav={[...BUYER_NAV]}>
          <div className="skeleton h-24" />
        </DashboardShell>
      }
    >
      <BuyerRfqsInner />
    </Suspense>
  );
}
