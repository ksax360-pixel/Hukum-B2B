"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type Notif = {
  _id: string;
  type?: string;
  title?: { en?: string; ar?: string };
  body?: { en?: string; ar?: string };
  channel?: string;
  read?: boolean;
  createdAt?: string;
  meta?: { trigger?: string; channels?: string[]; deferred?: boolean };
};

export default function BuyerNotificationsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [items, setItems] = useState<Notif[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/messages?resource=notifications", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "mark_notification_read", id }),
    }).catch(() => undefined);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{isAr ? "الإشعارات" : "Notifications"}</h1>
          <p className="text-[var(--muted)]">
            {isAr
              ? "بريد، واتساب، وداخل التطبيق — ترحيب، عروض، وتذكيرات."
              : "Email, WhatsApp, and in-app — welcome, quotes, and reminders."}
          </p>
        </div>
        <button type="button" className="btn-secondary text-sm" onClick={load}>
          {isAr ? "تحديث" : "Refresh"}
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {loading ? (
        <div className="skeleton h-32" />
      ) : items.length === 0 ? (
        <div className="empty-state">{isAr ? "لا إشعارات بعد." : "No notifications yet."}</div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const title = isAr ? n.title?.ar || n.title?.en : n.title?.en || n.title?.ar;
            const body = isAr ? n.body?.ar || n.body?.en : n.body?.en || n.body?.ar;
            return (
              <div
                key={n._id}
                className={`surface-card p-4 ${n.read ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-[0.65rem] uppercase tracking-wide text-[var(--muted)]">
                      {(n.channel || "in_app").replace(/_/g, " ")}
                      {n.type ? ` · ${n.type}` : ""}
                      {n.meta?.deferred ? (isAr ? " · مؤجل" : " · deferred") : ""}
                    </p>
                    <p className="mt-1 mb-0 font-semibold text-[var(--ink)]">{title || "Notice"}</p>
                    <p className="mt-1 mb-0 text-sm text-[var(--muted)]">{body}</p>
                    {n.createdAt ? (
                      <p className="mt-2 mb-0 text-xs text-[var(--muted)]">
                        {new Date(n.createdAt).toLocaleString(locale)}
                      </p>
                    ) : null}
                  </div>
                  {!n.read ? (
                    <button type="button" className="btn-secondary text-xs" onClick={() => void markRead(n._id)}>
                      {isAr ? "مقروء" : "Mark read"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
