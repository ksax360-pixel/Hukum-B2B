"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

type Enquiry = {
  _id: string;
  reference?: string;
  enquiryType?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  locale?: string;
  source?: string;
  extras?: {
    requestType?: string;
    productId?: string;
    productName?: string;
    productSku?: string;
    vendorId?: string;
    vendorName?: string;
    quantity?: string;
    phoneVerified?: boolean;
  };
};

const STATUSES = ["new", "reviewing", "replied", "closed", "spam"];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 mb-0 text-sm font-medium text-[var(--ink)]">{children ?? "—"}</p>
    </div>
  );
}

export default function AdminInquiriesPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<Enquiry[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState<Enquiry | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({ limit: "100" });
    if (filter !== "all") sp.set("status", filter);
    fetch(`/api/contact?${sp}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage(`Status → ${status}`);
      load();
      setOpen((prev) => (prev && prev._id === id ? { ...prev, status } : prev));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">Inquiries</h1>
        <p className="text-[var(--muted)]">
          Contact forms and product interest (heart + OTP) — visible to admin and matched sellers.
        </p>
      </div>
      <div className="mb-4">
        <select
          className="input-field max-w-[12rem]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mb-4 text-sm text-[var(--accent)]">{error}</p>}
      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="skeleton m-4 h-24" />
        ) : items.length === 0 ? (
          <div className="empty-state">No inquiries yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Reference</th>
                <th className="p-4 label-caps">From</th>
                <th className="p-4 label-caps">Subject / product</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isInterest = row.extras?.requestType === "product_interest";
                return (
                  <tr key={row._id} className="table-row">
                    <td className="p-4 font-mono text-xs">{row.reference}</td>
                    <td className="p-4">
                      <p className="font-medium">{row.fullName}</p>
                      <p className="text-xs text-[var(--muted)]">{row.companyName}</p>
                      <p className="text-xs text-[var(--muted)]" dir="ltr">
                        {row.phone || row.email}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="m-0">{row.extras?.productName || row.subject}</p>
                        {isInterest ? (
                          <span className="rounded-full bg-[#e8f6ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1f7a45]">
                            Interested
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs capitalize text-[var(--muted)]">
                        {row.extras?.vendorName || row.enquiryType || row.source || "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <select
                        className="input-field py-1 text-xs"
                        disabled={busyId === row._id}
                        value={row.status || "new"}
                        onChange={(e) => void setStatus(row._id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        className="btn-ghost px-3 py-2 text-xs"
                        onClick={() => setOpen(row)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#071D27]/40 p-4">
          <div className="surface-card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[0.7rem] uppercase tracking-wide text-[var(--accent)]">
                  {open.extras?.requestType === "product_interest" ? "Product interest" : "Inquiry"}
                </p>
                <h2 className="mt-1 mb-0 text-lg font-semibold">
                  {open.extras?.productName || open.subject}
                </h2>
              </div>
              <button type="button" className="btn-ghost px-3 py-2 text-xs" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Reference">{open.reference}</Field>
              <Field label="Status">{open.status || "new"}</Field>
              <Field label="Buyer">{open.fullName}</Field>
              <Field label="Company">{open.companyName}</Field>
              <Field label="Phone">{open.phone || "—"}</Field>
              <Field label="Email">{open.email || "—"}</Field>
              {open.extras?.vendorName ? (
                <Field label="Seller">{open.extras.vendorName}</Field>
              ) : null}
              {open.extras?.productSku ? (
                <Field label="SKU">{open.extras.productSku}</Field>
              ) : null}
              {open.extras?.quantity ? (
                <Field label="Quantity">{open.extras.quantity}</Field>
              ) : null}
              {open.extras?.phoneVerified ? (
                <Field label="Phone OTP">Verified</Field>
              ) : null}
              <Field label="Created">
                {open.createdAt ? new Date(open.createdAt).toLocaleString(locale) : "—"}
              </Field>
            </div>
            <div>
              <p className="mb-1 text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">Message</p>
              <p className="m-0 whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
                {open.message || "—"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
