"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

export default function BuyerPrivacyPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function exportData() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/privacy?resource=export", { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Export failed");
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hukum-pdpl-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(isAr ? "تم تنزيل حزمة التصدير (PDPL)." : "PDPL export package downloaded.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function clearHukumMemory() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "clear_hukum_memory" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Clear failed");
      setMsg(isAr ? "تم مسح ذاكرة وكيل Hukum." : "Hukum agent memory cleared.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function requestDeletion() {
    const reason = window.prompt(
      isAr ? "سبب اختياري لطلب الحذف:" : "Optional reason for deletion request:"
    );
    if (reason === null) return;
    if (
      !window.confirm(
        isAr
          ? "سيتم تعطيل حسابك فوراً. هل تريد المتابعة؟"
          : "Your account will be deactivated immediately. Continue?"
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "request_account_deletion", reason }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Deletion request failed");
      setMsg(
        isAr
          ? "تم طلب الحذف وتعطيل الحساب. سيتم توجيهك لتسجيل الدخول."
          : "Deletion requested and account deactivated. Redirecting to login…"
      );
      window.setTimeout(() => {
        window.location.href = `/${locale}/login`;
      }, 1200);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{isAr ? "الخصوصية والبيانات" : "Privacy & data"}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "تصدير أو حذف بياناتك الشخصية وفق نظام حماية البيانات الشخصية."
            : "Export or clear your personal data under Saudi PDPL."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {msg ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{msg}</p> : null}
      <div className="grid max-w-2xl gap-4">
        <div className="surface-card p-5">
          <h2 className="mt-0 text-lg font-semibold">{isAr ? "تصدير البيانات" : "Export on request"}</h2>
          <p className="text-sm text-[var(--muted)]">
            {isAr
              ? "تنزيل محادثاتك وجلسات Hukum وطلبات الأسعار والإشعارات."
              : "Download conversations, Hukum sessions, RFQs, quotes, and notifications."}
          </p>
          <button type="button" className="btn-primary mt-3" disabled={busy} onClick={() => void exportData()}>
            {isAr ? "تنزيل JSON" : "Download JSON"}
          </button>
        </div>
        <div className="surface-card p-5">
          <h2 className="mt-0 text-lg font-semibold">{isAr ? "مسح ذاكرة الوكيل" : "Clear agent memory"}</h2>
          <p className="text-sm text-[var(--muted)]">
            {isAr
              ? "يحذف الاحتياج والموردين والسجل من جلسة Hukum (لا يحذف حسابك)."
              : "Clears need, suppliers, and history from Hukum sessions (does not delete your account)."}
          </p>
          <button type="button" className="btn-secondary mt-3" disabled={busy} onClick={() => void clearHukumMemory()}>
            {isAr ? "مسح الذاكرة" : "Clear memory"}
          </button>
        </div>
        <div className="surface-card border border-[var(--accent)]/30 p-5">
          <h2 className="mt-0 text-lg font-semibold">{isAr ? "حذف الحساب" : "Delete account"}</h2>
          <p className="text-sm text-[var(--muted)]">
            {isAr
              ? "طلب حذف الحساب وفق نظام حماية البيانات الشخصية. سيتم تعطيل الدخول فوراً."
              : "Request account deletion under Saudi PDPL. Sign-in is deactivated immediately; purge follows process."}
          </p>
          <button
            type="button"
            className="btn-secondary mt-3 text-[var(--accent)]"
            disabled={busy}
            onClick={() => void requestDeletion()}
          >
            {isAr ? "طلب حذف الحساب" : "Request account deletion"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
