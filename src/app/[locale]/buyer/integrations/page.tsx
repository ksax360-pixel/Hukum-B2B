"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type Connector = { id: string; label: string; status: string; punchout: boolean };
type Tender = { id: string; title: string; agency: string; closesAt: string; category: string; url: string };

export default function BuyerIntegrationsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/procurement/integrations?resource=connectors").then((r) => r.json()),
      fetch("/api/procurement/integrations?resource=etimad").then((r) => r.json()),
    ])
      .then(([c, e]) => {
        if (c.success) setConnectors(c.data?.connectors || []);
        if (e.success) setTenders(e.data?.feed || []);
        if (!c.success) setError(c.message);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function punchout(system: string) {
    setBusy(system);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/procurement/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "punchout_handshake", system, payload: { items: [] } }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMsg(
        isAr
          ? `جلسة punchout تجريبية: ${j.data.sessionId}`
          : `Punchout stub session: ${j.data.sessionId}`
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "تكاملات ERP واعتماد" : "ERP connections & Etimad"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "SAP وOracle وOdoo punchout، وتغذية المناقصات العامة المسموحة (هيكل)."
            : "SAP, Oracle, Odoo punchout stubs and permitted public tender feed scaffold."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {msg ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{msg}</p> : null}

      <h2 className="mb-3 text-lg font-semibold">{isAr ? "اتصال ERP" : "ERP punchout"}</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {connectors.map((c) => (
          <div key={c.id} className="surface-card space-y-3 p-4">
            <p className="m-0 font-semibold">{c.label}</p>
            <p className="m-0 text-xs uppercase text-[var(--muted)]">{c.status}</p>
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={busy === c.id}
              onClick={() => void punchout(c.id)}
            >
              {busy === c.id ? "…" : isAr ? "تجربة handshake" : "Test handshake"}
            </button>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">
        {isAr ? "تغذية اعتماد (مسموح / تجريبي)" : "Etimad feed (permitted / demo)"}
      </h2>
      <div className="space-y-2">
        {tenders.map((t) => (
          <a
            key={t.id}
            href={t.url}
            target="_blank"
            rel="noreferrer"
            className="surface-card block p-4 no-underline"
          >
            <p className="m-0 font-medium text-[var(--ink)]">{t.title}</p>
            <p className="m-0 mt-1 text-xs text-[var(--muted)]">
              {t.agency} · {t.category} · {isAr ? "يغلق" : "closes"}{" "}
              {new Date(t.closesAt).toLocaleDateString(locale)}
            </p>
          </a>
        ))}
      </div>
    </DashboardShell>
  );
}
