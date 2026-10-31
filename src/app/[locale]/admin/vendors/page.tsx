"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";
import { vendorLogoUrl } from "@/components/products/product-helpers";
import { t } from "@/lib/utils";

type VendorRow = {
  _id: string;
  legalName?: { en?: string; ar?: string };
  tradeName?: string;
  slug?: { en?: string };
  logo?: string;
  verificationStatus?: string;
  status?: string;
  email?: string;
  location?: { city?: string };
};

export default function AdminVendorsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ admin: "1", limit: "100" });
    if (q.trim()) params.set("q", q.trim());
    if (filter !== "all") params.set("verificationStatus", filter);
    fetch(`/api/vendors?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(j.data?.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setVerification = async (id: string, status: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", id, status }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage(`Vendor ${status}`);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Vendors")}</h1>
        <p className="text-[var(--muted)]">Verification queue and vendor directory oversight.</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input-field max-w-xs"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input-field max-w-[12rem]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
          <option value="unverified">Unverified</option>
        </select>
        <button type="button" className="btn-ghost" onClick={() => { setQ(""); setFilter("all"); }}>
          Reset
        </button>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-4">{message}</p>}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="text-[var(--ink)] font-medium">No vendors found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Company</th>
                <th className="p-4 label-caps">City</th>
                <th className="p-4 label-caps">Email</th>
                <th className="p-4 label-caps">Verification</th>
                <th className="p-4 label-caps" />
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v._id} className="table-row">
                  <td className="p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={vendorLogoUrl(v)} alt="" className="h-10 w-10 rounded-md object-contain" />
                      <span className="font-medium truncate">{t(locale, v.legalName) || v.tradeName || "—"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[var(--ink-soft)]">{v.location?.city || "—"}</td>
                  <td className="p-4 text-[var(--ink-soft)]">{v.email || "—"}</td>
                  <td className="p-4 capitalize">{v.verificationStatus || "unverified"}</td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {v.slug?.en ? (
                      <Link href={`/${locale}/vendors/${v.slug.en}`} className="btn-ghost text-xs py-2 px-3 inline-block">
                        View
                      </Link>
                    ) : null}
                    {v.verificationStatus !== "verified" && (
                      <button
                        type="button"
                        className="btn-primary text-xs py-2 px-3"
                        disabled={busyId === v._id}
                        onClick={() => setVerification(v._id, "verified")}
                      >
                        {busyId === v._id ? "…" : "Verify"}
                      </button>
                    )}
                    {v.verificationStatus !== "rejected" && (
                      <button
                        type="button"
                        className="btn-ghost text-xs py-2 px-3"
                        disabled={busyId === v._id}
                        onClick={() => setVerification(v._id, "rejected")}
                      >
                        Reject
                      </button>
                    )}
                    {v.verificationStatus !== "suspended" && (
                      <button
                        type="button"
                        className="btn-ghost text-xs py-2 px-3"
                        disabled={busyId === v._id}
                        onClick={() => setVerification(v._id, "suspended")}
                      >
                        Suspend
                      </button>
                    )}
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
