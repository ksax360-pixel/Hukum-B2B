"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { createTicket, listTickets, updateTicketStatus, type SupportTicket } from "@/lib/tickets";
import { dashT } from "@/i18n/dash-copy";

export function TicketDesk({ role }: { role: "admin" | "vendor" | "buyer" }) {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("General");
  const [urgency, setUrgency] = useState<SupportTicket["urgency"]>("Medium");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      setTickets(await listTickets());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const counts = useMemo(() => {
    return {
      open: tickets.filter((t) => t.status === "Open").length,
      progress: tickets.filter((t) => t.status === "In Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
    };
  }, [tickets]);

  const submit = async () => {
    if (!topic.trim() || !body.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await createTicket({
        topic: topic.trim(),
        category,
        urgency,
        requester: role === "admin" ? "Marketplace admin" : role === "vendor" ? "Vendor" : "Buyer",
        body: body.trim(),
        roleScope: role,
      });
      await reload();
      setTopic("");
      setBody("");
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-caps">{dashT(locale, "Support")}</p>
          <h1 className="text-3xl font-semibold">{dashT(locale, "Ticket system")}</h1>
          <p className="mt-1 text-sm opacity-60">{dashT(locale, "Raise, track, and close marketplace support tickets.")}</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => setOpen(true)}>
          <Plus size={14} />
          {dashT(locale, "Create ticket")}
        </button>
      </div>

      {error && <p className="text-sm text-[var(--accent)]">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div id="cardColor" className="rounded-[10px] p-5">
          <p className="label-caps">{dashT(locale, "Open")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.open}</p>
        </div>
        <div id="cardColor" className="rounded-[10px] p-5">
          <p className="label-caps">{dashT(locale, "In progress")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.progress}</p>
        </div>
        <div id="cardColor" className="rounded-[10px] p-5">
          <p className="label-caps">{dashT(locale, "Resolved")}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.resolved}</p>
        </div>
      </div>

      <div id="cardColor" className="overflow-hidden rounded-[10px]">
        <div className="grid grid-cols-[1fr_120px_110px_90px] gap-3 border-b border-[#071D27]/8 px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] opacity-50">
          <span>{dashT(locale, "Topic")}</span>
          <span>{dashT(locale, "Category")}</span>
          <span>{dashT(locale, "Status")}</span>
          <span>{dashT(locale, "Urgency")}</span>
        </div>
        {tickets.length === 0 ? (
          <p className="px-5 py-8 text-sm opacity-60">No tickets yet</p>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="grid grid-cols-[1fr_120px_110px_90px] items-center gap-3 border-b border-[#071D27]/6 px-5 py-4 last:border-0">
              <div>
                <p className="text-sm font-medium">{ticket.topic}</p>
                <p className="text-[11px] opacity-50">
                  {ticket.id} · {ticket.requester}
                </p>
              </div>
              <p className="text-xs opacity-70">{ticket.category}</p>
              <select
                className="rounded-lg border border-[#071D27]/10 bg-transparent px-2 py-1 text-[11px]"
                value={ticket.status}
                onChange={async (e) => {
                  try {
                    setTickets(await updateTicketStatus(ticket.id, e.target.value as SupportTicket["status"]));
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
              <p className="text-xs">{ticket.urgency}</p>
            </div>
          ))
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#071D27]/40 p-4">
          <div id="cardColor" className="w-full max-w-lg rounded-2xl p-6">
            <h2 className="text-lg font-semibold">{dashT(locale, "Create ticket")}</h2>
            <div className="mt-4 space-y-3">
              <input className="input-field !rounded-xl" placeholder={dashT(locale, "Topic")} value={topic} onChange={(e) => setTopic(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input-field !rounded-xl" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>General</option>
                  <option>Verification</option>
                  <option>Catalog</option>
                  <option>RFQ</option>
                  <option>Billing</option>
                </select>
                <select className="input-field !rounded-xl" value={urgency} onChange={(e) => setUrgency(e.target.value as SupportTicket["urgency"])}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <textarea className="input-field min-h-28 !rounded-xl" placeholder={locale === "ar" ? "صف المشكلة" : "Describe the issue"} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void submit()}>
                {busy ? "…" : locale === "ar" ? "إرسال" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
