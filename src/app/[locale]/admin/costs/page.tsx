"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default function AdminCostsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [data, setData] = useState<{
    status?: { configured?: boolean; caps?: unknown; model?: string };
    logs?: Array<{ feature?: string; costUsd?: number; status?: string; createdAt?: string }>;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ai?resource=gateway_logs")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setData(j.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  const logs = data?.logs || [];
  const total = logs.reduce((s, l) => s + (Number(l.costUsd) || 0), 0);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "مراقبة تكلفة الذكاء وواتساب" : "AI & WhatsApp cost monitor"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "سجلات البوابة وحدود التكلفة اليومية لكل ميزة ومستخدم."
            : "Gateway ledger and per-feature / per-user daily cost caps."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">Model</p>
          <p className="mt-1 mb-0 font-semibold">{data?.status?.model || "—"}</p>
        </div>
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">Configured</p>
          <p className="mt-1 mb-0 font-semibold">{data?.status?.configured ? "yes" : "fallback mode"}</p>
        </div>
        <div className="surface-card p-4">
          <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">Logged cost (sample)</p>
          <p className="mt-1 mb-0 font-semibold">USD {total.toFixed(4)}</p>
        </div>
      </div>

      <pre className="surface-card overflow-auto p-4 text-xs">
        {JSON.stringify({ caps: data?.status?.caps, recent: logs.slice(0, 20) }, null, 2)}
      </pre>
      <p className="mt-3 text-xs text-[var(--muted)]">
        WhatsApp Cloud costs appear when META_WA_* is configured; until then sends are stub-logged.
      </p>
    </DashboardShell>
  );
}
