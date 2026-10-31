"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, PackageSearch, Send, Sparkles, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  href: string;
  image?: string;
  priceLabel: string;
  vendorName?: string;
  location?: string;
  snippet?: string;
};

type QuoteCard = {
  id: string;
  vendorLabel: string;
  unitPrice: number;
  landedPerUnit: number;
  currency: string;
  leadTime: string;
  total: number;
  recommended?: boolean;
};

type ChatAction = { id: string; label: string };

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: { label: string; href: string }[];
  products?: ProductCard[];
  quoteCards?: QuoteCard[];
  followUps?: string[];
  actions?: ChatAction[];
  step?: string;
};

const QUICK = {
  en: [
    { label: "Helmets Riyadh", text: "I need 100 safety helmets in Riyadh" },
    { label: "Compare", text: "Compare top picks" },
    { label: "Message suppliers", text: "Message 3 suppliers" },
    { label: "PDPL consent", text: "I consent to PDPL" },
  ],
  ar: [
    { label: "خوذات الرياض", text: "أحتاج 100 خوذة سلامة في الرياض" },
    { label: "قارن", text: "قارن الأفضل" },
    { label: "راسل الموردين", text: "راسل 3 موردين" },
    { label: "موافقة PDPL", text: "موافق على PDPL" },
  ],
} as const;

