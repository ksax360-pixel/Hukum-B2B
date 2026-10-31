"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Bell,
  Languages,
  MessageCircle,
  Send,
  Shield,
  Sparkles,
  Headphones,
} from "lucide-react";

type Conversation = {
  _id: string;
  subject?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  rfqId?: string;
  vendorId?: string;
  threadType?: "ai_assistant" | "buyer_supplier" | "support";
  contactGate?: { contactsShared?: boolean; mode?: string };
  whatsapp?: { linkedPhone?: string; optOut?: boolean };
  sla?: { dueAt?: string; status?: string; ticketId?: string };
  status?: string;
};

type ChatMessage = {
  _id: string;
  body?: string;
  bodyTranslated?: string;
  senderId?: string;
  senderRole?: string;
  createdAt?: string;
  kind?: string;
  channel?: string;
  readBy?: string[];
  meta?: { quote?: Record<string, unknown> };
  moderationStatus?: string;
};

type Reminder = {
  id: string;
  severity: "info" | "warn" | "urgent";
  title: string;
  body: string;
  href?: string;
  type: string;
};

type AgentMsg = { role: "user" | "assistant"; content: string; draft?: Record<string, unknown> };

type Props = {
  locale: string;
  role: "buyer" | "seller";
  apiBase?: string;
  authHeaders?: HeadersInit;
  linkBase?: string;
};

