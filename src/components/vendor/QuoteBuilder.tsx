"use client";

// One request, from the supplier's side: what the buyer needs, and a quote form priced line by line with
// VAT, delivery, lead time, payment terms and validity. Sends to POST /api/quotations (existing API).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, Mail, MapPin, MessageCircle, Phone, Send, Trophy, X } from "lucide-react";
import { formatMoney, unitLabel } from "@/lib/money";
import { cityName } from "@/lib/cities";
import { ask, toast } from "@/components/ui/Feedback";

type Item = { name?: { en?: string; ar?: string }; quantity?: number; unit?: string; specifications?: string };
type Rfq = {
  _id: string;
  title?: { en?: string };
  description?: { en?: string };
  items?: Item[];
  deliveryLocation?: { city?: string };
  deliveryDate?: string;
  deadline?: string;
  paymentTerms?: string;
  additionalRequirements?: string;
};
type Quote = { _id: string; status?: string; total?: number; lines?: Array<{ name?: string; quantity?: number; unitPrice?: number }>; leadTime?: string; paymentTerms?: string; validity?: string; buyerNote?: string };

const VAT = 0.15;
const TERMS = [
  { en: "Cash on delivery", ar: "الدفع عند الاستلام" },
  { en: "30% advance, balance on delivery", ar: "30% مقدّم والباقي عند الاستلام" },
  { en: "Net 30", ar: "صافي 30 يوماً" },
  { en: "Net 60", ar: "صافي 60 يوماً" },
];
const STATUS: Record<string, { en: string; ar: string }> = {
  submitted: { en: "Sent, buyer is comparing", ar: "تم الإرسال، المشتري يقارن" },
  revised: { en: "Revised, buyer is comparing", ar: "تم التعديل، المشتري يقارن" },
  clarifying: { en: "Buyer asked a question", ar: "المشتري سأل سؤالاً" },
  shortlisted: { en: "Shortlisted", ar: "في القائمة المختصرة" },
  accepted: { en: "Accepted: the buyer will contact you", ar: "تم القبول: المشتري بيتواصل معك" },
  deal_confirmed: { en: "Deal confirmed", ar: "تم تأكيد الصفقة" },
  rejected: { en: "Not chosen this time", ar: "لم يُختر هذه المرة" },
};

