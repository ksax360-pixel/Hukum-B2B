"use client";

// Concierge brief: the five things the sourcing team needs to start. Sent through the contact API
// as a buyer enquiry tagged "concierge" so it lands in the same inbox the team already works from.

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const TIMELINES = [
  { v: "this_week", en: "This week", ar: "هذا الأسبوع" },
  { v: "this_month", en: "This month", ar: "هذا الشهر" },
  { v: "planning", en: "Planning ahead", ar: "تخطيط مسبق" },
];

export function ConciergeIntake({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const [form, setForm] = useState({ fullName: "", companyName: "", email: "", phone: "", need: "", timeline: "this_month", budget: "" });
  const [state, setState] = useState<{ busy: boolean; ref?: string; error?: string }>({ busy: false });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.busy) return;
    setState({ busy: true });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          companyName: form.companyName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          country: "SA",
          subject: "VIP concierge request",
          message: form.need.trim(),
          enquiryType: "buyer",
          locale,
          extras: { service: "concierge", timeline: form.timeline, budget: form.budget.trim() },
        }),
      });
      const j = (await res.json()) as { success?: boolean; data?: { reference?: string; ref?: string }; message?: string; error?: string };
      if (!j.success) throw new Error(j.message || j.error || "failed");
      setState({ busy: false, ref: j.data?.reference || j.data?.ref || "sent" });
    } catch (err) {
      setState({ busy: false, error: (err as Error).message === "Invalid email" ? L("Check the email address.", "تأكد من البريد الإلكتروني.") : L("We couldn't send that. Try again or email buyers@hukum.sa.", "ما قدرنا نرسلها. جرّب مرة ثانية أو راسل buyers@hukum.sa.") });
    }
  }

  if (state.ref) {
    return (
      <div className="cnc-done" role="status">
        <CheckCircle2 size={28} aria-hidden />
        <b>{L("Brief received", "وصلنا الموجز")}</b>
        <p>{L("A sourcing lead will call you within working hours to agree the scope.", "مسؤول توريد يتصل عليك خلال ساعات العمل لتحديد النطاق.")}</p>
        {state.ref !== "sent" ? <small>{L("Reference", "المرجع")} <span dir="ltr">{state.ref}</span></small> : null}
      </div>
    );
  }

  return (
    <form className="cnc-form" onSubmit={submit}>
      <label className="cnc-field cnc-field--wide">
        <span>{L("What do you need sourced?", "وش تبي نوفّر لك؟")}</span>
        <textarea required rows={4} value={form.need} onChange={set("need")} placeholder={L("e.g. Fit-out for a 40-room hotel in Jeddah: furniture, lighting, kitchen equipment", "مثال: تجهيز فندق 40 غرفة في جدة: أثاث وإضاءة ومعدات مطبخ")} />
      </label>
      <fieldset className="cnc-field cnc-field--wide">
        <legend>{L("When do you need it?", "متى تحتاجه؟")}</legend>
        <div className="cnc-chips">
          {TIMELINES.map((t) => (
            <label key={t.v} className={form.timeline === t.v ? "is-on" : ""}>
              <input type="radio" name="timeline" value={t.v} checked={form.timeline === t.v} onChange={() => setForm((f) => ({ ...f, timeline: t.v }))} />
              {isAr ? t.ar : t.en}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="cnc-field">
        <span>{L("Your name", "اسمك")}</span>
        <input required autoComplete="name" value={form.fullName} onChange={set("fullName")} />
      </label>
      <label className="cnc-field">
        <span>{L("Company", "الشركة")}</span>
        <input required autoComplete="organization" value={form.companyName} onChange={set("companyName")} />
      </label>
      <label className="cnc-field">
        <span>{L("Work email", "بريد العمل")}</span>
        <input required type="email" dir="ltr" autoComplete="email" value={form.email} onChange={set("email")} />
      </label>
      <label className="cnc-field">
        <span>{L("Mobile", "الجوال")} <small>{L("optional", "اختياري")}</small></span>
        <input type="tel" dir="ltr" autoComplete="tel" placeholder="+966 5X XXX XXXX" value={form.phone} onChange={set("phone")} />
      </label>
      <label className="cnc-field cnc-field--wide">
        <span>{L("Approximate budget", "الميزانية التقريبية")} <small>{L("optional", "اختياري")}</small></span>
        <input inputMode="numeric" value={form.budget} onChange={set("budget")} placeholder={L("SAR", "ريال")} />
      </label>
      {state.error ? <p className="cnc-error" role="alert">{state.error}</p> : null}
      <button type="submit" className="cnc-submit" disabled={state.busy}>
        {state.busy ? L("Sending…", "جارٍ الإرسال…") : L("Send the brief", "أرسل الموجز")}
      </button>
    </form>
  );
}
