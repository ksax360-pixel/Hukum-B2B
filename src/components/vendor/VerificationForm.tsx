"use client";
// CR + VAT entry for supplier verification. Hukum checks the CR against Wathq and the VAT number against ZATCA.

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/Feedback";

const digits = (v: string): string => v.replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).slice(0, 15);

export function VerificationForm({ locale, cr, vat }: { locale: string; cr: string; vat: string }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const router = useRouter();
  const [crN, setCr] = useState(cr);
  const [vatN, setVat] = useState(vat);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const crOk = /^\d{10}$/.test(crN);
  const vatOk = !vatN || /^3\d{13}3$/.test(vatN);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!crOk || !vatOk || !agree) return;
    setBusy(true);
    try {
      const r = await fetch("/api/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", crNumber: crN, vatNumber: vatN }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      toast(L("Sent. We'll check your CR and let you know.", "تم الإرسال. بنتحقق من سجلك ونبلغك."), "success");
      router.refresh();
    } catch (err) {
      toast((err as Error).message || L("Couldn't send. Try again.", "تعذّر الإرسال. حاول مرة ثانية."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="vv-form" onSubmit={submit}>
      <div className="sfe-grid">
        <label className="sfe-field">
          <span>{L("Commercial Registration (CR) number", "رقم السجل التجاري")}</span>
          <input dir="ltr" inputMode="numeric" autoComplete="off" value={crN} onChange={(e) => setCr(digits(e.target.value).slice(0, 10))} placeholder="1010XXXXXX" aria-invalid={crN.length > 0 && !crOk} />
          <small className={crN && !crOk ? "vv-err" : "vv-hint"}>{crN && !crOk ? L("10 digits, as printed on your CR.", "١٠ أرقام كما في السجل.") : L("Checked with Wathq, the Ministry of Commerce register.", "نتحقق منه عبر واثق، سجل وزارة التجارة.")}</small>
        </label>
        <label className="sfe-field">
          <span>{L("VAT number", "الرقم الضريبي")} <small>{L("if registered", "إذا مسجّل")}</small></span>
          <input dir="ltr" inputMode="numeric" autoComplete="off" value={vatN} onChange={(e) => setVat(digits(e.target.value))} placeholder="3XXXXXXXXXXXXX3" aria-invalid={!vatOk} />
          <small className={!vatOk ? "vv-err" : "vv-hint"}>{!vatOk ? L("15 digits, starting and ending with 3.", "١٥ رقم، يبدأ وينتهي بـ ٣.") : L("Checked with ZATCA. Buyers see that your quotes can include VAT.", "نتحقق منه عبر هيئة الزكاة. المشتري يعرف إن عروضك تشمل الضريبة.")}</small>
        </label>
      </div>
      <label className="vv-agree">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>{L("These numbers belong to my company and I'm allowed to act for it.", "هذي الأرقام تخص شركتي ومخوّل أتصرف باسمها.")}</span>
      </label>
      <div className="sfe-act">
        <button type="submit" className="qb-send" disabled={busy || !crOk || !vatOk || !agree}>
          <ShieldCheck size={18} aria-hidden /> {busy ? L("Sending…", "جارٍ الإرسال…") : L("Send for verification", "أرسل للتوثيق")}
        </button>
      </div>
    </form>
  );
}