export function QuotationInbox({ locale, role, apiBase = "", authHeaders, linkBase = "" }: Props) {
  const isAr = locale === "ar";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [activeMeta, setActiveMeta] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingLabel, setTypingLabel] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [text, setText] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [agentMsgs, setAgentMsgs] = useState<AgentMsg[]>([]);
  const [agentDraft, setAgentDraft] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"inbox" | "reminders" | "agent" | "support">("inbox");
  const [showTranslation, setShowTranslation] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(authHeaders || {}),
    }),
    [authHeaders]
  );

  const loadConversations = useCallback(async () => {
    const q = filterType ? `?threadType=${encodeURIComponent(filterType)}` : "";
    const res = await fetch(`${apiBase}/api/messages${q}`, { headers: headers(), credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Failed to load inbox");
    setConversations(Array.isArray(json.data) ? json.data : []);
  }, [apiBase, headers, filterType]);

  const loadReminders = useCallback(async () => {
    const res = await fetch(`${apiBase}/api/quotations?resource=reminders&locale=${locale}`, {
      headers: headers(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Failed to load reminders");
    setReminders(Array.isArray(json.data?.reminders) ? json.data.reminders : []);
  }, [apiBase, headers, locale]);

  const loadThread = useCallback(
    async (id: string) => {
      if (!id) return;
      const res = await fetch(`${apiBase}/api/messages?conversationId=${encodeURIComponent(id)}`, {
        headers: headers(),
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load thread");
      setMessages(Array.isArray(json.data?.messages) ? json.data.messages : []);
      setActiveMeta(json.data?.conversation || null);
      const typing = Array.isArray(json.data?.typing) ? json.data.typing : [];
      setTypingLabel(
        typing.length
          ? isAr
            ? "يكتب…"
            : "Typing…"
          : ""
      );
    },
    [apiBase, headers, isAr]
  );

  useEffect(() => {
    setError("");
    Promise.all([loadConversations(), loadReminders()]).catch((e) => setError(e.message));
  }, [loadConversations, loadReminders]);

  useEffect(() => {
    if (activeId) void loadThread(activeId).catch((e) => setError(e.message));
  }, [activeId, loadThread]);

  async function pingTyping() {
    if (!activeId) return;
    try {
      await fetch(`${apiBase}/api/messages`, {
        method: "PATCH",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({ action: "typing", conversationId: activeId }),
      });
    } catch {
      /* ignore */
    }
  }

  function onTextChange(v: string) {
    setText(v);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => void pingTyping(), 400);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/messages`, {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({
          action: "send",
          conversationId: activeId,
          body: text.trim(),
          translateTo: showTranslation ? (isAr ? "en" : "ar") : undefined,
          syncWhatsApp: Boolean(activeMeta?.whatsapp?.linkedPhone && !activeMeta?.whatsapp?.optOut),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Send failed");
      setText("");
      await loadThread(activeId);
      await loadConversations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revealContacts() {
    if (!activeId) return;
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/messages`, {
        method: "PATCH",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({ action: "reveal_contacts", conversationId: activeId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Reveal failed");
      await loadThread(activeId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reportThread() {
    if (!activeId) return;
    const reason = window.prompt(isAr ? "سبب البلاغ؟" : "Report reason?") || "abuse";
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/messages`, {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({ action: "report", conversationId: activeId, reason }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Report failed");
      setError("");
      alert(isAr ? "تم إرسال البلاغ." : "Report submitted.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function blockThread() {
    if (!activeId) return;
    const okConfirm = window.confirm(
      isAr
        ? "حظر هذا الطرف؟ لن تصلك رسائل جديدة منهم."
        : "Block this party? You will not receive new messages from them."
    );
    if (!okConfirm) return;
    const reason = window.prompt(isAr ? "سبب الحظر (اختياري)" : "Block reason (optional)") || "user_block";
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/messages`, {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({
          action: "block",
          conversationId: activeId,
          vendorId: activeMeta?.vendorId,
          reason,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Block failed");
      setError("");
      setActiveId("");
      setActiveMeta(null);
      setMessages([]);
      await loadConversations();
      alert(isAr ? "تم الحظر." : "Blocked.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openSupport() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/messages`, {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({
          action: "start_support",
          topic: isAr ? "دعم Hukum" : "Hukum support",
          body: isAr ? "أحتاج مساعدة من فريق Hukum." : "I need help from the Hukum team.",
          locale,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Support failed");
      const id = json.data?.conversation?._id || json.data?.conversation?.id;
      await loadConversations();
      if (id) {
        setActiveId(String(id));
        setTab("inbox");
        setFilterType("support");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function askAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!agentInput.trim()) return;
    const userText = agentInput.trim();
    setAgentInput("");
    setAgentMsgs((prev) => [...prev, { role: "user", content: userText }]);
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/quote-agent`, {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({
          role,
          message: userText,
          locale,
          history: agentMsgs.slice(-6),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Agent failed");
      setAgentMsgs((prev) => [
        ...prev,
        { role: "assistant", content: json.data?.reply || "", draft: json.data?.draft },
      ]);
      if (json.data?.draft) setAgentDraft(json.data.draft);
    } catch (err) {
      setAgentMsgs((prev) => [...prev, { role: "assistant", content: (err as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  const severityClass = (s: Reminder["severity"]) =>
    s === "urgent"
      ? "border-red-300 bg-red-50 text-red-900"
      : s === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-800";

  const threadLabel = (c: Conversation) => {
    if (c.threadType === "support") return isAr ? "دعم Hukum" : "Hukum support";
    if (c.threadType === "ai_assistant") return isAr ? "وكيل AI" : "AI assistant";
    return c.subject || (isAr ? "مورد ↔ مشتري" : "Buyer ↔ supplier");
  };

  const slaText =
    activeMeta?.threadType === "support" && activeMeta.sla?.dueAt
      ? (() => {
          const ms = new Date(activeMeta.sla.dueAt).getTime() - Date.now();
          const hrs = Math.round(ms / 3600_000);
          if (ms < 0) return isAr ? "SLA متأخر" : "SLA breached";
          return isAr ? `SLA خلال ~${hrs} س` : `SLA ~${hrs}h left`;
        })()
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e6e2da] bg-gradient-to-br from-[#001730] to-[#0a2a4a] px-4 py-3 text-white">
        <p className="m-0 text-sm font-semibold">{isAr ? "صندوق وارد Hukum" : "Hukum inbox"}</p>
        <p className="m-0 mt-1 text-[11px] text-white/70">
          {isAr
            ? "محادثة واحدة لكل مورد ولكل احتياج — ويب وواتساب، مع بوابة تواصل وسجلات PDPL."
            : "One inbox for every conversation — web & WhatsApp, contact gate, PDPL records."}
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["inbox", isAr ? "الرسائل" : "Inbox", MessageCircle],
            ["reminders", isAr ? "التذكيرات" : "Reminders", Bell],
            ["agent", isAr ? "وكيل الذكاء" : "AI agent", Bot],
            ["support", isAr ? "الدعم" : "Support", Headphones],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              if (id === "support") setFilterType("support");
              if (id === "inbox" && filterType === "support") setFilterType("");
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              tab === id ? "border-[#c9a962] bg-[#c9a962]/15 text-[#001730]" : "border-[#e6e2da] bg-white text-[#5c5c5c]"
            }`}
          >
            <Icon size={14} />
            {label}
            {id === "reminders" && reminders.length ? (
              <span className="rounded-full bg-[#001730] px-1.5 text-[10px] text-white">{reminders.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "support" ? (
        <div className="rounded-xl border border-[#e6e2da] bg-white p-5">
          <p className="m-0 text-sm font-semibold text-[#001730]">
            {isAr ? "خيط دعم Hukum" : "Hukum support thread"}
          </p>
          <p className="mt-1 mb-4 text-xs text-[#8a8a8a]">
            {isAr
              ? "نزاعات، تحقق، وتوريد concierge — يظهر SLA ويمكن تسليم السياق لوكيل آخر."
              : "Disputes, verification, concierge sourcing — SLA visible; agents hand over with full context."}
          </p>
          <button type="button" className="btn-primary text-sm" disabled={busy} onClick={() => void openSupport()}>
            {isAr ? "فتح تذكرة دعم" : "Open support ticket"}
          </button>
          <p className="mt-3 mb-0 text-[11px] text-[#8a8a8a]">
            <a href={`${linkBase}/tickets`} className="text-[#0F766E]">
              {isAr ? "عرض التذاكر" : "View tickets"}
            </a>
            {" · "}
            {/* API export endpoint — not an App Router page */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/privacy?resource=export" className="text-[#0F766E]">
              {isAr ? "تصدير PDPL" : "PDPL export"}
            </a>
          </p>
        </div>
      ) : null}

      {tab === "reminders" ? (
        <div className="space-y-2">
          {reminders.length === 0 ? (
            <p className="rounded-xl border border-[#e6e2da] bg-white p-6 text-sm text-[#8a8a8a]">
              {isAr ? "لا تذكيرات لعروض الأسعار حالياً." : "No quotation lifecycle reminders right now."}
            </p>
          ) : (
            reminders.map((r) => (
              <a
                key={r.id}
                href={r.href?.startsWith("/dashboard") ? r.href : `${linkBase}${r.href || ""}`}
                className={`block rounded-xl border px-4 py-3 no-underline ${severityClass(r.severity)}`}
              >
                <p className="m-0 text-sm font-semibold">{r.title}</p>
                <p className="m-0 mt-1 text-xs opacity-90">{r.body}</p>
              </a>
            ))
          )}
        </div>
      ) : null}

      {tab === "agent" ? (
        <div className="overflow-hidden rounded-xl border border-[#e6e2da] bg-white">
          <div className="flex items-center gap-2 border-b border-[#e6e2da] bg-[#001730] px-4 py-3 text-white">
            <Sparkles size={16} className="text-[#c9a962]" />
            <div>
              <p className="m-0 text-sm font-semibold">
                {role === "buyer"
                  ? isAr
                    ? "وكيل المشتري — المتطلبات والعروض"
                    : "Buyer agent — requirements & quotes"
                  : isAr
                    ? "وكيل البائع — صياغة العروض"
                    : "Seller agent — quotation drafts"}
              </p>
              <p className="m-0 text-[11px] text-white/70">
                {isAr ? "يساعد ولا يرسل نيابة عنك" : "Assists — never auto-sends"}
              </p>
            </div>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto bg-[#fafafa] p-3">
            {agentMsgs.length === 0 ? (
              <p className="m-0 text-sm text-[#8a8a8a]">
                {role === "buyer"
                  ? isAr
                    ? "مثال: ساعدني بصياغة RFQ لمعدات سلامة لموقع في الرياض."
                    : "e.g. Help me draft an RFQ for safety PPE for a Riyadh site."
                  : isAr
                    ? "مثال: اقترح سعر ومهلة لدعوة RFQ هذه."
                    : "e.g. Suggest price and lead time for this RFQ invite."}
              </p>
            ) : null}
            {agentMsgs.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-8 bg-[#001730] text-white" : "mr-8 border border-[#e6e2da] bg-white"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
          {agentDraft ? (
            <div className="border-t border-[#e6e2da] bg-[#fffdf8] px-4 py-3 text-xs">
              <p className="m-0 font-semibold text-[#001730]">{isAr ? "مسودة مقترحة" : "Suggested draft"}</p>
              <pre className="m-0 mt-1 overflow-x-auto whitespace-pre-wrap text-[#4a4a4a]">
                {JSON.stringify(agentDraft, null, 2)}
              </pre>
            </div>
          ) : null}
          <form onSubmit={askAgent} className="flex gap-2 border-t border-[#e6e2da] p-3">
            <input
              className="min-w-0 flex-1 rounded-lg border border-[#e6e2da] bg-[#f8f8f8] px-3 py-2 text-sm"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              placeholder={isAr ? "اسأل الوكيل…" : "Ask the agent…"}
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !agentInput.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#001730] text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}

      {tab === "inbox" ? (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-xl border border-[#e6e2da] bg-white">
            <div className="flex flex-wrap gap-1 border-b border-[#e6e2da] p-2">
              {[
                ["", isAr ? "الكل" : "All"],
                ["buyer_supplier", isAr ? "مورد" : "Supplier"],
                ["support", isAr ? "دعم" : "Support"],
                ["ai_assistant", "AI"],
              ].map(([id, label]) => (
                <button
                  key={id || "all"}
                  type="button"
                  onClick={() => setFilterType(id)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    filterType === id ? "bg-[#001730] text-white" : "bg-[#f4f4f2] text-[#5c5c5c]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="m-0 max-h-[420px] list-none overflow-y-auto p-0">
              {conversations.length === 0 ? (
                <li className="p-4 text-sm text-[#8a8a8a]">
                  {isAr
                    ? "لا محادثات بعد. ابدأ من صفحة العرض أو افتح دعم Hukum."
                    : "No threads yet. Start from a quotation or open Hukum support."}
                </li>
              ) : (
                conversations.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c._id)}
                      className={`w-full border-b border-[#f0eeea] px-3 py-3 text-start ${
                        activeId === c._id ? "bg-[#c9a962]/12" : "bg-white hover:bg-[#fafafa]"
                      }`}
                    >
                      <p className="m-0 truncate text-sm font-medium text-[#001730]">{threadLabel(c)}</p>
                      <p className="m-0 mt-0.5 truncate text-[11px] text-[#8a8a8a]">
                        {c.lastMessagePreview ||
                          (c.lastMessageAt || c.updatedAt
                            ? new Date(c.lastMessageAt || c.updatedAt!).toLocaleString(locale)
                            : "")}
                      </p>
                      <p className="m-0 mt-1 text-[10px] uppercase tracking-wide text-[#c9a962]">
                        {c.threadType?.replace(/_/g, " ") || "thread"}
                        {c.whatsapp?.linkedPhone ? " · WA" : ""}
                        {c.contactGate?.contactsShared ? " · contacts" : ""}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>

          <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-[#e6e2da] bg-white">
            {!activeId ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#8a8a8a]">
                {isAr ? "اختر محادثة لعرض الرسائل." : "Select a conversation to view messages."}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6e2da] px-3 py-2">
                  <div>
                    <p className="m-0 text-sm font-semibold text-[#001730]">
                      {threadLabel(activeMeta || { _id: activeId })}
                    </p>
                    {slaText ? (
                      <p className="m-0 text-[11px] text-[#0F766E]">
                        {slaText}
                        {activeMeta?.sla?.status ? ` · ${activeMeta.sla.status}` : ""}
                      </p>
                    ) : null}
                    {typingLabel ? <p className="m-0 text-[11px] text-[#c9a962]">{typingLabel}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#e6e2da] px-2 py-1 text-[11px]"
                      onClick={() => setShowTranslation((v) => !v)}
                      title="AR ↔ EN"
                    >
                      <Languages size={12} />
                      {showTranslation ? (isAr ? "ترجمة ON" : "Translate ON") : isAr ? "ترجمة" : "Translate"}
                    </button>
                    {activeMeta?.threadType === "buyer_supplier" && !activeMeta.contactGate?.contactsShared ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#e6e2da] px-2 py-1 text-[11px]"
                        disabled={busy}
                        onClick={() => void revealContacts()}
                      >
                        <Shield size={12} />
                        {isAr ? "كشف التواصل" : "Reveal contacts"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-[#e6e2da] px-2 py-1 text-[11px] text-red-700"
                      disabled={busy}
                      onClick={() => void reportThread()}
                    >
                      {isAr ? "بلاغ" : "Report"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-800"
                      disabled={busy}
                      onClick={() => void blockThread()}
                    >
                      {isAr ? "حظر" : "Block"}
                    </button>
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto bg-[#fafafa] p-3">
                  {messages.map((m) => {
                    const isSystem = m.senderRole === "system" || m.kind === "system";
                    const isQuote = m.kind === "quote_card";
                    return (
                      <div
                        key={m._id}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          isSystem
                            ? "border-dashed border-[#c9a962]/50 bg-[#fffdf8] text-[#5c4a1f]"
                            : isQuote
                              ? "border-[#0F766E]/30 bg-[#f0fdfa]"
                              : "border-[#e6e2da] bg-white"
                        }`}
                      >
                        {m.channel === "whatsapp" ? (
                          <p className="m-0 mb-1 text-[10px] font-bold uppercase text-[#25D366]">WhatsApp</p>
                        ) : null}
                        <p className="m-0 whitespace-pre-wrap text-[#1a1612]">{m.body}</p>
                        {showTranslation && m.bodyTranslated ? (
                          <p className="m-0 mt-1 border-t border-[#eee] pt-1 text-xs text-[#6b6b6b]">
                            {m.bodyTranslated}
                          </p>
                        ) : null}
                        {isQuote && m.meta?.quote ? (
                          <pre className="m-0 mt-1 overflow-x-auto text-[10px] text-[#0F766E]">
                            {JSON.stringify(m.meta.quote, null, 2)}
                          </pre>
                        ) : null}
                        <p className="m-0 mt-1 text-[10px] text-[#8a8a8a]">
                          {m.createdAt ? new Date(m.createdAt).toLocaleString(locale) : ""}
                          {m.readBy && m.readBy.length > 1 ? (isAr ? " · مقروء" : " · Read") : ""}
                          {m.moderationStatus === "flagged" ? (isAr ? " · مُراجع" : " · Flagged") : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#e6e2da] p-3">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-[#e6e2da] bg-[#f8f8f8] px-3 py-2 text-sm"
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder={
                      activeMeta?.whatsapp?.optOut
                        ? isAr
                          ? "واتساب متوقف — رسالة داخل التطبيق فقط"
                          : "WA opted out — in-app only"
                        : isAr
                          ? "اكتب رسالة…"
                          : "Type a message…"
                    }
                    disabled={busy}
                  />
                  <button
                    type="submit"
                    disabled={busy || !text.trim()}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#001730] px-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Send size={14} />
                    {isAr ? "إرسال" : "Send"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
