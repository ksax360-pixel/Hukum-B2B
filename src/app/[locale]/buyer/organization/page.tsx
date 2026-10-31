"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { dashT } from "@/i18n/dash-copy";

type Member = { userId?: string; email: string; role: string; status: string; name?: string };
type Invite = { email: string; role: string; status: string };

const ROLES = ["buyer_admin", "buyer_approver", "buyer_viewer"];

export default function BuyerOrganizationPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [orgId, setOrgId] = useState("");
  const [account, setAccount] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("buyer_viewer");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/organizations", { credentials: "include" });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Failed to load team");
      setOrgId(String(j.data?.organization?._id || ""));
      setMembers(Array.isArray(j.data?.members) ? j.data.members : []);
      setInvites(Array.isArray(j.data?.invites) ? j.data.invites : []);
      const auth = await fetch("/api/auth", { credentials: "include" }).then((r) => r.json());
      setAccount(auth.data?.user?.name || auth.data?.user?.email || auth.data?.session?.email || "");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "invite", email: inviteEmail.trim(), role: inviteRole }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Invite failed");
      const tip = j.data?.demoJoinUrl ? ` Demo join: ${j.data.demoJoinUrl}` : "";
      setMsg((isAr ? "تم إرسال الدعوة." : "Invite email sent.") + tip);
      setInviteEmail("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (!userId || !window.confirm(isAr ? "إزالة العضو؟" : "Remove member?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "remove_member", userId }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Remove failed");
      setMsg(isAr ? "تمت الإزالة." : "Member removed.");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId: string, role: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "update_role", userId, role }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Role update failed");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Organization")}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "فريق الشركة: دعوة بالأيميل، أدوار، وإزالة الأعضاء."
            : "Company team: email invites, roles, and remove members."}
        </p>
      </div>
      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {msg ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{msg}</p> : null}

      <div className="mb-5 surface-card p-5">
        <p className="label-caps mb-1">{isAr ? "المنظمة" : "Organization"}</p>
        <p className="m-0 font-mono text-sm">{orgId || (isAr ? "حساب فردي" : "Solo account")}</p>
        <p className="mt-2 mb-0 text-sm text-[var(--muted)]">{account}</p>
      </div>

      <form onSubmit={invite} className="mb-5 flex flex-wrap gap-2 surface-card p-4">
        <input
          className="input-field min-w-[200px] flex-1"
          placeholder={isAr ? "بريد العضو" : "Member email"}
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
        />
        <select className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary" disabled={busy}>
          {isAr ? "دعوة" : "Invite"}
        </button>
      </form>

      <div className="mb-5 surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="p-3">{isAr ? "المستخدم" : "User"}</th>
              <th className="p-3">{isAr ? "الدور" : "Role"}</th>
              <th className="p-3">{isAr ? "الحالة" : "Status"}</th>
              <th className="p-3">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId || m.email} className="table-row">
                <td className="p-3">
                  {m.name || m.email}
                  {m.name ? <div className="text-xs text-[var(--muted)]">{m.email}</div> : null}
                </td>
                <td className="p-3">
                  <select
                    className="input-field"
                    value={m.role}
                    disabled={busy || !m.userId}
                    onChange={(e) => m.userId && changeRole(m.userId, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 capitalize">{m.status}</td>
                <td className="p-3">
                  {m.userId ? (
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      disabled={busy}
                      onClick={() => removeMember(m.userId!)}
                    >
                      {isAr ? "إزالة" : "Remove"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length ? (
        <div className="surface-card p-4">
          <p className="label-caps mb-2">{isAr ? "دعوات معلّقة" : "Pending invites"}</p>
          <ul className="m-0 space-y-1 text-sm">
            {invites.map((i) => (
              <li key={i.email}>
                {i.email} · {i.role}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashboardShell>
  );
}
