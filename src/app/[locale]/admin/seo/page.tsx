"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";

type Dash = {
  totalPublicPages?: number;
  indexable?: number;
  noindex?: number;
  missingTitle?: number;
  missingDesc?: number;
  missingCanonical?: number;
  duplicateTitles?: number;
  redirects?: number;
  arabicMissing?: number;
  products?: number;
  vendors?: number;
  categories?: number;
  productSeoReady?: number;
  vendorSeoReady?: number;
  categorySeoReady?: number;
  marketplaceEntities?: number;
  marketplaceIndexable?: number;
  avgSeoScore?: number;
  avgAeoScore?: number;
  avgGeoScore?: number;
  avgDiscoveryScore?: number;
  avgSeoAr?: number;
  avgSeoEn?: number;
  staleEntities?: number;
  emergingEntities?: number;
};

type EntityRow = {
  id: string;
  type: string;
  name: string;
  nameAr?: string;
  slug?: string;
  status?: string;
  score?: number;
  aeoScore?: number;
  geoScore?: number;
  discoveryScore?: number;
  seoScoreAr?: number;
  seoScoreEn?: number;
  aeoScoreAr?: number;
  aeoScoreEn?: number;
  products?: number;
  vendors?: number;
  indexable?: boolean;
  kind?: string;
  seo?: { title?: { en?: string }; description?: { en?: string }; indexable?: boolean };
};

const TABS = [
  "dashboard",
  "entities",
  "products",
  "categories",
  "vendors",
  "issues",
  "duplicates",
  "redirects",
  "robots",
] as const;

