"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

type FunnelStep = {
  step: number;
  label: string;
  events: string[];
  counts: Record<string, number>;
  total: number;
};

type MatrixRow = {
  trigger: string;
  channels: string[];
  title: { en: string; ar: string };
};

export default function AdminMeasurementPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [data, setData] = useState<{
    channels?: Record<string, string>;
    buyerFunnel?: FunnelStep[];
    supplierFunnel?: FunnelStep[];
    notificationMatrix?: MatrixRow[];
  } | null>(null);
  const [error, setError] = useState("");
  const [cronMsg, setCronMsg] = useState("");

  useEffect(() => {
    fetch("/api/notifications/matrix", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setData(j.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function runAutomations() {
    setCronMsg("");
    try {
      const res = await fetch("/api/quotations?resource=process_automations&forceMonthly=1", {
        credentials: "include",
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setCronMsg(JSON.stringify(j.data, null, 2));
    } catch (e) {
      setCronMsg((e as Error).message);
    }
  }

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "القياس: المسارات والإشعارات" : "Measurement: funnels & notifications"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "أحداث مسار المشتري والمورد، ومصفوفة القنوات (بريد / واتساب / SMS / داخل التطبيق)."
            : "Buyer & supplier funnel events and the channel matrix (email / WhatsApp / SMS / in-app)."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}

      {data?.channels ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-4">
          {Object.entries(data.channels).map(([k, v]) => (
            <div key={k} className="surface-card p-4">
              <p className="m-0 text-[0.7rem] uppercase text-[var(--muted)]">{k}</p>
              <p className="mt-1 mb-0 font-semibold capitalize">{v}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">{isAr ? "مسار المشتري" : "Buyer funnel"}</h2>
          <div className="space-y-2">
            {(data?.buyerFunnel || []).map((s) => (
              <div key={s.step} className="surface-card p-3">
                <p className="m-0 text-sm font-semibold">
                  {s.step}. {s.label}{" "}
                  <span className="text-[var(--muted)]">({s.total})</span>
                </p>
                <p className="mt-1 mb-0 text-xs text-[var(--muted)]">
                  {s.events.map((e) => `${e}: ${s.counts[e] || 0}`).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">{isAr ? "مسار المورد" : "Supplier funnel"}</h2>
          <div className="space-y-2">
            {(data?.supplierFunnel || []).map((s) => (
              <div key={s.step} className="surface-card p-3">
                <p className="m-0 text-sm font-semibold">
                  {s.step}. {s.label}{" "}
                  <span className="text-[var(--muted)]">({s.total})</span>
                </p>
                <p className="mt-1 mb-0 text-xs text-[var(--muted)]">
                  {s.events.map((e) => `${e}: ${s.counts[e] || 0}`).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">{isAr ? "مصفوفة الإشعارات" : "Notification matrix"}</h2>
      <div className="mb-8 overflow-hidden surface-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="p-3">{isAr ? "المشغّل" : "Trigger"}</th>
              <th className="p-3">{isAr ? "الرسالة" : "Message"}</th>
              <th className="p-3">{isAr ? "القنوات" : "Channels"}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.notificationMatrix || []).map((r) => (
              <tr key={r.trigger} className="table-row">
                <td className="p-3 font-mono text-xs">{r.trigger}</td>
                <td className="p-3">{isAr ? r.title.ar : r.title.en}</td>
                <td className="p-3 text-xs capitalize">{r.channels.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn-primary text-sm" onClick={() => void runAutomations()}>
        {isAr ? "تشغيل التذكيرات والملخصات الآن" : "Run reminder + digest automations now"}
      </button>
      {cronMsg ? (
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-[var(--border)] p-3 text-xs">
          {cronMsg}
        </pre>
      ) : null}
    </DashboardShell>
  );
}
