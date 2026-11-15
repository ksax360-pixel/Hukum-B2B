"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";

type AggRow = { _id: string; count: number };

export default function AdminAnalyticsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [byType, setByType] = useState<AggRow[]>([]);
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin?resource=analytics").then((r) => r.json()),
      fetch("/api/admin?resource=kpis").then((r) => r.json()),
    ]).then(([an, kp]) => {
      if (!an.success) throw new Error(an.message);
      setByType(an.data?.byType || []);
      if (kp.success) setKpis(kp.data);
    }).catch((e) => setError(e.message));
  }, []);

  const metrics = kpis
    ? [
        { label: "Product views", value: kpis.productViews ?? 0 },
        { label: "Vendor views", value: kpis.vendorViews ?? 0 },
        { label: "Searches", value: kpis.searches ?? 0 },
        { label: "AI volume", value: kpis.aiProcessingVolume ?? 0 },
      ]
    : [{ label: "Loading", value: "…" }];

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Analytics")}</h1>
        <p className="text-[var(--muted)]">Marketplace activity aggregated by event type.</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      <MetricGrid items={metrics} />
      <div className="surface-card overflow-hidden">
        {byType.length === 0 ? (
          <div className="empty-state">No analytics events recorded yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Event type</th>
                <th className="p-4 label-caps">Count</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((row) => (
                <tr key={row._id} className="table-row">
                  <td className="p-4 font-medium">{row._id}</td>
                  <td className="p-4">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
