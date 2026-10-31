"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

type Flags = Record<string, boolean | string>;

const DEFAULTS: Flags = {
  hukum_agent: true,
  whatsapp_sync: true,
  demand_insights: true,
  compare_tray: true,
  demo_data: false,
  zatca_invoicing: false,
  contact_gate: true,
};

export default function AdminFeatureFlagsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [flags, setFlags] = useState<Flags>(DEFAULTS);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin?resource=feature_flags")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.flags) setFlags({ ...DEFAULTS, ...j.data.flags });
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("kt_feature_flags");
          if (raw) setFlags({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch {
          /* ignore */
        }
      });
  }, []);

  async function save() {
    setError("");
    setMsg("");
    try {
      localStorage.setItem("kt_feature_flags", JSON.stringify(flags));
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_feature_flags", flags }),
      });
      const json = await res.json();
      if (!json.success && res.status !== 404) {
        // local save still counts if API not wired
        if (json.message) setError(json.message);
      }
      setMsg(isAr ? "تم حفظ الأعلام ووضع البيانات التجريبية." : "Flags & demo-data switch saved.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "أعلام الميزات وCMS والبيانات التجريبية" : "Feature flags, CMS & demo-data"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "تشغيل/إيقاف قدرات Hukum ومفتاح البيانات التجريبية."
            : "Toggle Hukum capabilities and demo-data switch."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {msg ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{msg}</p> : null}

      <div className="surface-card max-w-lg space-y-3 p-5">
        {Object.keys(flags).map((key) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-mono text-xs">{key}</span>
            {typeof flags[key] === "boolean" ? (
              <input
                type="checkbox"
                checked={Boolean(flags[key])}
                onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
              />
            ) : (
              <input
                className="input-field max-w-[180px]"
                value={String(flags[key])}
                onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.value }))}
              />
            )}
          </label>
        ))}
        <button type="button" className="btn-primary" onClick={() => void save()}>
          {isAr ? "حفظ" : "Save"}
        </button>
        <p className="mb-0 text-xs text-[var(--muted)]">
          CMS:{" "}
          <a href={`/${locale}/admin/content`} className="text-[var(--accent)]">
            /admin/content
          </a>
        </p>
      </div>
    </DashboardShell>
  );
}