const SESSION_KEY = "kt_hukum_session_v1";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mediaSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/${url}`;
}

export function CustomerChatbot({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [step, setStep] = useState("start");
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: isAr
        ? "مرحباً — أنا وكيل Hukum. صف احتياجك (منتج، كمية، مدينة) وسأطابق القوائم الحية، أقارن، وأراسل الموردين بعد موافقتك فقط."
        : "Hi — I’m the Hukum agent. Describe your need (product, qty, city). I’ll match live listings, compare, and message suppliers only after you approve.",
      followUps: QUICK[isAr ? "ar" : "en"].map((q) => q.text),
      step: "start",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const sid = localStorage.getItem(SESSION_KEY);
      if (sid) setSessionId(sid);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    inputRef.current?.focus();
  }, [open, messages, busy]);

  async function send(text: string, action?: string) {
    const message = text.trim();
    if ((!message && !action) || busy) return;
    setInput("");
    if (message) {
      const userMsg: ChatMsg = { id: uid(), role: "user", content: message };
      setMessages((prev) => [...prev, userMsg]);
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: message || action,
          action,
          locale,
          sessionId: sessionId || undefined,
          channel: "web",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Chat failed");
      if (json.data?.sessionId) {
        setSessionId(json.data.sessionId);
        try {
          localStorage.setItem(SESSION_KEY, json.data.sessionId);
        } catch {
          /* ignore */
        }
      }
      if (json.data?.step) setStep(String(json.data.step));
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: json.data?.reply || (isAr ? "عذراً، حاول مرة أخرى." : "Sorry, please try again."),
          links: Array.isArray(json.data?.suggestedLinks) ? json.data.suggestedLinks : undefined,
          products: Array.isArray(json.data?.products) ? json.data.products : undefined,
          quoteCards: Array.isArray(json.data?.quoteCards) ? json.data.quoteCards : undefined,
          followUps: Array.isArray(json.data?.followUps) ? json.data.followUps : undefined,
          actions: Array.isArray(json.data?.actions) ? json.data.actions : undefined,
          step: json.data?.step,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: (err as Error).message || (isAr ? "تعذر الرد الآن." : "Could not reply right now."),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kt-customer-chat pointer-events-none fixed bottom-5 end-5 z-[55] flex flex-col items-end gap-3">
      {open ? (
        <div
          className="pointer-events-auto flex h-[min(78vh,620px)] w-[min(94vw,420px)] flex-col overflow-hidden rounded-2xl border border-[#e6e2da] bg-white shadow-[0_20px_50px_rgba(0,23,48,0.22)]"
          role="dialog"
          aria-label={isAr ? "وكيل Hukum" : "Hukum agent"}
        >
          <div className="flex items-center justify-between gap-2 bg-[#001730] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c9a962]/20 text-[#c9a962]">
                <PackageSearch size={18} />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold">{isAr ? "وكيل Hukum" : "Hukum agent"}</p>
                <p className="m-0 flex items-center gap-1 text-[11px] text-white/70">
                  <Sparkles size={11} className="text-[#c9a962]" />
                  {isAr ? `الخطوة: ${step}` : `Step: ${step}`}
                  <span className="text-white/40">·</span>
                  {isAr ? "ذاكرة محفوظة" : "Memory on"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-[10px] font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                disabled={busy}
                title={isAr ? "مسح الذاكرة" : "Clear memory"}
                onClick={() => {
                  void (async () => {
                    await send("", "clear_memory");
                    setMessages([
                      {
                        id: uid(),
                        role: "assistant",
                        content: isAr
                          ? "تم مسح الذاكرة. صف احتياجك من جديد."
                          : "Memory cleared. Describe your need again.",
                        followUps: QUICK[isAr ? "ar" : "en"].map((q) => q.text),
                        step: "start",
                      },
                    ]);
                    setStep("start");
                  })();
                }}
              >
                {isAr ? "مسح" : "Clear"}
              </button>
              <button
                type="button"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label={isAr ? "إغلاق" : "Close"}
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f7f7f5] px-3 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-ee-md bg-[#001730] text-white"
                      : "rounded-es-md border border-[#e6e2da] bg-white text-[#1a1612]"
                  )}
                >
                  <p className="m-0 whitespace-pre-wrap">{m.content}</p>

                  {m.products?.length ? (
                    <div className="mt-2.5 space-y-2">
                      {m.products.map((p) => (
                        <a
                          key={p.id}
                          href={p.href}
                          className="flex gap-2.5 overflow-hidden rounded-xl border border-[#e6e2da] bg-[#fafafa] p-2 no-underline transition hover:border-[#c9a962]/70 hover:bg-white"
                        >
                          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#eee]">
                            {p.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={mediaSrc(p.image)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[#aaa]">
                                <PackageSearch size={18} />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[#001730]">
                              {p.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-[#c9a962]">
                              {p.priceLabel}
                            </span>
                            {p.vendorName || p.location || p.snippet ? (
                              <span className="mt-0.5 block truncate text-[10px] text-[#8a8a8a]">
                                {[p.vendorName, p.location, p.snippet].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {m.quoteCards?.length ? (
                    <div className="mt-2.5 space-y-2">
                      {m.quoteCards.map((q) => (
                        <div
                          key={q.id}
                          className={`rounded-xl border p-2.5 text-[11px] ${
                            q.recommended ? "border-[#1b7a3d] bg-[#e8f6ee]" : "border-[#e6e2da] bg-[#fafafa]"
                          }`}
                        >
                          <p className="m-0 font-semibold text-[#001730]">
                            {q.vendorLabel}
                            {q.recommended ? (isAr ? " ★ موصى" : " ★ recommended") : ""}
                          </p>
                          <p className="mt-1 mb-0 text-[#5c5c5c]">
                            {isAr ? "وحدة" : "Unit"} {q.unitPrice} · {isAr ? "نهائي" : "Landed"}{" "}
                            {q.landedPerUnit} {q.currency} · {q.leadTime}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {m.links?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <a
                          key={l.href + l.label}
                          href={l.href}
                          className="inline-flex rounded-full border border-[#c9a962]/45 bg-[#c9a962]/10 px-2.5 py-1 text-[11px] font-semibold text-[#001730] hover:bg-[#c9a962]/20"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {m.actions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.actions.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          disabled={busy}
                          onClick={() => void send(a.label, a.id)}
                          className="rounded-full border border-[#001730]/25 bg-[#001730] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {m.role === "assistant" && m.followUps?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.followUps.slice(0, 4).map((f) => (
                        <button
                          key={f}
                          type="button"
                          disabled={busy}
                          onClick={() => void send(f)}
                          className="rounded-full border border-[#e6e2da] bg-[#f3f3f1] px-2.5 py-1 text-start text-[11px] font-medium text-[#001730] hover:border-[#c9a962]/55 disabled:opacity-50"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <p className="m-0 px-1 text-xs text-[#8a8a8a]">
                {isAr ? "Hukum يعمل…" : "Hukum is thinking…"}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-[#e6e2da] bg-white px-3 py-2">
            {QUICK[isAr ? "ar" : "en"].map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={busy}
                onClick={() => void send(q.text)}
                className="rounded-full border border-[#e6e2da] bg-[#f8f8f8] px-2.5 py-1 text-[11px] font-medium text-[#001730] hover:border-[#c9a962]/60 disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-[#e6e2da] bg-white px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isAr ? "مثال: 100 خوذة سلامة للرياض…" : "e.g. 100 safety helmets for Riyadh…"
              }
              className="min-w-0 flex-1 rounded-xl border border-[#e6e2da] bg-[#f8f8f8] px-3 py-2.5 text-sm outline-none focus:border-[#c9a962]"
              disabled={busy}
              maxLength={4000}
              dir={isAr ? "rtl" : "ltr"}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001730] text-white hover:bg-[#002d52] disabled:opacity-40"
              aria-label={isAr ? "إرسال" : "Send"}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="pointer-events-auto inline-flex h-14 items-center gap-2 rounded-full bg-[#001730] px-4 text-white shadow-[0_12px_30px_rgba(0,23,48,0.35)] transition hover:bg-[#002d52] sm:w-auto"
        aria-label={open ? (isAr ? "إغلاق المحادثة" : "Close chat") : isAr ? "اسأل Hukum" : "Ask Hukum"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X size={22} />
        ) : (
          <>
            <MessageCircle size={22} strokeWidth={1.75} />
            <span className="hidden text-sm font-semibold sm:inline">
              {isAr ? "اسأل Hukum" : "Ask Hukum"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
