"use client";

// Report a concern: pick what it's about, point at the page, say what happened. Sent through the contact
// API (the old form opened the visitor's email app, which most people abandoned).

import { useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, MessageSquare, Package, Store } from "lucide-react";

const TYPES = [
  { v: "supplier", icon: Store, en: "A supplier", ar: "مورد", hintEn: "Fake company, wrong details, no-show", hintAr: "شركة وهمية، بيانات خاطئة، عدم التزام" },
  { v: "listing", icon: Package, en: "A product listing", ar: "منتج معروض", hintEn: "Counterfeit, misleading or restricted item", hintAr: "مقلد أو مضلل أو ممنوع" },
  { v: "payment", icon: CreditCard, en: "Payment or fraud", ar: "دفع أو احتيال", hintEn: "Asked to pay a different account, scam attempt", hintAr: "طلب تحويل لحساب مختلف، محاولة احتيال" },
  { v: "message", icon: MessageSquare, en: "A message", ar: "رسالة", hintEn: "Spam, abuse or pressure", hintAr: "إزعاج أو إساءة أو ضغط" },
];

export function ReportForm({ locale, prefillRef = "" }: { locale: string; prefillRef?: string }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const [type, setType] = useState("");
  const [f, setF] = useState({ ref: prefillRef, what: "", name: "", email: "" });
  const [state, setState] = useState<{ busy: boolean; ref?: string; error?: string }>({ busy: false });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) {
      setState({ busy: false, error: L("Choose what the report is about.", "اختر موضوع البلاغ.") });
      return;
    }
    setState({ busy: true });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: f.name.trim(),
          companyName: "—",
          email: f.email.trim(),
          subject: `Report: ${type}`,
          message: `${f.what.trim()}${f.ref.trim() ? `\n\nReference: ${f.ref.trim()}` : ""}`,
          enquiryType: "general",
          locale,
          extras: { report: type, reference: f.ref.trim() },
        }),
      });
      const j = (await res.json()) as { success?: boolean; data?: { reference?: string }; message?: string };
      if (!j.success) throw new Error(j.message || "failed");
      setState({ busy: false, ref: j.data?.reference || "sent" });
    } catch (err) {
      setState({ busy: false, error: (err as Error).message === "Invalid email" ? L("Check the email address.", "تأكد من البريد.") : L("We couldn't send it. Email support@hukum.sa instead.", "ما قدرنا نرسله. راسل support@hukum.sa.") });
    }
  }

  if (state.ref) {
    return (
      <div className="rpt-done" role="status">
        <CheckCircle2 size={30} aria-hidden />
        <b>{L("Report received", "وصلنا البلاغ")}</b>
        <p>{L("We review it within working hours and may contact you for details. If you shared payment details with anyone, call your bank now.", "نراجعه خلال ساعات العمل وقد نتواصل معك للتفاصيل. إذا شاركت بيانات دفع مع أحد، كلّم بنكك الآن.")}</p>
        {state.ref !== "sent" ? <small>{L("Reference", "المرجع")} <span dir="ltr">{state.ref}</span></small> : null}
      </div>
    );
  }

  return (
    <form className="rpt-form" onSubmit={submit}>
      <fieldset className="rpt-types">
        <legend>{L("What is it about?", "وش موضوع البلاغ؟")}</legend>
        {TYPES.map((t) => (
          <label key={t.v} className={type === t.v ? "is-on" : ""}>
            <input type="radio" name="type" value={t.v} checked={type === t.v} onChange={() => setType(t.v)} />
            <span className="rpt-types__icon" aria-hidden><t.icon size={18} /></span>
            <b>{isAr ? t.ar : t.en}</b>
            <small>{isAr ? t.hintAr : t.hintEn}</small>
          </label>
        ))}
      </fieldset>
      <label className="cnc-field">
        <span>{L("Page link or reference", "رابط الصفحة أو الرقم المرجعي")} <small>{L("optional", "اختياري")}</small></span>
        <input dir="ltr" value={f.ref} onChange={set("ref")} placeholder={L("Supplier page, product page or request number", "صفحة المورد أو المنتج أو رقم الطلب")} />
      </label>
      <label className="cnc-field">
        <span>{L("What happened?", "وش صار؟")}</span>
        <textarea required rows={5} value={f.what} onChange={set("what")} placeholder={L("Dates, names and what was said. Never include passwords or card numbers.", "التواريخ والأسماء وش انقال. لا تكتب كلمات مرور أو أرقام بطاقات.")} />
      </label>
      <div className="rpt-two">
        <label className="cnc-field">
          <span>{L("Your name", "اسمك")}</span>
          <input required autoComplete="name" value={f.name} onChange={set("name")} />
        </label>
        <label className="cnc-field">
          <span>{L("Email for follow-up", "بريدك للمتابعة")}</span>
          <input required type="email" dir="ltr" autoComplete="email" value={f.email} onChange={set("email")} />
        </label>
      </div>
      {state.error ? <p className="cnc-error" role="alert"><AlertTriangle size={15} aria-hidden /> {state.error}</p> : null}
      <button type="submit" className="cnc-submit" disabled={state.busy}>{state.busy ? L("Sending…", "جارٍ الإرسال…") : L("Send report", "أرسل البلاغ")}</button>
    </form>
  );
}
