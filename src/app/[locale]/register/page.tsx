"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthLuxField, AuthLuxStack } from "@/components/auth/AuthLuxField";
import { isLocale, type Locale } from "@/i18n/config";
import type { ApiBody } from "@/lib/api";
import { readAcquisition } from "@/lib/acquisition";

type SessionUser = { roles?: string[] };

function dashboardPath(locale: Locale, roles: string[] = []) {
  if (roles.some((r) => ["admin", "super_admin"].includes(r))) return `/${locale}/admin`;
  if (roles.some((r) => r.startsWith("vendor"))) return `/${locale}/vendor/dashboard`;
  return `/${locale}/buyer/dashboard`;
}

function RegisterForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = typeof params.locale === "string" ? params.locale : "en";
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const isAr = locale === "ar";
  const initialType = searchParams.get("type") === "vendor" ? "vendor" : "buyer";

  const [accountType, setAccountType] = useState<"buyer" | "vendor">(initialType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sso(provider: "google" | "microsoft") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "oauth_sso",
          provider,
          preferredLanguage: locale,
          accountType,
          acquisition: readAcquisition(),
        }),
      });
      const json = (await res.json()) as ApiBody<{ user?: SessionUser }>;
      if (!json.success || !json.data?.user) {
        setError(json.message || (isAr ? "فشل التسجيل السريع" : "SSO failed"));
        setLoading(false);
        return;
      }
      const roles = json.data.user.roles || [];
      const next = searchParams.get("next");
      const dest =
        next && next.startsWith(`/${locale}`) ? next : dashboardPath(locale, roles);
      router.replace(dest);
      router.refresh();
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          accountType,
          name,
          email,
          password,
          mobile,
          preferredLanguage: locale,
          acquisition: readAcquisition(),
        }),
      });
      const json = (await res.json()) as ApiBody<{ user?: SessionUser }>;
      if (!json.success || !json.data?.user) {
        setError(json.message || json.error || (isAr ? "فشل التسجيل" : "Registration failed"));
        return;
      }
      router.replace(dashboardPath(locale, json.data.user.roles || []));
      router.refresh();
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell locale={locale} wide>
      <h1 className="mb-5 text-center text-sm font-medium tracking-[0.08em] text-[#111C17] sm:mb-8">
        {isAr ? "إنشاء حساب" : "Create account"}
      </h1>
      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void sso("google")}
          className="rounded-xl border border-[#111C17]/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#111C17] hover:border-[#17634B]/30 hover:bg-[#f3f5f4] disabled:opacity-50"
        >
          Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void sso("microsoft")}
          className="rounded-xl border border-[#111C17]/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#111C17] hover:border-[#17634B]/30 hover:bg-[#f3f5f4] disabled:opacity-50"
        >
          Microsoft
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-xl py-3 text-xs font-semibold uppercase tracking-[0.14em] ${
              accountType === "buyer" ? "bg-[#17634B] text-white" : "border border-[#111C17]/15 text-[#111C17]"
            }`}
            onClick={() => setAccountType("buyer")}
          >
            {isAr ? "مشتري" : "Buyer"}
          </button>
          <button
            type="button"
            className={`rounded-xl py-3 text-xs font-semibold uppercase tracking-[0.14em] ${
              accountType === "vendor" ? "bg-[#17634B] text-white" : "border border-[#111C17]/15 text-[#111C17]"
            }`}
            onClick={() => setAccountType("vendor")}
          >
            {isAr ? "مورد" : "Vendor"}
          </button>
        </div>
        <AuthLuxStack>
          <AuthLuxField label={isAr ? "الاسم" : "Name"} value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
          <AuthLuxField label={isAr ? "البريد" : "Email"} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          <AuthLuxField label={isAr ? "الجوال" : "Mobile"} value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={loading} />
          <AuthLuxField label={isAr ? "كلمة المرور" : "Password"} revealable autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
        </AuthLuxStack>
        {error && <p className="text-sm text-[#b42318]">{error}</p>}
        <button type="submit" className="auth-lux-btn" disabled={loading}>
          {loading ? (isAr ? "جارٍ إنشاء الحساب…" : "Registering…") : isAr ? "إنشاء حساب" : "Register"}
        </button>
        <p className="text-center text-sm text-[#111C17]/50">
          {isAr ? "لديك حساب؟" : "Already have an account?"}{" "}
          <Link href={`/${locale}/login`} className="font-semibold text-[#17634B]">
            {isAr ? "دخول" : "Sign in"}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-stage grid place-items-center">
          <div className="lux-loader">
            <div className="lux-loader-halo" />
            <div className="lux-loader-orbit" />
            <div className="lux-loader-arc" />
            <div className="lux-loader-mark">
              <img src="/brand/hukum-logo.png" alt="Hukum" width={36} height={36} />
            </div>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
