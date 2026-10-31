"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";

type AuditRow = {
  _id: string;
  action?: string;
  entity?: string;
  entityId?: string;
  createdAt?: string;
};

export default function AdminAuditPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin?resource=audit")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setLogs(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Audit logs")}</h1>
        <p className="text-[var(--muted)]">Recent administrative and verification actions.</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : logs.length === 0 ? (
          <div className="empty-state">No audit entries yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Action</th>
                <th className="p-4 label-caps">Entity</th>
                <th className="p-4 label-caps">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row._id} className="table-row">
                  <td className="p-4 capitalize">{row.action || "—"}</td>
                  <td className="p-4">
                    {row.entity || "—"}
                    {row.entityId && <span className="text-[var(--muted)] font-mono text-xs ml-2">{row.entityId}</span>}
                  </td>
                  <td className="p-4 text-[var(--muted)]">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString(locale) : "—"}
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
