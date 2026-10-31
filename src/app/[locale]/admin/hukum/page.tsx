"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

type SessionRow = {
  _id: string;
  channel?: string;
  step?: string;
  locale?: string;
  escalated?: boolean;
  history?: Array<{ role: string; content: string }>;
  updatedAt?: string;
};

export default function AdminHukumOversightPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [logs, setLogs] = useState<unknown[]>([]);
  const [active, setActive] = useState<SessionRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin?resource=hukum_sessions").then((r) => r.json()),
      fetch("/api/ai?resource=gateway_logs").then((r) => r.json()),
    ])
      .then(([hs, gl]) => {
        if (hs.success) setSessions(Array.isArray(hs.data) ? hs.data : hs.data?.sessions || []);
        else if (hs.message) setError(hs.message);
        if (gl.success) setLogs(Array.isArray(gl.data?.logs) ? gl.data.logs : []);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "إشراف وكيل Hukum والنصوص" : "AI agent oversight & transcripts"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "جلسات الوكيل والنصوص وسجلات البوابة — للمراجعة البشرية."
            : "Hukum sessions, transcripts, and gateway logs for human review."}
        </p>
      </div>
      {error ? (
        <p className="mb-3 text-sm text-[var(--accent)]">
          {error}{" "}
          <span className="text-[var(--muted)]">
            {isAr ? "(قد تحتاج صلاحية admin)" : "(may need admin permission)"}
          </span>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            {isAr ? "الجلسات" : "Sessions"} ({sessions.length})
          </h2>
          <ul className="m-0 max-h-[420px] list-none overflow-y-auto p-0">
            {sessions.length === 0 ? (
              <li className="p-4 text-sm text-[var(--muted)]">{isAr ? "لا جلسات بعد." : "No sessions yet."}</li>
            ) : (
              sessions.map((s) => (
                <li key={String(s._id)}>
                  <button
                    type="button"
                    className="w-full border-b border-[var(--border)] px-4 py-3 text-start text-sm"
                    onClick={() => setActive(s)}
                  >
                    <span className="font-medium">{s.channel || "web"}</span> · {s.step || "—"}
                    {s.escalated ? " · escalated" : ""}
                    <span className="mt-1 block text-[11px] text-[var(--muted)]">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleString(locale) : ""}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="surface-card p-4">
          <h2 className="mt-0 text-sm font-semibold">{isAr ? "النص" : "Transcript"}</h2>
          {!active ? (
            <p className="text-sm text-[var(--muted)]">{isAr ? "اختر جلسة." : "Select a session."}</p>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {(active.history || []).map((h, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <p className="m-0 text-[10px] uppercase text-[var(--muted)]">{h.role}</p>
                  <p className="m-0 mt-1 whitespace-pre-wrap">{h.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="surface-card mt-5 overflow-hidden">
        <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
          {isAr ? "سجلات بوابة الذكاء" : "AI gateway logs"} ({Array.isArray(logs) ? logs.length : 0})
        </h2>
        <pre className="m-0 max-h-48 overflow-auto p-4 text-[11px]">{JSON.stringify(logs.slice(0, 10), null, 2)}</pre>
      </section>
    </DashboardShell>
  );
}
