"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

type Finding = {
  id: string;
  severity: string;
  loophole: string;
  impact: string;
  fix: string;
  status: string;
  controls: string[];
};

export default function AdminRiskPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [counts, setCounts] = useState<Record<string, unknown> | null>(null);
  const [controls, setControls] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/risk", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setFindings(j.data?.findings || []);
        setSummary(j.data?.summary || {});
        setCounts(j.data?.liveCounts || null);
        setControls(j.data?.controls || null);
      })
      .catch((e) => setError(e.message));
  }, []);

  const sevColor: Record<string, string> = {
    critical: "text-[var(--accent)]",
    high: "text-amber-700",
    medium: "text-[var(--muted)]",
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "سجل المخاطر: الثغرات والإصلاحات" : "Risk register: loopholes & fixes"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "نتائج تدقيق النظام مرتبة حسب الأثر."
            : "Findings from the system audit, ranked by impact."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(summary).map(([k, v]) => (
          <div key={k} className="surface-card p-3">
            <p className="m-0 text-[0.65rem] uppercase text-[var(--muted)]">{k}</p>
            <p className="mt-1 mb-0 text-xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {counts ? (
        <div className="mb-6 surface-card p-4 text-sm">
          <p className="m-0 text-xs font-semibold uppercase text-[var(--muted)]">
            {isAr ? "عدادات حية فقط" : "Live counts only"}
          </p>
          <p className="mt-2 mb-0 text-[var(--ink)]">
            Products {String(counts.products)} · Verified vendors {String(counts.vendorsVerified)} /{" "}
            {String(counts.vendorsTotal)} · Open RFQs {String(counts.rfqsOpen)} · Buyers{" "}
            {String(counts.buyers)}
          </p>
          <p className="mt-1 mb-0 text-xs text-[var(--muted)]">{String(counts.note || "")}</p>
        </div>
      ) : null}

      {controls ? (
        <div className="mb-6 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-card p-3">Reveal cap / day: {String(controls.dailyRevealCap)}</div>
          <div className="surface-card p-3">WA reveal cap: {String(controls.dailyWaRevealCap)}</div>
          <div className="surface-card p-3">WA spend today: ${String(controls.waSpendUsdToday)}</div>
          <div className="surface-card p-3">Data region: {String(controls.dataRegion)}</div>
        </div>
      ) : null}

      <div className="overflow-hidden surface-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="p-3">{isAr ? "الخطورة" : "Severity"}</th>
              <th className="p-3">{isAr ? "الثغرة" : "Loophole"}</th>
              <th className="p-3">{isAr ? "الأثر" : "Impact"}</th>
              <th className="p-3">{isAr ? "الإصلاح" : "Fix"}</th>
              <th className="p-3">{isAr ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => (
              <tr key={f.id} className="table-row align-top">
                <td className={`p-3 text-xs font-semibold uppercase ${sevColor[f.severity] || ""}`}>
                  {f.id} · {f.severity}
                </td>
                <td className="p-3">{f.loophole}</td>
                <td className="p-3 text-[var(--muted)]">{f.impact}</td>
                <td className="p-3">
                  {f.fix}
                  <p className="mt-1 mb-0 text-[10px] text-[var(--muted)]">{f.controls.join(" · ")}</p>
                </td>
                <td className="p-3 capitalize text-xs">{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