export default function AdminSeoPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [tab, setTab] = useState<(typeof TABS)[number]>("dashboard");
  const [dash, setDash] = useState<Dash | null>(null);
  const [rows, setRows] = useState<EntityRow[]>([]);
  const [issues, setIssues] = useState<{ severity: string; entity: string; name: string; problem: string }[]>([]);
  const [dups, setDups] = useState<{ title: string; pages: { name: string }[]; action: string }[]>([]);
  const [redirects, setRedirects] = useState<{ _id: string; fromPath: string; toPath: string; type: number }[]>([]);
  const [robots, setRobots] = useState("");
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const loadDash = () =>
    fetch("/api/seo?resource=dashboard")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setDash(j.data);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    loadDash();
  }, []);

  const loadEntities = (activeTab: typeof tab) => {
    if (activeTab === "products" || activeTab === "vendors" || activeTab === "categories" || activeTab === "entities") {
      const type = activeTab === "categories" ? "category" : activeTab === "entities" ? "marketplace" : activeTab.slice(0, -1);
      return fetch(`/api/seo?resource=entities&type=${type}`)
        .then((r) => r.json())
        .then((j) => setRows(j.success ? j.data : []));
    }
    return Promise.resolve();
  };

  useEffect(() => {
    setError("");
    void loadEntities(tab);
    if (tab === "issues") {
      fetch("/api/seo?resource=issues")
        .then((r) => r.json())
        .then((j) => setIssues(j.success ? j.data.issues : []));
    }
    if (tab === "duplicates") {
      fetch("/api/seo?resource=duplicates")
        .then((r) => r.json())
        .then((j) => setDups(j.success ? j.data : []));
    }
    if (tab === "redirects") {
      fetch("/api/seo?resource=redirects")
        .then((r) => r.json())
        .then((j) => setRedirects(j.success ? j.data : []));
    }
    if (tab === "robots") {
      fetch("/api/seo?resource=settings")
        .then((r) => r.json())
        .then((j) => setRobots(j.success ? j.data?.robotsTxt || "" : ""));
    }
  }, [tab]);

  async function generate(entityType: string, id: string) {
    setBusy(id);
    setMessage("");
    const res = await fetch("/api/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", entityType, id }),
    });
    const j = await res.json();
    setBusy(null);
    if (!j.success) setError(j.message);
    else {
      setMessage("Metadata generated and saved to the entity.");
      setTab(tab);
      fetch(`/api/seo?resource=entities&type=${entityType}`)
        .then((r) => r.json())
        .then((x) => setRows(x.success ? x.data : []));
      loadDash();
    }
  }

  async function saveRedirect(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redirect", fromPath, toPath, type: 301 }),
    });
    const j = await res.json();
    if (!j.success) setError(j.message);
    else {
      setFromPath("");
      setToPath("");
      setRedirects((r) => [j.data, ...r]);
    }
  }

  async function saveRobots() {
    const res = await fetch("/api/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "settings", updates: { robotsTxt: robots } }),
    });
    const j = await res.json();
    setMessage(j.success ? "robots.txt saved. Public /robots.txt will use it unless it blocks the whole site." : j.message);
  }

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-semibold">{dashT(locale, "SEO management")}</h1>
        <p className="text-[var(--muted)]">
          Metadata, indexability, redirects and robots — connected to live public pages. Scores are internal quality
          indicators, not ranking predictions.
        </p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-emerald-700 mb-4">{message}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t} type="button" className={`dash-chip capitalize ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard" && dash && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ["Public entities", dash.totalPublicPages],
            ["Indexable", dash.indexable],
            ["Noindex", dash.noindex],
            ["Missing titles", dash.missingTitle],
            ["Missing descriptions", dash.missingDesc],
            ["Missing canonicals", dash.missingCanonical],
            ["Duplicate titles", dash.duplicateTitles],
            ["Arabic gaps", dash.arabicMissing],
            ["Product SEO ready", `${dash.productSeoReady}/${dash.products}`],
            ["Vendor SEO ready", `${dash.vendorSeoReady}/${dash.vendors}`],
            ["Category SEO ready", `${dash.categorySeoReady}/${dash.categories}`],
            ["Marketplace entities", dash.marketplaceEntities],
            ["Indexable entities", dash.marketplaceIndexable],
            ["Avg SEO score", dash.avgSeoScore],
            ["Avg AEO score", dash.avgAeoScore],
            ["Avg GEO score", dash.avgGeoScore],
            ["Discovery readiness", dash.avgDiscoveryScore],
            ["Arabic SEO avg", dash.avgSeoAr],
            ["English SEO avg", dash.avgSeoEn],
            ["Emerging entities", dash.emergingEntities],
            ["Unavailable entities", dash.staleEntities],
          ].map(([label, value]) => (
            <div key={String(label)} className="dash-metric">
              <p className="label-caps mb-2">{label}</p>
              <p className="text-2xl font-semibold">{value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "dashboard" && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="dash-chip active"
            disabled={busy === "migrate"}
            onClick={async () => {
              setBusy("migrate");
              setMessage("");
              const res = await fetch("/api/seo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "migrate-entities", limit: 2000 }),
              });
              const j = await res.json();
              setBusy(null);
              if (!j.success) setError(j.message);
              else {
                setMessage(
                  `Migrated ${j.data?.processed || 0} products into ${j.data?.entities || 0} marketplace entities (${j.data?.failed || 0} failed).`
                );
                loadDash();
              }
            }}
          >
            {busy === "migrate" ? "Migrating…" : "Seed catalog + migrate products"}
          </button>
        </div>
      )}

      {tab === "entities" && (
        <div className="surface-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-3">Entity</th>
                <th className="p-3">Kind</th>
                <th className="p-3">Lifecycle</th>
                <th className="p-3">Supply</th>
                <th className="p-3">AR SEO/AEO</th>
                <th className="p-3">EN SEO/AEO</th>
                <th className="p-3">GEO / Disc.</th>
                <th className="p-3">Index</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="p-3">
                    <p className="font-medium">{r.nameAr || r.name || "—"}</p>
                    <p className="text-xs text-[var(--muted)]">{r.name}</p>
                    <a className="text-xs text-[var(--muted)]" href={`/${locale}/c/${r.slug}`} target="_blank" rel="noreferrer">
                      /c/{r.slug}
                    </a>
                  </td>
                  <td className="p-3 capitalize">{r.kind || "—"}</td>
                  <td className="p-3">{r.status || "—"}</td>
                  <td className="p-3">
                    {r.products ?? 0} products · {r.vendors ?? 0} vendors
                  </td>
                  <td className="p-3">
                    {r.seoScoreAr ?? "—"} / {r.aeoScoreAr ?? "—"}
                  </td>
                  <td className="p-3">
                    {r.seoScoreEn ?? "—"} / {r.aeoScoreEn ?? "—"}
                  </td>
                  <td className="p-3">
                    {r.geoScore ?? "—"} / {r.discoveryScore ?? "—"}
                  </td>
                  <td className="p-3">{r.indexable ? "index" : "noindex"}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="dash-chip"
                      disabled={busy === r.id}
                      onClick={async () => {
                        setBusy(r.id);
                        setError("");
                        const res = await fetch("/api/seo", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "recompute-entity", id: r.id }),
                        });
                        const j = await res.json();
                        setBusy(null);
                        if (!j.success) setError(j.message);
                        else {
                          setMessage("Entity stats recomputed.");
                          await loadEntities("entities");
                          loadDash();
                        }
                      }}
                    >
                      {busy === r.id ? "…" : "Recompute"}
                    </button>
                    <button
                      type="button"
                      className="dash-chip"
                      disabled={busy === `idx-${r.id}`}
                      onClick={async () => {
                        setBusy(`idx-${r.id}`);
                        setError("");
                        const res = await fetch("/api/seo", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "save-entity",
                            id: r.id,
                            updates: { indexableOverride: !r.indexable },
                            reason: "admin indexability toggle",
                          }),
                        });
                        const j = await res.json();
                        setBusy(null);
                        if (!j.success) setError(j.message);
                        else {
                          setMessage(`Indexability → ${!r.indexable ? "index" : "noindex"}`);
                          await loadEntities("entities");
                          loadDash();
                        }
                      }}
                    >
                      {r.indexable ? "Noindex" : "Index"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(tab === "products" || tab === "vendors" || tab === "categories") && (
        <div className="surface-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Title</th>
                <th className="p-3">Score</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="p-3 font-medium">{r.name || "—"}</td>
                  <td className="p-3 text-[var(--muted)]">{r.seo?.title?.en || "—"}</td>
                  <td className="p-3">{r.score ?? "—"}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="dash-chip"
                      disabled={busy === r.id}
                      onClick={() => generate(r.type, r.id)}
                    >
                      {busy === r.id ? "…" : "Generate SEO"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "issues" && (
        <ul className="space-y-2 text-sm">
          {issues.map((i, n) => (
            <li key={n} className="surface-card p-3">
              <span className="label-caps me-2">{i.severity}</span>
              {i.entity}: {i.name} — {i.problem}
            </li>
          ))}
          {issues.length === 0 && <li className="empty-state">No issues in the latest scan of published products.</li>}
        </ul>
      )}

      {tab === "duplicates" && (
        <ul className="space-y-2 text-sm">
          {dups.map((d) => (
            <li key={d.title} className="surface-card p-4">
              <p className="font-medium">{d.title}</p>
              <p className="text-[var(--muted)]">{d.pages.map((p) => p.name).join(" · ")}</p>
              <p className="text-xs mt-1">{d.action}</p>
            </li>
          ))}
          {dups.length === 0 && <li className="empty-state">No duplicate product titles detected.</li>}
        </ul>
      )}

      {tab === "redirects" && (
        <div className="space-y-4">
          <form onSubmit={saveRedirect} className="surface-card p-4 grid md:grid-cols-[1fr_1fr_auto] gap-3">
            <input className="filter-input" placeholder="/en/old-slug" value={fromPath} onChange={(e) => setFromPath(e.target.value)} required />
            <input className="filter-input" placeholder="/en/new-slug" value={toPath} onChange={(e) => setToPath(e.target.value)} required />
            <button type="submit" className="btn-primary">
              Add 301
            </button>
          </form>
          <ul className="text-sm space-y-2">
            {redirects.map((r) => (
              <li key={r._id} className="surface-card p-3">
                {r.fromPath} → {r.toPath} ({r.type})
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "robots" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Leave empty to use the safe default (public pages allowed; admin, dashboards and auth blocked). A rule of
            <code> Disallow: /</code> is ignored.
          </p>
          <textarea className="filter-input min-h-56 font-mono text-xs" value={robots} onChange={(e) => setRobots(e.target.value)} />
          <button type="button" className="btn-primary" onClick={saveRobots}>
            Save robots.txt
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