export function QuoteBuilder({ locale, rfqId, nextHref }: { locale: string; rfqId: string; nextHref?: string }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const router = useRouter();
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [mine, setMine] = useState<Quote | null>(null);
  const [buyer, setBuyer] = useState<{ name?: string; company?: string; phone?: string; email?: string } | null>(null);
  const [error, setError] = useState("");
  const [prices, setPrices] = useState<string[]>([]);
  const [vatIncluded, setVatIncluded] = useState(false);
  const [delivery, setDelivery] = useState("");
  const [lead, setLead] = useState("");
  const [terms, setTerms] = useState(TERMS[1].en);
  const [validity, setValidity] = useState(new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off = false;
    setRfq(null);
    setMine(null);
    setError("");
    fetch(`/api/rfqs?id=${encodeURIComponent(rfqId)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (off) return;
        if (!j.success) throw new Error(j.message || "Not found");
        setRfq(j.data.rfq);
        setPrices((j.data.rfq.items || []).map(() => ""));
        const q = (j.data.quotations || [])[0] as Quote | undefined;
        setMine(q || null);
        setBuyer(j.data.buyerContact || null);
        // Opening the request tells the buyer side it was seen (invite: invited → viewed).
        if (!q) void fetch("/api/rfqs", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "vendor_respond", rfqId, status: "viewed" }) });
      })
      .catch((e) => !off && setError((e as Error).message));
    return () => {
      off = true;
    };
  }, [rfqId]);

  const items = rfq?.items || [];
  const lineTotals = items.map((it, i) => (Number(prices[i]) || 0) * (it.quantity || 1));
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  const ship = Number(delivery) || 0;
  const tax = vatIncluded ? 0 : Math.round((subtotal + ship) * VAT * 100) / 100;
  const total = subtotal + ship + tax;
  const ready = items.length > 0 && items.every((_, i) => Number(prices[i]) > 0) && lead.trim();
  const requestNotes = useMemo(
    () => String(rfq?.additionalRequirements || "").split("\n").map((l) => l.trim()).filter((l) => l && !/^(request type|intent)\s*:/i.test(l)),
    [rfq]
  );

  async function send() {
    if (!ready || !rfq || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: rfq._id,
          lines: items.map((it, i) => ({ name: it.name?.en || "", quantity: it.quantity || 1, unitPrice: Number(prices[i]), total: lineTotals[i] })),
          tax,
          shipping: ship,
          currency: "SAR",
          vatIncluded,
          leadTime: lead.trim(),
          deliveryTime: lead.trim(),
          paymentTerms: terms,
          validity,
          notes: [vatIncluded ? "Prices include VAT." : "", notes.trim()].filter(Boolean).join("\n"),
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "failed");
      setMine(j.data as Quote);
      toast(L("Quote sent. We'll let you know when the buyer responds.", "تم إرسال العرض، ونبلغك برد المشتري."));
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    const r = await ask({
      title: L("Pass on this request?", "تعتذر عن هذا الطلب؟"),
      body: L("The buyer won't see your company for this request. It helps us send you better matches.", "المشتري ما يشوف شركتك في هذا الطلب، ويساعدنا نرسل لك طلبات أنسب."),
      confirmLabel: L("Pass", "اعتذر"),
      tone: "danger",
      reason: { label: L("Why? (optional)", "السبب (اختياري)"), presets: isAr ? ["لا نوفر هذا المنتج", "الكمية صغيرة", "خارج مدن التوصيل", "الموعد قريب جداً"] : ["We don't sell this", "Quantity too small", "Outside our delivery area", "Deadline too close"] },
    });
    if (!r.ok) return;
    await fetch("/api/rfqs", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "vendor_respond", rfqId, status: "declined", reason: r.reason }) });
    toast(L("Request passed", "تم الاعتذار عن الطلب"), "info");
    router.push(`/${locale}/vendor/rfqs`);
    router.refresh();
  }

  if (error) return <div className="qb"><p className="pdp2-empty">{L("This request isn't available.", "هذا الطلب غير متاح.")}</p></div>;
  if (!rfq) return <div className="qb"><div className="skeleton" style={{ height: 320, borderRadius: 18 }} /></div>;

  const date = (iso?: string): string => (iso ? new Date(iso).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
  const status = mine?.status ? STATUS[mine.status] : null;

  return (
    <div className="qb" dir={isAr ? "rtl" : "ltr"}>
      <Link href={`/${locale}/vendor/rfqs`} className="qb-back"><ArrowLeft size={15} aria-hidden /> {L("All requests", "كل الطلبات")}</Link>
      <header className="qb-head">
        <h2>{items.length > 1 ? L(`${items.length} items`, `${items.length} بنود`) : items[0]?.name?.en || rfq.title?.en}</h2>
        <p className="qb-meta">
          {rfq.deliveryLocation?.city ? <span><MapPin size={14} aria-hidden /> {L(`Deliver to ${cityName(rfq.deliveryLocation.city, locale)}`, `التوصيل إلى ${cityName(rfq.deliveryLocation.city, locale)}`)}</span> : null}
          {rfq.deliveryDate ? <span><CalendarClock size={14} aria-hidden /> {L(`Needed by ${date(rfq.deliveryDate)}`, `مطلوب قبل ${date(rfq.deliveryDate)}`)}</span> : null}
          {rfq.deadline ? <span className="vh-due">{L(`Quotes due ${date(rfq.deadline)}`, `آخر موعد ${date(rfq.deadline)}`)}</span> : null}
        </p>
        {rfq.description?.en && rfq.description.en !== items[0]?.name?.en ? <p className="qb-desc">{rfq.description.en}</p> : null}
        {requestNotes.length ? <ul className="qb-notes">{requestNotes.slice(0, 6).map((n) => <li key={n}>{n}</li>)}</ul> : null}
      </header>

      {mine && ["accepted", "deal_confirmed", "reviewed"].includes(mine.status || "") ? (
        <section className="qb-won" aria-labelledby="qb-won">
          <span className="qb-won__icon"><Trophy size={22} aria-hidden /></span>
          <div className="qb-won__body">
            <h3 id="qb-won">{L("You won this request", "فزت بهذا الطلب")}</h3>
            <p>{L(`The buyer accepted your quote of ${formatMoney(Number(mine.total || 0), locale)}. Contact them to confirm the order, delivery and payment.`, `المشتري قبل عرضك بقيمة ${formatMoney(Number(mine.total || 0), locale)}. تواصل معه لتأكيد الطلب والتوصيل والدفع.`)}</p>
            {buyer && (buyer.name || buyer.company || buyer.phone || buyer.email) ? (
              <dl className="qb-won__who">
                {buyer.name || buyer.company ? <div><dt>{L("Buyer", "المشتري")}</dt><dd>{[buyer.name, buyer.company].filter(Boolean).join(" · ")}</dd></div> : null}
                {buyer.phone ? <div><dt>{L("Mobile", "الجوال")}</dt><dd dir="ltr">{buyer.phone}</dd></div> : null}
                {buyer.email ? <div><dt>{L("Email", "البريد")}</dt><dd dir="ltr">{buyer.email}</dd></div> : null}
              </dl>
            ) : null}
            <div className="qb-won__act">
              {buyer?.phone ? <a className="qb-send" href={`tel:${buyer.phone.replace(/[^\d+]/g, "")}`}><Phone size={16} aria-hidden /> {L("Call the buyer", "اتصل بالمشتري")}</a> : null}
              {buyer?.phone ? <a className="bh-btn" href={`https://wa.me/${buyer.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden /> WhatsApp</a> : null}
              {buyer?.email ? <a className="bh-btn" href={`mailto:${buyer.email}`}><Mail size={16} aria-hidden /> {L("Email", "إيميل")}</a> : null}
              <Link className="bh-btn" href={`/${locale}/vendor/messages`}>{L("Messages", "الرسائل")}</Link>
            </div>
          </div>
        </section>
      ) : mine ? (
        <section className="qb-sent">
          <CheckCircle2 size={22} aria-hidden />
          <div>
            <b>{status ? (isAr ? status.ar : status.en) : L("Quote sent", "تم إرسال العرض")}</b>
            <p>{L("Your quote", "عرضك")}: <strong>{formatMoney(Number(mine.total || 0), locale)}</strong>{mine.leadTime ? ` · ${mine.leadTime}` : ""}</p>
            {mine.buyerNote ? (
              <p className="qb-buyer-note">
                <b>{mine.status === "clarifying" ? L("The buyer asks", "المشتري يسأل") : L("Buyer's note", "ملاحظة المشتري")}</b>
                {mine.buyerNote}
              </p>
            ) : null}
            {mine.status === "clarifying" ? <p className="qb-hint">{L("Reply from Messages so the buyer sees it with your quote.", "رد من الرسائل عشان يشوفه المشتري مع عرضك.")}</p> : null}
            {nextHref ? <Link href={nextHref} className="qb-next">{L("Next request", "الطلب التالي")} <ArrowRight size={15} aria-hidden /></Link> : null}
          </div>
        </section>
      ) : (
        <section className="qb-form" aria-label={L("Your quote", "عرضك")}>
          <div className="qb-lines" role="table">
            <div className="qb-line qb-line--head" role="row">
              <span role="columnheader">{L("Item", "البند")}</span>
              <span role="columnheader">{L("Qty", "الكمية")}</span>
              <span role="columnheader">{L("Unit price", "سعر الوحدة")}</span>
              <span role="columnheader">{L("Line total", "إجمالي البند")}</span>
            </div>
            {items.map((it, i) => (
              <div key={i} className="qb-line" role="row">
                <span role="cell" className="qb-item"><b>{(isAr ? it.name?.ar || it.name?.en : it.name?.en) || "—"}</b>{it.specifications && !/^Quantity to confirm$/i.test(it.specifications) ? <small>{it.specifications}</small> : null}</span>
                <span role="cell" className="qb-num">{(it.quantity || 1).toLocaleString("en-US")} {unitLabel(it.unit, locale)}</span>
                <span role="cell">
                  <input aria-label={L(`Unit price for line ${i + 1}`, `سعر الوحدة للبند ${i + 1}`)} inputMode="decimal" value={prices[i] || ""} placeholder="0.00"
                    onChange={(e) => setPrices((p) => p.map((x, j) => (j === i ? e.target.value.replace(/[^\d.]/g, "") : x)))} />
                </span>
                <span role="cell" className="qb-num">{formatMoney(lineTotals[i], locale)}</span>
              </div>
            ))}
          </div>

          <div className="qb-grid">
            <label className="cnc-field"><span>{L("Lead time", "مدة التوريد")}</span><input value={lead} onChange={(e) => setLead(e.target.value)} placeholder={L("e.g. 5 days", "مثال: 5 أيام")} /></label>
            <label className="cnc-field"><span>{L("Delivery cost", "تكلفة التوصيل")} <small>{L("0 if free", "0 إذا مجاني")}</small></span><input inputMode="decimal" value={delivery} onChange={(e) => setDelivery(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" /></label>
            <label className="cnc-field"><span>{L("Valid until", "صالح حتى")}</span><input type="date" value={validity} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setValidity(e.target.value)} /></label>
            <fieldset className="cnc-field qb-terms"><legend>{L("Payment terms", "شروط الدفع")}</legend>
              <div className="cnc-chips">
                {TERMS.map((t) => (
                  <label key={t.en} className={terms === t.en ? "is-on" : ""}><input type="radio" name="terms" checked={terms === t.en} onChange={() => setTerms(t.en)} />{isAr ? t.ar : t.en}</label>
                ))}
              </div>
            </fieldset>
            <label className="cnc-field qb-wide"><span>{L("Note to the buyer", "ملاحظة للمشتري")} <small>{L("optional", "اختياري")}</small></span><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={L("Brand, warranty, stock available…", "العلامة، الضمان، المخزون المتوفر…")} /></label>
          </div>

          <div className="qb-total">
            <label className="qb-vat"><input type="checkbox" checked={vatIncluded} onChange={(e) => setVatIncluded(e.target.checked)} /> {L("My prices already include VAT", "أسعاري شاملة الضريبة")}</label>
            <dl>
              <div><dt>{L("Subtotal", "المجموع")}</dt><dd>{formatMoney(subtotal, locale)}</dd></div>
              <div><dt>{L("Delivery", "التوصيل")}</dt><dd>{ship ? formatMoney(ship, locale) : L("Free", "مجاني")}</dd></div>
              <div><dt>{L("VAT 15%", "الضريبة 15%")}</dt><dd>{vatIncluded ? L("Included", "مشمولة") : formatMoney(tax, locale)}</dd></div>
              <div className="is-total"><dt>{L("Total", "الإجمالي")}</dt><dd>{formatMoney(total, locale)}</dd></div>
            </dl>
          </div>

          <div className="qb-act">
            <button type="button" className="qb-send" disabled={!ready || busy} onClick={() => void send()}>
              <Send size={16} aria-hidden /> {busy ? L("Sending…", "جارٍ الإرسال…") : L("Send quote", "أرسل العرض")}
            </button>
            <button type="button" className="qb-pass" onClick={() => void decline()}><X size={15} aria-hidden /> {L("Pass on this request", "اعتذر عن الطلب")}</button>
            {!ready ? <p className="qb-hint">{L("Add a unit price for every line and a lead time to send.", "أضف سعراً لكل بند ومدة التوريد للإرسال.")}</p> : null}
          </div>
        </section>
      )}
    </div>
  );
}
