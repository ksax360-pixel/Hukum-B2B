"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, Loader2, X } from "lucide-react";

type Props = {
  locale: "en" | "ar";
  productId: string;
  productName: string;
  vendorId?: string;
  className?: string;
  size?: number;
  /** icon = heart only; button = labeled “Interested” control */
  variant?: "icon" | "button";
};

type Step = "phone" | "otp" | "profile" | "done";

type BuyerProfile = {
  fullName: string;
  companyName: string;
  phone: string;
  quantity?: string;
  updatedAt: string;
};

const PROFILE_KEY = "kt_buyer_profile";
const INTERESTS_KEY = "kt_product_interests";

type SavedInterest = {
  reference: string;
  productId: string;
  productName?: string;
  vendorId?: string;
  vendorName?: string;
  quantity?: string;
  phone?: string;
  fullName?: string;
  companyName?: string;
  createdAt?: string;
};

function readProfile(): BuyerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuyerProfile;
  } catch {
    return null;
  }
}

function writeProfile(profile: BuyerProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

function writeInterestRecord(entry: SavedInterest) {
  try {
    const raw = localStorage.getItem(INTERESTS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string | SavedInterest>) : {};
    map[entry.productId] = entry;
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function InterestHeartButton({
  locale,
  productId,
  productName,
  vendorId,
  className = "",
  size = 18,
  variant = "icon",
}: Props) {
  const isAr = locale === "ar";
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [interested, setInterested] = useState(false);
  const [knownBuyer, setKnownBuyer] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INTERESTS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string | SavedInterest>) : {};
      const existing = map[productId];
      if (existing) {
        setInterested(true);
        setReference(typeof existing === "string" ? existing : existing.reference || "");
      }
      const profile = readProfile();
      if (profile) {
        setFullName(profile.fullName || "");
        setCompanyName(profile.companyName || "");
        setPhone(profile.phone || "");
        setQuantity(profile.quantity || "");
        setKnownBuyer(Boolean(profile.fullName?.trim() && profile.companyName?.trim()));
      } else {
        setKnownBuyer(false);
      }
    } catch {
      /* ignore */
    }
  }, [productId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    setError("");
    setBusy(false);
    if (step !== "done") {
      setStep("phone");
      setOtp("");
      setDemoOtp("");
    }
  }

  async function trySessionSkip() {
    try {
      const res = await fetch("/api/product-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "skip_otp_for_session", productId, vendorId, locale }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { phone?: string; fullName?: string; email?: string };
      };
      if (!json.success || !json.data?.phone) return false;
      setPhone(json.data.phone);
      if (json.data.fullName) setFullName(json.data.fullName);
      const profile = readProfile();
      const name = (json.data.fullName || profile?.fullName || "").trim();
      const company = (profile?.companyName || companyName || "").trim();
      if (name) setFullName(name);
      if (company) setCompanyName(company);
      if (name && company) {
        setKnownBuyer(true);
        setOtp("session");
        await submitInterest({
          fullName: name,
          companyName: company,
          quantity: (profile?.quantity || quantity || "").trim(),
          phoneValue: json.data.phone,
          otpValue: "session",
        });
        return true;
      }
      setStep("profile");
      return true;
    } catch {
      return false;
    }
  }

  async function openModal(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setOpen(true);
    setError("");
    if (!interested) {
      setStep("phone");
      setOtp("");
      setDemoOtp("");
      // Signed-in buyers with verified mobile skip OTP.
      void trySessionSkip();
    } else {
      setStep("done");
    }
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/product-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_otp",
          phone,
          productId,
          vendorId,
          locale,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: { demoOtp?: string; phone?: string };
      };
      if (!json.success) {
        setError(json.message || (isAr ? "فشل إرسال الرمز" : "Failed to send OTP"));
        return;
      }
      setDemoOtp(json.data?.demoOtp || "");
      if (json.data?.phone) setPhone(json.data.phone);
      setStep("otp");
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/product-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          phone,
          otp,
          productId,
          locale,
        }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!json.success) {
        setError(json.message || (isAr ? "فشل التحقق" : "Verification failed"));
        return;
      }
      const existing = readProfile();
      const name = (existing?.fullName || fullName || "").trim();
      const company = (existing?.companyName || companyName || "").trim();
      if (name) setFullName(name);
      if (company) setCompanyName(company);

      // Returning buyer — keep saved name/company, skip profile form (no login).
      if (name && company) {
        setKnownBuyer(true);
        await submitInterest({
          fullName: name,
          companyName: company,
          quantity: (existing?.quantity || quantity || "").trim(),
          phoneValue: phone,
          otpValue: otp,
        });
        return;
      }
      setStep("profile");
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function submitInterest(
    e?:
      | React.FormEvent
      | {
          fullName: string;
          companyName: string;
          quantity?: string;
          phoneValue?: string;
          otpValue?: string;
        }
  ) {
    if (e && "preventDefault" in e) e.preventDefault();
    const payload =
      e && !("preventDefault" in e)
        ? e
        : {
            fullName,
            companyName,
            quantity,
            phoneValue: phone,
            otpValue: otp,
          };
    const name = String(payload.fullName || "").trim();
    const company = String(payload.companyName || "").trim();
    const qty = String(payload.quantity || "").trim();
    const phoneValue = String(payload.phoneValue || phone).trim();
    const otpValue = String(payload.otpValue || otp).trim();

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/product-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          phone: phoneValue,
          otp: otpValue,
          productId,
          vendorId,
          productName,
          locale,
          fullName: name,
          companyName: company,
          quantity: qty,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: {
          reference?: string;
          productName?: string;
          vendorId?: string;
          vendorName?: string;
          quantity?: string;
        };
      };
      if (!json.success) {
        setError(json.message || (isAr ? "فشل الحفظ" : "Failed to save interest"));
        return;
      }
      const ref = json.data?.reference || "";
      setReference(ref);
      setInterested(true);
      setKnownBuyer(true);
      writeProfile({
        fullName: name,
        companyName: company,
        phone: phoneValue,
        quantity: qty || undefined,
        updatedAt: new Date().toISOString(),
      });
      writeInterestRecord({
        reference: ref || phoneValue,
        productId,
        productName: json.data?.productName || productName,
        vendorId: json.data?.vendorId || vendorId,
        vendorName: json.data?.vendorName,
        quantity: json.data?.quantity || qty || undefined,
        phone: phoneValue,
        fullName: name,
        companyName: company,
        createdAt: new Date().toISOString(),
      });
      setStep("done");
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setBusy(false);
    }
  }

  const iconBtnClass =
    className ||
    "pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[#16a34a] hover:text-[#15803d]";

  const labeledBtnClass =
    className ||
    "pointer-events-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#15803d]";

  const inputClass =
    "kt-interest-input mt-1.5 w-full rounded-2xl px-3.5 py-3 text-sm text-[#1a1612] placeholder:text-[#9a9a9a]";
  const primaryBtn =
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c9a962] px-3 py-3.5 text-sm font-semibold text-[#1a1612] shadow-[0_8px_22px_rgba(201,169,98,0.32)] transition hover:bg-[#d4b56e] disabled:opacity-60";
  const ghostBtn =
    "kt-interest-chip inline-flex items-center justify-center rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#1a1612] transition hover:bg-white/60";

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center p-3 sm:items-center sm:p-6"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="kt-interest-backdrop absolute inset-0"
              aria-label="Close"
              onClick={close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="kt-interest-sheet relative z-10 max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-[28px] p-6 pb-7 sm:p-7 sm:pb-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {step !== "done" ? (
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c9a962]/18 text-[#c9a962] ring-1 ring-[#c9a962]/35">
                      <Heart size={20} className="fill-[#c9a962] text-[#c9a962]" strokeWidth={2} />
                    </div>
                    <h2
                      id={titleId}
                      className="m-0 text-[1.2rem] font-bold tracking-tight text-[#0f1720] sm:text-[1.3rem]"
                    >
                      {isAr ? "مهتم بهذا المنتج؟" : "Interested in this product?"}
                    </h2>
                    <p className="mt-1.5 mb-0 line-clamp-2 text-sm leading-snug text-[#5c6670]">
                      {productName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="kt-interest-chip inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1a1612]"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mb-1 flex justify-end">
                  <h2 id={titleId} className="sr-only">
                    {isAr ? "شكرًا لك" : "Thank you"}
                  </h2>
                  <button
                    type="button"
                    onClick={close}
                    className="kt-interest-chip inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1a1612]"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {step === "phone" ? (
                <form onSubmit={(e) => void sendOtp(e)} className="space-y-3.5">
                  {knownBuyer && fullName ? (
                    <p className="kt-interest-chip m-0 rounded-2xl px-3.5 py-3 text-sm text-[#1a1612]">
                      {isAr ? (
                        <>
                          مرحبًا مجددًا، <strong>{fullName}</strong>. أكّد رقمك فقط — لا حاجة لتسجيل الدخول.
                        </>
                      ) : (
                        <>
                          Welcome back, <strong>{fullName}</strong>. Confirm your number only — no
                          login needed.
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="m-0 text-sm leading-relaxed text-[#4a5560]">
                      {isAr
                        ? "أدخل رقم جوالك وسنرسل رمز OTP للتحقق."
                        : "Enter your mobile number. We’ll send an OTP to verify."}
                    </p>
                  )}
                  <label className="block text-[13px] font-semibold text-[#1a1612]">
                    {isAr ? "رقم الجوال" : "Mobile number"}
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      className={inputClass}
                    />
                  </label>
                  {error ? <p className="m-0 text-sm text-[#b42318]">{error}</p> : null}
                  <button type="submit" disabled={busy} className={primaryBtn}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isAr ? "إرسال رمز التحقق" : "Send OTP"}
                  </button>
                </form>
              ) : null}

              {step === "otp" ? (
                <form onSubmit={(e) => void verifyOtp(e)} className="space-y-3.5">
                  <p className="m-0 text-sm leading-relaxed text-[#4a5560]">
                    {knownBuyer && fullName
                      ? isAr
                        ? `${fullName} — أدخل الرمز المرسل إلى ${phone}`
                        : `${fullName} — enter the code sent to ${phone}`
                      : isAr
                        ? `أدخل الرمز المرسل إلى ${phone}`
                        : `Enter the code sent to ${phone}`}
                  </p>
                  {demoOtp ? (
                    <p className="kt-interest-chip m-0 rounded-2xl px-3.5 py-2.5 text-xs text-[#6b5a2e]">
                      {isAr ? "رمز تجريبي (محلي):" : "Demo OTP (local):"}{" "}
                      <strong className="tracking-[0.28em] text-[#1a1612]">{demoOtp}</strong>
                    </p>
                  ) : null}
                  <label className="block text-[13px] font-semibold text-[#1a1612]">
                    OTP
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      autoFocus
                      maxLength={8}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className={`${inputClass} text-center text-lg tracking-[0.4em]`}
                    />
                  </label>
                  {error ? <p className="m-0 text-sm text-[#b42318]">{error}</p> : null}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button type="button" disabled={busy} onClick={() => void sendOtp()} className={ghostBtn}>
                      {isAr ? "إعادة إرسال" : "Resend"}
                    </button>
                    <button type="submit" disabled={busy} className={`${primaryBtn} !w-auto`}>
                      {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isAr ? "تحقق" : "Verify"}
                    </button>
                  </div>
                </form>
              ) : null}

              {step === "profile" ? (
                <form onSubmit={(e) => void submitInterest(e)} className="flex flex-col gap-4">
                  <p className="m-0 text-sm leading-relaxed text-[#4a5560]">
                    {isAr
                      ? "أكمل بيانات المشتري وكمية الطلب لإرسال الاهتمام للبائع."
                      : "Add buyer profile and order quantity so the seller can follow up."}
                  </p>
                  <label className="block text-[13px] font-semibold text-[#1a1612]">
                    {isAr ? "الاسم الكامل" : "Full name"}
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-[13px] font-semibold text-[#1a1612]">
                    {isAr ? "اسم الشركة" : "Company name"}
                    <input
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-[13px] font-semibold text-[#1a1612]">
                    {isAr ? "الكمية المطلوبة" : "Order quantity"}
                    <input
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={isAr ? "مثال: 500 قطعة" : "e.g. 500 pcs"}
                      className={inputClass}
                    />
                  </label>
                  <p className="kt-interest-chip m-0 mt-1 rounded-2xl px-3.5 py-3 text-xs text-[#5c6670]">
                    {isAr ? "الجوال الموثّق:" : "Verified phone:"}{" "}
                    <strong className="text-[#1a1612]">{phone}</strong>
                  </p>
                  {error ? <p className="m-0 text-sm text-[#b42318]">{error}</p> : null}
                  <button type="submit" disabled={busy} className={`${primaryBtn} mt-2`}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isAr ? "إرسال الاهتمام" : "Submit interest"}
                  </button>
                </form>
              ) : null}

              {step === "done" ? (
                <div className="space-y-5 py-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#c9a962]/18 text-[#c9a962]">
                    <Heart size={28} className="fill-[#c9a962] text-[#c9a962]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="m-0 text-xl font-bold tracking-tight text-[#1a1612]">
                      {isAr ? "شكرًا لك" : "Thank you"}
                    </p>
                    <p className="mt-2 mb-0 text-sm leading-relaxed text-[#5c5c5c]">
                      {isAr
                        ? `تم إرسال اهتمامك${fullName ? ` باسم ${fullName}` : ""} بنجاح. سيتواصل معك البائع قريبًا.`
                        : `Your interest${fullName ? ` as ${fullName}` : ""} was submitted. The seller will contact you soon.`}
                    </p>
                    {reference ? (
                      <p className="mt-2 mb-0 text-xs text-[#8a8a8a]">
                        {isAr ? "المرجع:" : "Reference:"} {reference}
                      </p>
                    ) : null}
                  </div>
                  <button type="button" onClick={close} className={primaryBtn}>
                    {isAr ? "تم" : "Done"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={openModal}
          onMouseDown={(e) => e.stopPropagation()}
          className={labeledBtnClass}
          aria-label={isAr ? "مهتم" : "Interested"}
        >
          <Heart
            size={size}
            className={interested ? "fill-white text-white" : "text-white"}
            strokeWidth={2}
          />
          {interested
            ? isAr
              ? "تم تسجيل الاهتمام"
              : "Interest saved"
            : isAr
              ? "مهتم بهذا المنتج"
              : "I'm interested"}
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          onMouseDown={(e) => e.stopPropagation()}
          className={iconBtnClass}
          aria-label={isAr ? "مهتم" : "Interested"}
          title={isAr ? "سجّل اهتمامك" : "Mark interested"}
        >
          <Heart
            size={size}
            className={
              interested
                ? "fill-[#16a34a] text-[#16a34a]"
                : "text-[#16a34a]"
            }
            strokeWidth={2}
          />
        </button>
      )}
      {modal}
    </>
  );
}
