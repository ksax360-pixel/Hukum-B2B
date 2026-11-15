"use client";
// Support. Buyers and suppliers: pick what it's about, write it, see replies and status in one list.
// Admin: the queue, newest first, with status you can change in place.

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { BookOpen, CheckCircle2, ChevronDown, LifeBuoy, Send } from "lucide-react";
import { createTicket, listTickets, updateTicketStatus, type SupportTicket } from "@/lib/tickets";
import { toast } from "@/components/ui/Feedback";

type Role = "admin" | "vendor" | "buyer";
const TOPICS: Record<Exclude<Role, "admin">, Array<[string, string, string]>> = {
  vendor: [["Verification", "Verification", "التوثيق"], ["Catalog", "Products or catalogue", "المنتجات أو الكتالوج"], ["RFQ", "Requests and quotes", "الطلبات والعروض"], ["Account", "My account", "حسابي"], ["General", "Something else", "شي ثاني"]],
  buyer: [["RFQ", "A request or quote", "طلب أو عرض سعر"], ["Report", "A supplier or listing", "مورد أو منتج"], ["Account", "My account", "حسابي"], ["General", "Something else", "شي ثاني"]],
};
const STATUS_AR: Record<SupportTicket["status"], string> = { Open: "مفتوحة", "In Progress": "قيد المعالجة", Resolved: "تم الحل", Closed: "مغلقة" };

export function TicketDesk({ role }: { role: Role }) {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(role === "admin" ? "General" : TOPICS[role][0][0]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState("");

  const reload = async () => {
    try {
      setTickets(await listTickets());
    } catch {
      setTickets([]);
      toast(L("Couldn't load your messages. Refresh to try again.", "تعذّر تحميل رسائلك. حدّث الصفحة."), "error");
    }
  };
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !body.trim() || busy) return;
    setBusy(true);
    try {
      await createTicket({ topic: topic.trim(), category, urgency: "Medium", requester: "", body: body.trim(), roleScope: role });
      setTopic("");
      setBody("");
      toast(L("Sent. We reply here and by email.", "تم الإرسال. نرد هنا وبالإيميل."), "success");
      await reload();
    } catch (err) {
      toast((err as Error).message || L("Couldn't send. Try again.", "تعذّر الإرسال. حاول مرة ثانية."), "error");
    } finally {
      setBusy(false);
    }
  };

  const date = (iso: string): string => new Date(iso).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short" });
  const statusLabel = (s: SupportTicket["status"]): string => (isAr ? STATUS_AR[s] : s);
  const chip = (s: SupportTicket["status"]): string => (s === "Resolved" || s === "Closed" ? "won" : s === "In Progress" ? "question" : "quoted");

  const list = (
    <section className="sfe-card td-list" aria-labelledby="td-list">
      <h2 id="td-list" className="van-h">{role === "admin" ? L("Queue", "قائمة التذاكر") : L("Your messages", "رسائلك")}</h2>
      {tickets === null ? (
        <p className="van-note">{L("Loading…", "جارٍ التحميل…")}</p>
      ) : tickets.length === 0 ? (
        <p className="van-note">{role === "admin" ? L("Nothing in the queue.", "ما فيه تذاكر.") : L("Nothing yet. Anything you send shows here with its status.", "ما فيه شي بعد. أي رسالة ترسلها تظهر هنا مع حالتها.")}</p>
      ) : (
        <ul>
          {tickets.map((t) => (
            <li key={t.id} className={openId === t.id ? "is-open" : ""}>
              <button type="button" className="td-row" aria-expanded={openId === t.id} onClick={() => setOpenId(openId === t.id ? "" : t.id)}>
                <span className="td-row__main">
                  <b>{t.topic}</b>
                  <small>{t.id} · {date(t.createdAt)}{role === "admin" ? ` · ${t.requester} · ${t.category}` : ""}</small>
                </span>
                <span className={`vrq-chip is-${chip(t.status)}`}>{statusLabel(t.status)}</span>
                <ChevronDown size={16} aria-hidden className="td-row__chev" />
              </button>
              {openId === t.id ? (
                <div className="td-body">
                  <p>{t.body}</p>
                  {role === "admin" ? (
                    <label className="td-status">
                      {L("Status", "الحالة")}
                      <select
                        value={t.status}
                        onChange={async (e) => {
                          try {
                            setTickets(await updateTicketStatus(t.id, e.target.value as SupportTicket["status"]));
                          } catch {
                            toast(L("Couldn't update.", "تعذّر التحديث."), "error");
                          }
                        }}
                      >
                        {(["Open", "In Progress", "Resolved", "Closed"] as const).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  if (role === "admin") {
    return (
      <div className="bh td" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head"><div><h1>{L("Support", "الدعم")}</h1><p>{L("Questions from buyers and suppliers.", "أسئلة المشترين والموردين.")}</p></div></header>
        {list}
      </div>
    );
  }

  return (
    <div className="bh td" dir={isAr ? "rtl" : "ltr"}>
      <header className="bh-head">
        <div>
          <h1>{L("Help", "المساعدة")}</h1>
          <p>{L("Write to the Hukum team. A person reads every message.", "راسل فريق حكم. كل رسالة يقراها شخص.")}</p>
        </div>
        <Link href={`/${locale}/help`} className="bh-btn"><BookOpen size={15} aria-hidden /> {L("Help centre", "مركز المساعدة")}</Link>
      </header>

      <div className="td-body-grid">
        <form className="sfe-card td-form" onSubmit={submit} aria-labelledby="td-new">
          <div className="sfe-card__head">
            <h2 id="td-new"><LifeBuoy size={18} aria-hidden /> {L("New message", "رسالة جديدة")}</h2>
          </div>
          <fieldset className="sfe-field">
            <legend>{L("What is it about?", "عن وش؟")}</legend>
            <div className="td-topics">
              {TOPICS[role].map(([k, en, ar]) => (
                <label key={k} className={`td-topic${category === k ? " is-on" : ""}`}>
                  <input type="radio" name="td-topic" value={k} checked={category === k} onChange={() => setCategory(k)} />
                  {isAr ? ar : en}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="sfe-field">
            <span>{L("Subject", "الموضوع")}</span>
            <input maxLength={140} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={role === "vendor" ? L("e.g. My CR check is taking long", "مثلاً التحقق من السجل طوّل") : L("e.g. A supplier hasn't replied", "مثلاً المورد ما رد")} />
          </label>
          <label className="sfe-field">
            <span>{L("Message", "الرسالة")}</span>
            <textarea rows={6} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder={L("What happened, and any request or product link.", "وش صار، وأي رابط طلب أو منتج.")} />
          </label>
          <div className="sfe-act">
            <button type="submit" className="qb-send" disabled={busy || !topic.trim() || !body.trim()}><Send size={16} aria-hidden /> {busy ? L("Sending…", "جارٍ الإرسال…") : L("Send", "أرسل")}</button>
          </div>
          <p className="van-note td-safe"><CheckCircle2 size={14} aria-hidden /> {L("Never send passwords or bank details. Hukum will never ask for them.", "لا ترسل كلمات مرور أو بيانات بنكية. حكم ما يطلبها أبداً.")}</p>
        </form>
        {list}
      </div>
    </div>
  );
}
