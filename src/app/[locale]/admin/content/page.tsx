"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { dashT } from "@/i18n/dash-copy";
import { t, slugifyText } from "@/lib/utils";

type CmsPage = {
  _id: string;
  slug?: { en?: string; ar?: string } | string;
  type?: string;
  status?: string;
  title?: { en?: string; ar?: string };
  body?: { en?: string; ar?: string };
  updatedAt?: string;
};

export default function AdminContentPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [type, setType] = useState("page");
  const [editing, setEditing] = useState<CmsPage | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/platform?resource=cms&admin=1")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setPages(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPage = async () => {
    if (!titleEn.trim()) {
      setError("English title is required");
      return;
    }
    setBusyId("new");
    setError("");
    setMessage("");
    try {
      const slugEn = slugifyText(titleEn);
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cms_upsert",
          updates: {
            type,
            title: { en: titleEn, ar: titleAr },
            slug: { en: slugEn, ar: titleAr ? slugifyText(titleAr) : slugEn },
            body: { en: bodyEn, ar: bodyAr },
            status: "draft",
          },
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage("Draft created");
      setTitleEn("");
      setTitleAr("");
      setBodyEn("");
      setBodyAr("");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cms_upsert", id, updates: { status } }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage(`Page ${status}`);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (p: CmsPage) => {
    setEditing(p);
    setTitleEn(p.title?.en || "");
    setTitleAr(p.title?.ar || "");
    setBodyEn(p.body?.en || "");
    setBodyAr(p.body?.ar || "");
    setType(p.type || "page");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusyId(editing._id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cms_upsert",
          id: editing._id,
          updates: {
            type,
            title: { en: titleEn, ar: titleAr },
            body: { en: bodyEn, ar: bodyAr },
          },
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage("Page updated");
      setEditing(null);
      setTitleEn("");
      setTitleAr("");
      setBodyEn("");
      setBodyAr("");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const slugDisplay = (p: CmsPage) => {
    if (typeof p.slug === "string") return p.slug;
    return p.slug?.en || p.slug?.ar || "—";
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Content")}</h1>
        <p className="text-[var(--muted)]">CMS pages for marketing and help content.</p>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-4">{message}</p>}

      <div className="surface-card p-5 mb-8 space-y-3">
        <p className="label-caps">{editing ? "Edit page" : "Create page"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input-field" placeholder="Title (EN)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          <input className="input-field" placeholder="Title (AR)" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
          <textarea className="input-field min-h-24" placeholder="Body (EN)" value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} />
          <textarea className="input-field min-h-24" placeholder="Body (AR)" value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} dir="rtl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="input-field max-w-[10rem]" value={type} onChange={(e) => setType(e.target.value)} disabled={Boolean(editing)}>
            <option value="page">page</option>
            <option value="blog">blog</option>
            <option value="faq">faq</option>
            <option value="landing">landing</option>
          </select>
          {editing ? (
            <>
              <button type="button" className="btn-primary" disabled={busyId === editing._id} onClick={() => void saveEdit()}>
                {busyId === editing._id ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEditing(null);
                  setTitleEn("");
                  setTitleAr("");
                  setBodyEn("");
                  setBodyAr("");
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" disabled={busyId === "new"} onClick={() => void createPage()}>
              {busyId === "new" ? "Saving…" : "Create draft"}
            </button>
          )}
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : pages.length === 0 ? (
          <div className="empty-state">
            <p className="label-caps mb-2">CMS</p>
            <p className="text-[var(--ink)] font-medium">No pages yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">Title</th>
                <th className="p-4 label-caps">Slug</th>
                <th className="p-4 label-caps">Type</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps" />
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p._id} className="table-row">
                  <td className="p-4 font-medium">{t(locale, p.title) || "—"}</td>
                  <td className="p-4 font-mono text-xs text-[var(--muted)]">{slugDisplay(p)}</td>
                  <td className="p-4 capitalize">{p.type || "page"}</td>
                  <td className="p-4 capitalize">{p.status || "draft"}</td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button type="button" className="btn-ghost text-xs py-2 px-3" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    {p.status !== "published" ? (
                      <button
                        type="button"
                        className="btn-primary text-xs py-2 px-3"
                        disabled={busyId === p._id}
                        onClick={() => void setStatus(p._id, "published")}
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost text-xs py-2 px-3"
                        disabled={busyId === p._id}
                        onClick={() => void setStatus(p._id, "archived")}
                      >
                        Archive
                      </button>
                    )}
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
