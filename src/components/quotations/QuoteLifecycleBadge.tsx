"use client";

const STAGES = [
  "requirement",
  "invited",
  "viewed",
  "quoted",
  "clarifying",
  "revised",
  "shortlisted",
  "accepted",
  "deal_confirmed",
  "reviewed",
] as const;

const EXITS = new Set(["rejected", "expired", "withdrawn", "no_response", "declined"]);

function mapStatus(status?: string): string {
  const s = String(status || "draft").toLowerCase();
  if (s === "submitted") return "quoted";
  if (s === "draft") return "requirement";
  return s;
}

export function QuoteLifecycleBadge({
  status,
  locale = "en",
}: {
  status?: string;
  locale?: string;
}) {
  const isAr = locale === "ar";
  const stage = mapStatus(status);
  const isExit = EXITS.has(stage);
  const idx = STAGES.indexOf(stage as (typeof STAGES)[number]);

  return (
    <div className="space-y-1">
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          isExit
            ? "bg-red-100 text-red-800"
            : stage === "accepted" || stage === "deal_confirmed" || stage === "reviewed"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-[#c9a962]/20 text-[#5c4a1f]"
        }`}
      >
        {stage.replace(/_/g, " ")}
      </span>
      {!isExit ? (
        <div className="flex flex-wrap gap-0.5" aria-hidden>
          {STAGES.map((s, i) => (
            <span
              key={s}
              title={s}
              className={`h-1.5 w-3 rounded-sm ${i <= idx ? "bg-[#0F766E]" : "bg-[#e6e2da]"}`}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 text-[10px] text-[var(--muted)]">
          {isAr ? "مسار خروج" : "Exit path"}: {stage.replace(/_/g, " ")}
        </p>
      )}
    </div>
  );
}

export function QuoteVatHijriNote({
  locale = "en",
  vatIncluded,
  validity,
  validityHijri,
}: {
  locale?: string;
  vatIncluded?: boolean;
  validity?: string;
  validityHijri?: string;
}) {
  const isAr = locale === "ar";
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2,#f7f7f5)] px-3 py-2 text-[11px] text-[var(--muted)]">
      <p className="m-0 font-medium text-[var(--ink)]">
        {vatIncluded
          ? isAr
            ? "الأسعار شاملة ضريبة القيمة المضافة 15٪"
            : "Prices include 15% VAT"
          : isAr
            ? "الأسعار غير شاملة ضريبة القيمة المضافة 15٪ (ما لم يُذكر خلاف ذلك)"
            : "Prices exclude 15% VAT unless stated"}
      </p>
      <p className="mt-1 mb-0">
        {isAr
          ? "عرض السعر عبر حكم غير ملزم قانوناً."
          : "Quotations on Hukum are not binding offers."}
      </p>
      {validity ? (
        <p className="mt-1 mb-0">
          {isAr ? "الصلاحية" : "Validity"}: {new Date(validity).toLocaleDateString(locale)}
          {validityHijri ? ` · ${validityHijri}` : ""}
        </p>
      ) : null}
    </div>
  );
}
