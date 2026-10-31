"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { dashT } from "@/i18n/dash-copy";

export default function BuyerSettingsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState(locale);
  const [prefs, setPrefs] = useState({
    emailQuotes: true,
    emailReminders: true,
    whatsappReminders: false,
    inApp: true,
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setEmail(j.data?.user?.email || j.data?.session?.email || "");
          const pref = j.data?.session?.preferredLanguage || j.data?.user?.preferredLanguage;
          if (pref) setLanguage(pref);
        }
      })
      .finally(() => setLoading(false));
    try {
      const raw = localStorage.getItem("kt_buyer_notify_prefs");
      if (raw) setPrefs({ ...prefs, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("kt_buyer_notify_prefs", JSON.stringify(prefs));
    setMsg(isAr ? "تم حفظ تفضيلات الإشعارات." : "Notification preferences saved.");
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Settings")}</h1>
        <p className="text-[var(--muted)]">
          {isAr ? "الملف والإشعارات وتصدير/حذف البيانات." : "Profile, notifications, and data export/delete."}
        </p>
      </div>
      {msg ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{msg}</p> : null}
      {loading ? (
        <div className="surface-card skeleton h-40 p-8" />
      ) : (
        <div className="grid max-w-xl gap-4">
          <div className="surface-card space-y-3 p-6">
            <div>
              <label className="label-caps mb-2 block">Email</label>
              <input className="input-field" value={email} readOnly />
            </div>
            <div>
              <label className="label-caps mb-2 block">{isAr ? "اللغة" : "Preferred language"}</label>
              <input className="input-field capitalize" value={language} readOnly />
            </div>
            <Link href={`/${locale}/buyer/profile`} className="btn-secondary inline-flex text-sm">
              {isAr ? "تعديل الملف" : "Edit profile"}
            </Link>
          </div>

          <form onSubmit={savePrefs} className="surface-card space-y-3 p-6">
            <h2 className="m-0 text-lg font-semibold">{isAr ? "الإشعارات" : "Notifications"}</h2>
            {(
              [
                ["emailQuotes", isAr ? "بريد عند وصول عرض" : "Email when quote arrives"],
                ["emailReminders", isAr ? "بريد للتذكيرات" : "Email reminders"],
                ["whatsappReminders", isAr ? "واتساب للتذكيرات" : "WhatsApp reminders"],
                ["inApp", isAr ? "داخل التطبيق" : "In-app notifications"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
            <button type="submit" className="btn-primary">
              {isAr ? "حفظ" : "Save"}
            </button>
          </form>

          <div className="surface-card p-6">
            <h2 className="m-0 text-lg font-semibold">{isAr ? "البيانات" : "Your data"}</h2>
            <p className="text-sm text-[var(--muted)]">
              {isAr ? "تصدير أو مسح بيانات PDPL." : "PDPL export or clear agent memory."}
            </p>
            <Link href={`/${locale}/buyer/privacy`} className="btn-secondary mt-2 inline-flex text-sm">
              {isAr ? "الخصوصية" : "Privacy center"}
            </Link>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
