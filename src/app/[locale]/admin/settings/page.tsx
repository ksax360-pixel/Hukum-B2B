"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";

type Setting = { _id?: string; key?: string; value?: unknown };

const DEFAULT_KEYS = [
  { key: "platform.name", value: "Hukum" },
  { key: "platform.defaultLocale", value: "ar" },
  { key: "platform.currency", value: "SAR" },
  { key: "seo.siteName", value: "Hukum" },
  { key: "notifications.emailEnabled", value: true },
];

export default function AdminSettingsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/platform?resource=settings")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        const rows = Array.isArray(j.data) ? (j.data as Setting[]) : [];
        setSettings(rows);
        const next: Record<string, string> = {};
        for (const s of rows) {
          if (s.key) next[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
        }
        setDrafts(next);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key: string, raw: string) => {
    setBusyKey(key);
    setError("");
    setMessage("");
    let value: unknown = raw;
    try {
      value = JSON.parse(raw);
    } catch {
      value = raw;
    }
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setting", key, value }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage(`Saved ${key}`);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  };

  const seedDefaults = async () => {
    setError("");
    for (const item of DEFAULT_KEYS) {
      await save(item.key, typeof item.value === "string" ? item.value : JSON.stringify(item.value));
    }
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{dashT(locale, "Settings")}</h1>
          <p className="text-[var(--muted)]">Platform configuration keys stored in the system settings collection.</p>
        </div>
        {settings.length === 0 && !loading ? (
          <button type="button" className="btn-primary" onClick={() => void seedDefaults()}>
            Seed defaults
          </button>
        ) : null}
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-4">{message}</p>}

      <div className="surface-card p-4 mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input-field" placeholder="new.setting.key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        <input className="input-field" placeholder='Value (JSON or text)' value={newValue} onChange={(e) => setNewValue(e.target.value)} />
        <button
          type="button"
          className="btn-primary"
          disabled={!newKey.trim() || busyKey === newKey}
          onClick={() => {
            void save(newKey.trim(), newValue).then(() => {
              setNewKey("");
              setNewValue("");
            });
          }}
        >
          Add / upsert
        </button>
      </div>

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : settings.length === 0 ? (
          <div className="empty-state">
            <p className="text-[var(--ink)] font-medium">No settings configured</p>
            <p className="text-sm mt-2">Seed defaults or add a key above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Key</th>
                <th className="p-4 label-caps">Value</th>
                <th className="p-4 label-caps" />
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.key || s._id} className="table-row">
                  <td className="p-4 font-mono text-xs align-top">{s.key}</td>
                  <td className="p-4">
                    <textarea
                      className="input-field min-h-16 font-mono text-xs"
                      value={drafts[s.key || ""] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [s.key || ""]: e.target.value }))}
                    />
                  </td>
                  <td className="p-4 align-top">
                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-3"
                      disabled={!s.key || busyKey === s.key}
                      onClick={() => s.key && void save(s.key, drafts[s.key] ?? "")}
                    >
                      {busyKey === s.key ? "Saving…" : "Save"}
                    </button>
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
