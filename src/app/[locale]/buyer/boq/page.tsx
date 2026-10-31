"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type BoqLine = {
  name: { en: string };
  quantity: number;
  unit: string;
  specifications?: string;
  targetPrice?: number;
};

export default function BuyerBoqPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [text, setText] = useState(
    "Item,Qty,Unit,Specs,TargetPrice\nSafety helmet,100,piece,EN397,45\nNitrile gloves,500,box,Chemical resistant,12"
  );
  const [lines, setLines] = useState<BoqLine[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"parse" | "review">("parse");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");

  async function parseText() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/procurement/boq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setLines(json.data.lines || []);
      setWarnings(json.data.warnings || []);
      setStep("review");
      if (!title) setTitle(`BOQ RFQ ${new Date().toISOString().slice(0, 10)}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/procurement/boq", { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setLines(json.data.lines || []);
      setWarnings(json.data.warnings || []);
      setStep("review");
      if (!title) setTitle(`BOQ RFQ ${new Date().toISOString().slice(0, 10)}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function updateLine(i: number, patch: Partial<BoqLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function createRfq() {
    if (!lines.length) return;
    if (!title.trim()) {
      setError(isAr ? "أدخل عنوان الطلب" : "Enter an RFQ title");
      return;
    }
    if (!city.trim()) {
      setError(isAr ? "أدخل مدينة التسليم" : "Enter a delivery city");
      return;
    }
    if (!deadline || deadline < todayIso) {
      setError(isAr ? "اختر موعداً نهائياً في المستقبل" : "Choose a future quote deadline");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "create",
          idempotencyKey:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `boq_${Date.now()}`,
          title: { en: title.trim(), ar: title.trim() },
          description: {
            en: "Created from BOQ / Excel upload",
            ar: "أُنشئ من رفع جدول كميات",
          },
          status: "open",
          currency: "SAR",
          deadline,
          deliveryLocation: { city: city.trim(), country: "SA" },
          budget: budget ? Number(budget) : undefined,
          items: lines.map((l) => ({
            ...l,
            unit: ["piece", "box", "kg", "ton", "meter", "liter", "set", "pack"].includes(l.unit)
              ? l.unit
              : "piece",
            targetPrice: l.targetPrice != null ? Number(l.targetPrice) : undefined,
          })),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "RFQ failed");
      router.push(`/${locale}/buyer/rfqs`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          {isAr ? "رفع جدول الكميات / Excel" : "BOQ / Excel upload"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "حلّل البنود، راجع العنوان والمدينة والموعد، ثم أرسل للموردين المطابقين."
            : "Parse lines, review title / city / deadline, then invite matched suppliers."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}

      {step === "parse" ? (
        <div className="mb-4 grid gap-3 lg:grid-cols-2">
          <div className="surface-card space-y-3 p-4">
            <label className="block text-sm">
              {isAr ? "لصق CSV / نص" : "Paste CSV / text"}
              <textarea
                className="input-field mt-1 min-h-[160px] font-mono text-xs"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void parseText()}>
              {isAr ? "تحليل النص" : "Parse text"}
            </button>
          </div>
          <div className="surface-card space-y-3 p-4">
            <label className="block text-sm">
              {isAr ? "رفع Excel / CSV" : "Upload Excel / CSV"}
              <input
                className="mt-2 block w-full text-sm"
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls"
                onChange={(e) => void onFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-[var(--muted)]">
              {isAr
                ? "الأعمدة: الاسم، الكمية، الوحدة، المواصفات، السعر المستهدف"
                : "Columns: name, qty, unit, specs, target price"}
            </p>
          </div>
        </div>
      ) : null}

      {warnings.length ? (
        <ul className="mb-3 text-xs text-amber-800">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {lines.length > 0 && step === "review" ? (
        <div className="space-y-4">
          <div className="surface-card space-y-3 p-4">
            <p className="m-0 text-sm font-semibold">
              {isAr ? "مراجعة قبل الإرسال" : "Review before sending"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                {isAr ? "عنوان الطلب" : "RFQ title"} *
                <input
                  className="input-field mt-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                {isAr ? "مدينة التسليم" : "Delivery city"} *
                <input
                  className="input-field mt-1"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                {isAr ? "آخر موعد للعروض" : "Quote deadline"} *
                <input
                  className="input-field mt-1"
                  type="date"
                  min={todayIso}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                {isAr ? "الميزانية (اختياري)" : "Budget (optional)"}
                <input
                  className="input-field mt-1"
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="SAR"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setStep("parse")}>
                {isAr ? "رجوع للتحليل" : "Back to parse"}
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void createRfq()}>
                {busy
                  ? isAr
                    ? "جارٍ…"
                    : "Sending…"
                  : isAr
                    ? "تأكيد وإنشاء الطلب"
                    : "Confirm & create RFQ"}
              </button>
            </div>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="border-b border-[var(--border)] p-4">
              <p className="m-0 text-sm font-semibold">
                {lines.length} {isAr ? "بند" : "line items"}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="p-3">{isAr ? "البند" : "Item"}</th>
                  <th className="p-3">{isAr ? "الكمية" : "Qty"}</th>
                  <th className="p-3">{isAr ? "الوحدة" : "Unit"}</th>
                  <th className="p-3">{isAr ? "مواصفات" : "Specs"}</th>
                  <th className="p-3">{isAr ? "سعر مستهدف" : "Target price"}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="table-row">
                    <td className="p-3">{l.name.en}</td>
                    <td className="p-3">{l.quantity}</td>
                    <td className="p-3">{l.unit}</td>
                    <td className="p-3 text-[var(--muted)]">{l.specifications || "—"}</td>
                    <td className="p-3">
                      <input
                        className="input-field w-24"
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.targetPrice ?? ""}
                        onChange={(e) =>
                          updateLine(i, {
                            targetPrice: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
