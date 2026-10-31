"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashT } from "@/i18n/dash-copy";
import Link from "next/link";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/company", label: "Company" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/ai-upload", label: "AI Upload" },
  { href: "/vendor/rfqs", label: "RFQs" },
  { href: "/vendor/quotations", label: "Quotations" },
  { href: "/vendor/analytics", label: "Analytics" },
  { href: "/vendor/documents", label: "Documents" },
  { href: "/vendor/subscription", label: "Subscription" },
  { href: "/vendor/settings", label: "Settings" },
];

export default function VendorAiUploadPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [text, setText] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");

  const stageLabels = [
    "Uploading",
    "Reading document",
    "Identifying products",
    "Classifying",
    "Extracting specifications",
    "Generating English",
    "Generating Arabic",
    "Generating SEO",
    "Checking fields",
    "Ready for review",
  ];

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setStage(stageLabels[0]);
    const id = setInterval(() => {
      i = Math.min(i + 1, stageLabels.length - 1);
      setStage(stageLabels[i]);
    }, 700);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract_products", text }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "AI extraction failed");
      setResult(json.data);
      setStage("Ready for review");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "AI product upload")}</h1>
        <p className="text-[var(--muted)]">
          Paste catalogue text or extracted document content. AI suggests products — you review before publish.
        </p>
      </div>
      <textarea
        className="input-field min-h-[220px] mb-4"
        placeholder="Paste product catalogue text…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" className="btn-primary" onClick={run} disabled={loading || !text.trim()}>
        {loading ? "Processing…" : "Extract products"}
      </button>
      {loading && (
        <div className="mt-6 surface-card p-5">
          <p className="label-caps mb-2">AI processing</p>
          <p className="font-medium text-[var(--accent)]">{stage}</p>
          <div className="mt-3 h-1.5 rounded-full bg-[var(--grey)] overflow-hidden">
            <div className="h-full bg-[var(--accent)] w-2/3 animate-pulse" />
          </div>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}
      {result != null && (
        <pre className="mt-6 surface-card p-5 text-xs overflow-auto max-h-[420px]">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
      <p className="mt-6 text-sm text-[var(--muted)]">
        After review, create products from <Link href={`/${locale}/vendor/products`} className="text-[var(--accent)]">Products</Link>.
      </p>
    </DashboardShell>
  );
}
