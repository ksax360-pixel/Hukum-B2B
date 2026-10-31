"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";

type UserRow = {
  _id: string;
  email?: string;
  name?: string;
  roles?: string[];
  status?: string;
  emailVerified?: boolean;
  preferredLanguage?: string;
  createdAt?: string;
};

const ROLE_OPTIONS = [
  "super_admin",
  "admin",
  "vendor_verification_admin",
  "product_admin",
  "content_admin",
  "seo_manager",
  "support_admin",
  "analytics_manager",
  "buyer",
  "vendor_owner",
];

export default function AdminUsersPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [items, setItems] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({ limit: "100" });
    if (q.trim()) sp.set("q", q.trim());
    fetch(`/api/users?${sp}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setItems(Array.isArray(j.data) ? j.data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      setMessage("User updated");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">Users</h1>
        <p className="text-[var(--muted)]">Manage account status and roles. Changes are audit-logged.</p>
      </div>
      <div className="mb-4 flex gap-3">
        <input className="input-field max-w-sm" placeholder="Search email or name" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="btn-ghost" onClick={() => setQ("")}>
          Reset
        </button>
      </div>
      {error && <p className="text-sm text-[var(--accent)] mb-4">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-4">{message}</p>}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 skeleton h-24 m-4" />
        ) : items.length === 0 ? (
          <div className="empty-state">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 label-caps">User</th>
                <th className="p-4 label-caps">Roles</th>
                <th className="p-4 label-caps">Status</th>
                <th className="p-4 label-caps">Verified</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id} className="table-row">
                  <td className="p-4">
                    <p className="font-medium">{u.name || "—"}</p>
                    <p className="text-xs text-[var(--muted)]">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <select
                      className="input-field text-xs py-1 max-w-[14rem]"
                      disabled={busyId === u._id}
                      value={u.roles?.[0] || "buyer"}
                      onChange={(e) => void patch(u._id, { roles: [e.target.value] })}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <select
                      className="input-field text-xs py-1"
                      disabled={busyId === u._id}
                      value={u.status || "active"}
                      onChange={(e) => void patch(u._id, { status: e.target.value })}
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      className="btn-ghost text-xs py-1 px-2"
                      disabled={busyId === u._id}
                      onClick={() => void patch(u._id, { emailVerified: !u.emailVerified })}
                    >
                      {u.emailVerified ? "Verified" : "Mark verified"}
                    </button>
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
