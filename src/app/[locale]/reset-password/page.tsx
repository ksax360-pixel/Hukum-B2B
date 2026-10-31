"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthLuxField, AuthLuxStack } from "@/components/auth/AuthLuxField";
import { isLocale, type Locale } from "@/i18n/config";

function ResetForm({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const sp = useSearchParams();
  const router = useRouter();
  const email = useMemo(() => sp.get("email") || "", [sp]);
  const token = useMemo(() => sp.get("token") || "", [sp]);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reset_password", email, token, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Reset failed");
      setMessage(isAr ? "تم تحديث كلمة المرور." : "Password updated.");
      setTimeout(() => router.replace(`/${locale}/login`), 1000);
    } catch (err) {
      setError((err as Error).message || "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (!email || !token) {
    return (
      <p className="text-sm text-[#b42318]">
        {isAr ? "رابط غير صالح." : "Invalid reset link."}{" "}
        <Link href={`/${locale}/forgot-password`} className="underline">
          {isAr ? "اطلب رابطاً جديداً" : "Request a new one"}
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
      {message ? <p className="text-sm text-[#071D27]/70">{message}</p> : null}
      <p className="text-xs text-[#071D27]/50">{email}</p>
      <AuthLuxStack>
        <AuthLuxField
          label={isAr ? "كلمة المرور الجديدة" : "New password"}
          type="password"
          revealable
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={busy}
        />
      </AuthLuxStack>
      <button type="submit" disabled={busy} className="auth-lux-btn">
        {busy ? "…" : isAr ? "تعيين كلمة المرور" : "Set password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const params = useParams();
  const raw = typeof params.locale === "string" ? params.locale : "en";
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const isAr = locale === "ar";

  return (
    <AuthShell locale={locale}>
      <h1 className="mb-5 text-center text-sm font-medium uppercase tracking-[0.32em] text-[#071D27]">
        {isAr ? "إعادة تعيين كلمة المرور" : "Reset password"}
      </h1>
      <Suspense fallback={<p className="text-sm text-[#071D27]/50">…</p>}>
        <ResetForm locale={locale} />
      </Suspense>
      <div className="mt-6 text-center text-sm">
        <Link href={`/${locale}/login`} className="font-semibold text-[#071D27]">
          {isAr ? "تسجيل الدخول" : "Sign in"}
        </Link>
      </div>
    </AuthShell>
  );
}
