"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";
import { t } from "@/lib/utils";

const STATUSES = ["draft", "open", "matching", "quoted", "negotiation", "awarded", "closed", "cancelled"];

type RfqRow = {
  _id: string;
  title?: { en?: string; ar?: string };
  status?: string;
  currency?: string;
  createdAt?: string;
};

export default function AdminRfqsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<RfqRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/rfqs")
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

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_status", rfqId: id, status }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage(`RFQ status → ${status}`);
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
        <h1 className="text-3xl font-semibold">{dashT(locale, "RFQs")}</h1>
        <p className="text-[var(--muted)]">All buyer requests across the marketplace.</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-4">{message}</p>}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : items.length === 0 ? (
          <div className="empty-state">No RFQs recorded</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Title</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps">Created</th>
                <th className="p-4 label-caps">Update</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} className="table-row">
                  <td className="p-4 font-medium">{t(locale, r.title) || "RFQ"}</td>
                  <td className="p-4 capitalize text-[var(--ink-soft)]">{r.status || "open"}</td>
                  <td className="p-4 text-[var(--muted)]">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString(locale) : "—"}
                  </td>
                  <td className="p-4">
                    <select
                      className="input-field text-xs py-1"
                      disabled={busyId === r._id}
                      value={r.status || "open"}
                      onChange={(e) => setStatus(r._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
