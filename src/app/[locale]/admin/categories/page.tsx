"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";
import { t } from "@/lib/utils";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";
import { MARKETPLACE_INDUSTRIES } from "@/data/marketplace-industries";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { KtSelect } from "@/components/ui/KtSelect";

type Industry = { _id: string; name?: { en?: string; ar?: string } };
type Category = {
  _id: string;
  industryId?: string;
  name?: { en?: string; ar?: string };
  level?: number;
  icon?: string;
  slug?: { en?: string };
  parentId?: string | null;
};

export default function AdminCategoriesPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [industryName, setIndustryName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("");
  const [audit, setAudit] = useState<{
    live?: {
      categories?: number;
      attributes?: number;
      templates?: number;
      byLevel?: { _id: number; count: number }[];
      missingTemplate?: number;
    };
    catalog?: {
      summary?: {
        uniqueAttributes?: number;
        enrichmentNodes?: number;
        filterableAttributes?: number;
        subcategoryBackfillParents?: number;
      };
    };
  } | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/categories?resource=tree").then((r) => r.json()),
      fetch("/api/categories?resource=audit").then((r) => r.json()),
    ])
      .then(([tree, aud]) => {
        if (!tree.success) throw new Error(tree.message);
        setIndustries(tree.data?.industries || []);
        setCategories(tree.data?.categories || []);
        if (aud.success) setAudit(aud.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dbSlugSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of categories) {
      if (c.slug?.en) set.add(c.slug.en);
      if (c.icon) set.add(c.icon);
    }
    return set;
  }, [categories]);

  const coverage = useMemo(() => {
    const present = MARKETPLACE_CATEGORIES.filter(
      (c) => dbSlugSet.has(c.slug.en) || dbSlugSet.has(c.key)
    ).length;
    return {
      present,
      total: MARKETPLACE_CATEGORIES.length,
      missing: MARKETPLACE_CATEGORIES.length - present,
    };
  }, [dbSlugSet]);

  const catalogGroups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return MARKETPLACE_INDUSTRIES.map((ind) => {
      const cats = MARKETPLACE_CATEGORIES.filter((c) => c.industry.en === ind.name.en).filter((c) => {
        if (!q) return true;
        const hay = `${c.name.en} ${c.name.ar} ${(c.children || []).map((x) => x.name.en).join(" ")}`.toLowerCase();
        return hay.includes(q) || ind.name.en.toLowerCase().includes(q);
      });
      return { ind, cats };
    }).filter((g) => g.cats.length > 0);
  }, [filter]);

  const createIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industryName.trim()) return;
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "industry", nameEn: industryName.trim() }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setIndustryName("");
      setMessage("Industry created");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !industryId) return;
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", nameEn: categoryName.trim(), industryId }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setCategoryName("");
      setMessage("Category created");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const syncCatalog = async () => {
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "sync-catalog" }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      const d = j.data || {};
      setMessage(
        `Catalog synced · +${d.industriesCreated || 0} industries · +${d.categoriesCreated || 0} categories · ${d.categoriesUpdated || 0} updated`
      );
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Taxonomy")}</h1>
        <p className="text-[var(--muted)]">
          Full marketplace catalogue coverage — industries, categories, stationery, printing, services, and{" "}
          <strong className="text-[var(--foreground)]">Others</strong> for unmatched uploads.
        </p>
      </div>

      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-emerald-700 mb-4">{message}</p>}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="surface-card p-5">
          <p className="label-caps mb-2">Catalog categories</p>
          <p className="text-2xl font-semibold">{coverage.total}</p>
        </div>
        <div className="surface-card p-5">
          <p className="label-caps mb-2">Linked in DB</p>
          <p className="text-2xl font-semibold">{coverage.present}</p>
        </div>
        <div className="surface-card p-5">
          <p className="label-caps mb-2">Missing</p>
          <p className="text-2xl font-semibold">{coverage.missing}</p>
        </div>
        <div className="surface-card p-5">
          <p className="label-caps mb-2">Industries</p>
          <p className="text-2xl font-semibold">{MARKETPLACE_INDUSTRIES.length}</p>
        </div>
      </div>

      <div className="surface-card p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-[var(--ink)]">Sync taxonomy architecture</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Sync industries, variable-depth categories, attribute templates, filters, synonyms, and SEO metadata into the live database.
          </p>
          {audit?.catalog?.summary && (
            <p className="text-xs text-[var(--muted)] mt-2">
              Templates: {audit.live?.templates ?? "—"} · Attributes: {audit.catalog.summary.uniqueAttributes ?? "—"} · Enrichment
              nodes: {audit.catalog.summary.enrichmentNodes ?? "—"} · Filterable:{" "}
              {audit.catalog.summary.filterableAttributes ?? "—"}
              {audit.live?.byLevel?.length
                ? ` · Levels: ${audit.live.byLevel.map((l) => `L${l._id}=${l.count}`).join(", ")}`
                : ""}
            </p>
          )}
        </div>
        <button type="button" className="btn-primary" disabled={syncing} onClick={syncCatalog}>
          {syncing ? "Syncing…" : "Sync taxonomy to database"}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <form onSubmit={createIndustry} className="surface-card p-6 space-y-4">
          <p className="label-caps">New industry</p>
          <input
            className="input-field"
            placeholder="Industry name (English)"
            value={industryName}
            onChange={(e) => setIndustryName(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={creating}>
            Add industry
          </button>
        </form>
        <form onSubmit={createCategory} className="surface-card p-6 space-y-4">
          <p className="label-caps">New category</p>
          <KtSelect
            name="industryId"
            value={industryId}
            onChange={setIndustryId}
            required
            placeholder="Select industry"
            options={[
              { value: "", label: "Select industry" },
              ...industries.map((i) => ({
                value: i._id,
                label: t(locale, i.name) || i._id,
              })),
            ]}
          />
          <input
            className="input-field"
            placeholder='Category name (e.g. "Others" if nothing else fits)'
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={creating}>
              Add category
            </button>
            <button type="button" className="btn-secondary" disabled={creating || !industryId} onClick={() => setCategoryName("Others")}>
              Use “Others”
            </button>
          </div>
        </form>
      </div>

      <div className="surface-card p-6 mb-8 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps mb-2">Marketplace catalog</p>
            <h2 className="text-xl font-semibold">{dashT(locale, "All industries & categories")}</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Includes stationery, printing materials, digital printing, and every service segment.
            </p>
          </div>
          <input
            className="input-field max-w-xs"
            placeholder="Search catalog…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="space-y-6 max-h-[640px] overflow-auto pr-1">
          {catalogGroups.map(({ ind, cats }) => (
            <div key={ind.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--ink)]">{locale === "ar" ? ind.name.ar : ind.name.en}</h3>
                <span className="text-xs text-[var(--muted)]">{cats.length} categories</span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {cats.map((cat) => {
                  const linked = dbSlugSet.has(cat.slug.en) || dbSlugSet.has(cat.key);
                  return (
                    <div
                      key={cat.key}
                      className={`rounded-xl border p-3 ${linked ? "border-[var(--border)] bg-white" : "border-amber-300/60 bg-amber-50/40"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="h-11 w-11 rounded-lg grid place-items-center shrink-0"
                          style={{ background: cat.soft }}
                        >
                          <CategoryIcon categoryKey={cat.key} className="h-7 w-7" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[var(--ink)] truncate">
                            {locale === "ar" ? cat.name.ar : cat.name.en}
                          </p>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5">
                            {linked ? "In database" : "Not synced"}
                            {cat.children?.length ? ` · ${cat.children.length} subcategories` : ""}
                          </p>
                          {cat.children && cat.children.length > 0 && (
                            <p className="text-[11px] text-[var(--ink-soft)] mt-1 line-clamp-2">
                              {cat.children.map((c) => (locale === "ar" ? c.name.ar : c.name.en)).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="surface-card p-6">
          <p className="label-caps mb-4">DB industries ({industries.length})</p>
          <ul className="space-y-2 text-sm max-h-[320px] overflow-auto">
            {industries.map((i) => (
              <li key={i._id} className="py-2 border-b border-[var(--border)] last:border-0">
                {t(locale, i.name) || "—"}
              </li>
            ))}
            {industries.length === 0 && <li className="empty-state py-8">No industries yet</li>}
          </ul>
        </div>
        <div className="surface-card p-6">
          <p className="label-caps mb-4">DB categories ({categories.length})</p>
          <ul className="space-y-2 text-sm max-h-[320px] overflow-auto">
            {categories.map((c) => (
              <li key={c._id} className="py-2 border-b border-[var(--border)] last:border-0">
                {t(locale, c.name) || "—"}
                <span className="text-[var(--muted)] ml-2">L{c.level ?? 1}</span>
              </li>
            ))}
            {categories.length === 0 && <li className="empty-state py-8">No categories yet</li>}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
