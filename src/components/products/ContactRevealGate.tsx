"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Phone } from "lucide-react";

export type RevealedContact = {
  phone: string;
  email: string;
  whatsapp: string;
  website?: string;
};

type Props = {
  locale: "en" | "ar";
  productId?: string;
  vendorId?: string;
  hasContact: boolean;
  compact?: boolean;
  onRevealed?: (contact: RevealedContact) => void;
  className?: string;
};

export function ContactRevealGate({
  locale,
  productId,
  vendorId,
  hasContact,
  compact,
  onRevealed,
  className = "",
}: Props) {
  const isAr = locale === "ar";
  const [step, setStep] = useState<"idle" | "otp" | "busy">("idle");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pdplConsent, setPdplConsent] = useState(false);

  const finish = useCallback(
    (data: RevealedContact) => {
      onRevealed?.(data);
      setStep("idle");
      setError(null);
    },
    [onRevealed]
  );

  async function trySessionReveal() {
    if (!pdplConsent) {
      setError(
        isAr
          ? "يرجى الموافقة على معالجة البيانات قبل إظهار التواصل."
          : "Please consent to data processing before revealing contact."
      );
      return false;
    }
    setStep("busy");
    setError(null);
    try {
      const res = await fetch("/api/contact-reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reveal_session",
          productId,
          vendorId,
          pdplConsent: true,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: RevealedContact;
        message?: string;
      };
      if (res.ok && json.success && json.data) {
        finish(json.data);
        return true;
      }
      setError(json.message || null);
      setStep("otp");
      return false;
    } catch {
      setStep("otp");
      return false;
    }
  }

  async function startReveal() {
    if (!hasContact) return;
    if (!pdplConsent) {
      setError(
        isAr
          ? "يرجى الموافقة على معالجة البيانات قبل إظهار التواصل."
          : "Please consent to data processing before revealing contact."
      );
      return;
    }
    const ok = await trySessionReveal();
    if (!ok) setStep("otp");
  }

  async function sendOtp() {
    setError(null);
    setStep("busy");
    try {
      const res = await fetch("/api/contact-reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone, productId, vendorId }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { demoOtp?: string };
        message?: string;
      };
      if (!res.ok || !json.success) {
        setError(json.message || (isAr ? "تعذر إرسال الرمز" : "Could not send OTP"));
        setStep("otp");
        return;
      }
      setDemoOtp(json.data?.demoOtp || "");
      setSent(true);
      setStep("otp");
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
      setStep("otp");
    }
  }

  async function verifyOtp() {
    if (!pdplConsent) {
      setError(
        isAr
          ? "يرجى الموافقة على معالجة البيانات قبل إظهار التواصل."
          : "Please consent to data processing before revealing contact."
      );
      setStep("otp");
      return;
    }
    setError(null);
    setStep("busy");
    try {
      const res = await fetch("/api/contact-reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_reveal",
          phone,
          otp,
          productId,
          vendorId,
          pdplConsent: true,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: RevealedContact;
        message?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        setError(json.message || (isAr ? "رمز غير صحيح" : "Invalid OTP"));
        setStep("otp");
        return;
      }
      finish(json.data);
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
      setStep("otp");
    }
  }

  if (!hasContact) return null;

  const consentBox = (
    <label className="flex items-start gap-2 text-[0.7rem] leading-snug text-[#5c5c5c]">
      <input
        type="checkbox"
        className="mt-0.5"
        checked={pdplConsent}
        onChange={(e) => setPdplConsent(e.target.checked)}
      />
      <span>
        {isAr
          ? "أوافق على معالجة بياناتي لإظهار تواصل المورد وفق سياسة الخصوصية."
          : "I consent to processing my data to reveal supplier contact under the Privacy Policy."}{" "}
        <Link href={`/${locale}/privacy`} className="underline text-[#8a6a2b]">
          {isAr ? "الخصوصية" : "Privacy"}
        </Link>
      </span>
    </label>
  );

  if (step === "otp" || (step === "busy" && sent)) {
    return (
      <div className={`rounded-lg border border-[#e6e2da] bg-[#ebe7df]/40 p-3 ${className}`}>
        <p className="m-0 mb-2 text-xs font-semibold text-[#1a1612]">
          {isAr ? "تحقق بالهاتف لإظهار التواصل" : "Verify phone to reveal contact"}
        </p>
        <div className="mb-2">{consentBox}</div>
        {!sent ? (
          <div className="flex flex-col gap-2">
            <input
              type="tel"
              placeholder="+9665…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-[#e6e2da] bg-transparent px-2.5 py-2 text-sm"
            />
            <button
              type="button"
              disabled={step === "busy" || !pdplConsent || phone.replace(/\D/g, "").length < 9}
              onClick={() => void sendOtp()}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#c9a962]/55 bg-[#c9a962]/15 px-3 py-2 text-xs font-semibold text-[#1a1612] disabled:opacity-50"
            >
              {step === "busy" ? <Loader2 size={14} className="animate-spin" /> : null}
              {isAr ? "إرسال رمز التحقق" : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {demoOtp ? (
              <p className="m-0 text-[0.65rem] text-[#8a6a2b]">
                {isAr ? "رمز تجريبي: " : "Demo OTP: "}
                <strong>{demoOtp}</strong>
              </p>
            ) : null}
            <input
              type="text"
              inputMode="numeric"
              placeholder={isAr ? "رمز التحقق" : "OTP code"}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-md border border-[#e6e2da] bg-transparent px-2.5 py-2 text-sm"
            />
            <button
              type="button"
              disabled={step === "busy" || !pdplConsent || otp.length < 4}
              onClick={() => void verifyOtp()}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#c9a962]/55 bg-[#c9a962]/15 px-3 py-2 text-xs font-semibold text-[#1a1612] disabled:opacity-50"
            >
              {step === "busy" ? <Loader2 size={14} className="animate-spin" /> : null}
              {isAr ? "تأكيد وإظهار" : "Verify & reveal"}
            </button>
          </div>
        )}
        {error ? <p className="mt-2 mb-0 text-[0.7rem] text-red-700">{error}</p> : null}
        <button
          type="button"
          className="mt-2 text-[0.65rem] text-[#8a8a8a] underline"
          onClick={() => {
            setStep("idle");
            setSent(false);
            setError(null);
          }}
        >
          {isAr ? "إلغاء" : "Cancel"}
        </button>
      </div>
    );
  }

  return (
    <div className={`mt-2 space-y-2 ${className}`}>
      {consentBox}
      <button
        type="button"
        onClick={() => void startReveal()}
        disabled={step === "busy" || !pdplConsent}
        className={
          compact
            ? "inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a6a2b] hover:text-[#1a1612] disabled:opacity-60"
            : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#e6e2da] bg-transparent px-3 py-2.5 text-sm font-semibold text-[#1a1612] hover:border-[#c9a962]/50 disabled:opacity-60"
        }
      >
        {step === "busy" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <Lock size={14} />
            <Phone size={14} />
          </>
        )}
        {isAr ? "إظهار بيانات التواصل" : "Show contact"}
      </button>
      {error ? <p className="m-0 text-[0.7rem] text-red-700">{error}</p> : null}
      {!compact ? (
        <p className="m-0 text-center text-[0.65rem] text-[#8a8a8a]">
          {isAr ? "أو سجّل خلال أقل من دقيقة: " : "Or unlock in under 60s: "}
          <Link
            href={`/${locale}/register?next=/${locale}/products`}
            className="font-semibold text-[#8a6a2b] underline"
          >
            {isAr ? "إنشاء حساب" : "Sign up"}
          </Link>
          {" · "}
          <Link
            href={`/${locale}/login?next=/${locale}/products`}
            className="font-semibold text-[#8a6a2b] underline"
          >
            {isAr ? "دخول" : "Sign in"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
