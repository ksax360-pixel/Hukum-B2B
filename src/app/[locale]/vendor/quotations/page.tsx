"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashT } from "@/i18n/dash-copy";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/company", label: "Company" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/ai-upload", label: "AI Upload" },
  { href: "/vendor/rfqs", label: "RFQs" },
  { href: "/vendor/quotations", label: "Quotations" },
  { href: "/vendor/analytics", label: "Analytics" },
  { href: "/vendor/documents", label: "Documents" },
  { href: "/vendor/subscription", label: "Subscription" },
  { href: "/vendor/settings", label: "Settings" },
];

type QuotationRow = {
  _id: string;
  rfqId?: string;
  status?: string;
  total?: number;
  currency?: string;
  createdAt?: string;
};

export default function VendorQuotationsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rfqId, setRfqId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/quotations?scope=vendor")
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqId.trim()) return;
    const qty = Number(quantity) || 1;
    const price = Number(unitPrice) || 0;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: rfqId.trim(),
          currency,
          notes,
          lines: [{ quantity: qty, unitPrice: price, total: qty * price }],
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setRfqId("");
      setUnitPrice("");
      setNotes("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Quotations")}</h1>
        <p className="text-[var(--muted)]">Submit pricing for invited RFQs and track submitted quotes.</p>
      </div>

      <form onSubmit={submit} className="surface-card p-6 mb-8 space-y-4">
        <p className="label-caps">Submit quotation</p>
        <input className="input-field" placeholder="RFQ ID" value={rfqId} onChange={(e) => setRfqId(e.target.value)} required />
        <div className="grid md:grid-cols-3 gap-4">
          <input className="input-field" type="number" min="1" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <input className="input-field" type="number" min="0" step="0.01" placeholder="Unit price" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          <input className="input-field" placeholder="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <textarea className="input-field min-h-[80px]" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit quotation"}
        </button>
      </form>

      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="label-caps mb-2">Quotes</p>
            <p className="text-[var(--ink)] font-medium">No quotations submitted</p>
            <p className="text-sm mt-2">Use an RFQ ID from your invitations to submit your first quote.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">RFQ</th>
                <th className="p-4 label-caps">Total</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <tr key={q._id} className="table-row">
                  <td className="p-4 font-mono text-xs">{String(q.rfqId)}</td>
                  <td className="p-4">
                    {q.total != null ? `${q.total} ${q.currency || "SAR"}` : "—"}
                  </td>
                  <td className="p-4 capitalize text-[var(--ink-soft)]">{q.status || "submitted"}</td>
                  <td className="p-4 text-[var(--muted)]">
                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString(locale) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
