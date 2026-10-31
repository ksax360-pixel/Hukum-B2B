"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type Project = {
  id: string;
  title: string;
  status: string;
  quotes: number;
  shortlisted: number;
  note: string;
  href: string;
};

const NOTES_KEY = "kt_sourcing_project_notes";

function loadNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function BuyerProjectsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    setNotes(loadNotes());
    Promise.all([fetch("/api/rfqs").then((r) => r.json()), fetch("/api/quotations").then((r) => r.json())])
      .then(([rfqJ, quoteJ]) => {
        if (!rfqJ.success) throw new Error(rfqJ.message);
        const rfqs = Array.isArray(rfqJ.data) ? rfqJ.data : [];
        const quotes = Array.isArray(quoteJ.data) ? quoteJ.data : [];
        const n = loadNotes();
        setProjects(
          rfqs.map((r: { _id: string; title?: { en?: string; ar?: string } | string; status?: string }) => {
            const rid = String(r._id);
            const related = quotes.filter((q: { rfqId?: string | { _id?: string } }) => {
              const id = typeof q.rfqId === "object" ? String(q.rfqId?._id || "") : String(q.rfqId || "");
              return id === rid;
            });
            const title =
              typeof r.title === "object"
                ? locale === "ar"
                  ? r.title?.ar || r.title?.en
                  : r.title?.en
                : String(r.title || "RFQ");
            return {
              id: rid,
              title: title || "RFQ",
              status: r.status || "open",
              quotes: related.length,
              shortlisted: related.filter((q: { status?: string }) => q.status === "shortlisted").length,
              note: n[rid] || "",
              href: `/${locale}/buyer/quotations`,
            };
          })
        );
      })
      .catch((e) => setError(e.message));
  }, [locale]);

  function saveNote(id: string, note: string) {
    const next = { ...notes, [id]: note };
    setNotes(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)));
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">
            {isAr ? "مشاريع التوريد والقوائم المختصرة" : "Sourcing projects & shortlists"}
          </h1>
          <p className="text-[var(--muted)]">
            {isAr
              ? "كل طلب سعر = مشروع مع ملاحظات وقائمة مختصرة."
              : "Each RFQ is a sourcing project with notes and shortlists."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/buyer/boq`} className="btn-secondary text-sm">
            {isAr ? "رفع جدول كميات" : "BOQ upload"}
          </Link>
          <Link href={`/${locale}/buyer/rfqs`} className="btn-primary text-sm">
            {isAr ? "طلب سعر جديد" : "New RFQ"}
          </Link>
        </div>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {projects.length === 0 ? (
        <div className="empty-state">
          {isAr ? "لا مشاريع بعد." : "No sourcing projects yet."}
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <div key={p.id} className="surface-card space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 font-semibold text-[var(--ink)]">{p.title}</p>
                  <p className="m-0 mt-1 text-xs text-[var(--muted)]">
                    {p.status} · {p.quotes} {isAr ? "عروض" : "quotes"} · {p.shortlisted}{" "}
                    {isAr ? "مختصرة" : "shortlisted"}
                  </p>
                </div>
                <Link href={p.href} className="btn-secondary text-sm">
                  {isAr ? "فتح العروض" : "Open quotes"}
                </Link>
              </div>
              <label className="block text-xs text-[var(--muted)]">
                {isAr ? "ملاحظات المشروع" : "Project notes"}
                <textarea
                  className="input-field mt-1 text-sm"
                  rows={2}
                  value={p.note}
                  onChange={(e) => saveNote(p.id, e.target.value)}
                  placeholder={isAr ? "أضف ملاحظات للفريق…" : "Add notes for your team…"}
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
