"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";

export default function AdminHealthPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [checks, setChecks] = useState<Record<string, string>>({});
  const [timestamp, setTimestamp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setChecks(j.data?.checks || {});
        setTimestamp(j.data?.timestamp || "");
      })
      .catch((e) => setError(e.message));
  }, []);

  const metrics = Object.entries(checks).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "System health")}</h1>
        <p className="text-[var(--muted)]">Live dependency checks for API, database, and integrations.</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {metrics.length > 0 && <MetricGrid items={metrics} />}
      {timestamp && (
        <p className="text-sm text-[var(--muted)] mt-4">Last checked: {new Date(timestamp).toLocaleString(locale)}</p>
      )}
      {metrics.length === 0 && !error && (
        <div className="surface-card empty-state">Loading health checks…</div>
      )}
    </DashboardShell>
  );
}
