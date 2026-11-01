"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthLuxField, AuthLuxStack } from "@/components/auth/AuthLuxField";
import { isLocale, type Locale } from "@/i18n/config";

export default function ForgotPasswordPage() {
  const params = useParams();
  const raw = typeof params.locale === "string" ? params.locale : "en";
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const isAr = locale === "ar";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setDemoUrl("");
    try {
      const resetBaseUrl =
        typeof window !== "undefined" ? `${window.location.origin}/${locale}` : `https://hukum-ksa.com/${locale}`;
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "forgot_password", email, resetBaseUrl }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Request failed");
      setMessage(
        isAr
          ? "إذا وُجد حساب لهذا البريد، أُرسل رابط إعادة التعيين."
          : "If an account exists for that email, a reset link was sent."
      );
      if (json.data?.demoResetUrl) setDemoUrl(json.data.demoResetUrl);
    } catch (err) {
      setError((err as Error).message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell locale={locale}>
      <h1 className="mb-5 text-center text-sm font-medium tracking-[0.08em] text-[#111C17]">
        {isAr ? "نسيت كلمة المرور" : "Forgot password"}
      </h1>
      {error ? <p className="mb-3 text-sm text-[#b42318]">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-[#111C17]/70">{message}</p> : null}
      {demoUrl ? (
        <p className="mb-3 break-all text-xs text-[#111C17]/50">
          Demo:{" "}
          <a className="underline" href={demoUrl}>
            {demoUrl}
          </a>
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-6">
        <AuthLuxStack>
          <AuthLuxField
            label={isAr ? "البريد" : "Email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={busy}
          />
        </AuthLuxStack>
        <button type="submit" disabled={busy} className="auth-lux-btn">
          {busy ? "…" : isAr ? "إرسال الرابط" : "Send reset link"}
        </button>
      </form>
      <div className="mt-6 text-center text-sm">
        <Link href={`/${locale}/login`} className="font-semibold text-[#17634B]">
          {isAr ? "العودة لتسجيل الدخول" : "Back to sign in"}
        </Link>
      </div>
    </AuthShell>
  );
}
