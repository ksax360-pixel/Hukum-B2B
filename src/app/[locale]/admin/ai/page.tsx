"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";

type AiConfig = { configured?: boolean; model?: string; threshold?: number };
type Extraction = { _id: string; type?: string; status?: string; createdAt?: string };
type Prompt = { _id: string; key?: string; name?: string; active?: boolean; version?: number };

export default function AdminAiPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/ai").then((r) => r.json()),
      fetch("/api/ai?resource=extractions").then((r) => r.json()),
      fetch("/api/ai?resource=prompts").then((r) => r.json()),
    ])
      .then(([cfg, ext, prm]) => {
        if (!cfg.success) throw new Error(cfg.message);
        setConfig(cfg.data);
        if (ext.success) setExtractions(Array.isArray(ext.data) ? ext.data : []);
        if (prm.success) setPrompts(Array.isArray(prm.data) ? prm.data : []);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "AI Center")}</h1>
        <p className="text-[var(--muted)]">Provider status, extractions, and prompt templates.</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      <MetricGrid
        items={[
          { label: "Provider", value: config?.configured ? "Configured" : "Not configured" },
          { label: "Model", value: config?.model || "—" },
          { label: "Confidence threshold", value: config?.threshold ?? "—" },
          { label: "Recent extractions", value: extractions.length },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="surface-card overflow-hidden">
          <p className="label-caps p-4 border-b border-[var(--border)]">Extractions</p>
          {extractions.length === 0 ? (
            <div className="empty-state py-12">No extraction jobs yet</div>
          ) : (
            <ul className="text-sm divide-y divide-[var(--border)]">
              {extractions.slice(0, 20).map((x) => (
                <li key={x._id} className="p-4 flex justify-between gap-4">
                  <span className="capitalize">{x.type || "product"}</span>
                  <span className="text-[var(--muted)] capitalize">{x.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="surface-card overflow-hidden">
          <p className="label-caps p-4 border-b border-[var(--border)]">Prompt templates</p>
          {prompts.length === 0 ? (
            <div className="empty-state py-12">No prompts saved</div>
          ) : (
            <ul className="text-sm divide-y divide-[var(--border)]">
              {prompts.map((p) => (
                <li key={p._id} className="p-4 flex justify-between gap-4">
                  <span className="font-medium">{p.key || p.name}</span>
                  <span className="text-[var(--muted)]">v{p.version ?? 1}{p.active === false ? " · inactive" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
