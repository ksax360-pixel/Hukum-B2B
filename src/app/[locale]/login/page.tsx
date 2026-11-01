"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { DEMO_LOGIN_EVENT } from "@/components/auth/DemoAccessChip";
import { AuthLuxField, AuthLuxStack } from "@/components/auth/AuthLuxField";
import { isLocale, type Locale } from "@/i18n/config";
import type { ApiBody } from "@/lib/api";

type SessionUser = { roles?: string[] };

function dashboardPath(locale: Locale, roles: string[] = []) {
  if (roles.some((r) => ["admin", "super_admin"].includes(r))) return `/${locale}/admin`;
  if (roles.some((r) => r.startsWith("vendor"))) return `/${locale}/vendor/dashboard`;
  return `/${locale}/buyer/dashboard`;
}

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const raw = typeof params.locale === "string" ? params.locale : "en";
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  useEffect(() => {
    const onFill = (event: Event) => {
      const detail = (event as CustomEvent<{ email?: string; password?: string }>).detail;
      if (detail?.email) setEmail(detail.email);
      if (detail?.password) setPassword(detail.password);
      setError("");
    };
    window.addEventListener(DEMO_LOGIN_EVENT, onFill);
    return () => window.removeEventListener(DEMO_LOGIN_EVENT, onFill);
  }, []);

  // Already signed in → go straight to the right dashboard
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth", { credentials: "include" });
        const json = (await res.json()) as ApiBody<{
          session?: SessionUser;
          user?: SessionUser & { roles?: string[] };
        }>;
        if (cancelled || !json.success) return;
        const roles =
          json.data?.session?.roles ||
          json.data?.user?.roles ||
          [];
        const next = new URLSearchParams(window.location.search).get("next");
        const dest =
          next && next.startsWith(`/${locale}`)
            ? next
            : dashboardPath(locale, roles);
        router.replace(dest);
        router.refresh();
      } catch {
        /* stay on login */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const json = (await res.json()) as ApiBody<{ user?: SessionUser }>;
      if (!json.success || !json.data?.user) {
        setError(json.message || (isAr ? "فشل تسجيل الدخول" : "Login failed"));
        setLoading(false);
        return;
      }
      if (typeof window !== "undefined" && !localStorage.getItem("theme")) {
        localStorage.setItem("theme", "light");
      }
      const roles = json.data.user.roles || [];
      const next = new URLSearchParams(window.location.search).get("next");
      const dest =
        next && next.startsWith(`/${locale}`) ? next : dashboardPath(locale, roles);
      router.replace(dest);
      router.refresh();
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
      setLoading(false);
    }
  }

  async function sendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_auth_otp", phone }),
      });
      const json = (await res.json()) as ApiBody<{ demoOtp?: string }>;
      if (!json.success) {
        setError(json.message || "OTP failed");
        setLoading(false);
        return;
      }
      setOtpSent(true);
      if (json.data?.demoOtp) setDemoOtp(json.data.demoOtp);
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_auth_otp", phone, otp }),
      });
      const json = (await res.json()) as ApiBody<{ user?: SessionUser }>;
      if (!json.success || !json.data?.user) {
        setError(json.message || "OTP verify failed");
        setLoading(false);
        return;
      }
      const roles = json.data.user.roles || [];
      router.replace(dashboardPath(locale, roles));
      router.refresh();
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
      setLoading(false);
    }
  }

  async function sso(provider: "google" | "microsoft") {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "oauth_sso", provider }),
      });
      const json = (await res.json()) as ApiBody<{ user?: SessionUser }>;
      if (!json.success || !json.data?.user) {
        setError(json.message || (isAr ? "فشل الدخول السريع" : "SSO failed"));
        setLoading(false);
        return;
      }
      const roles = json.data.user.roles || [];
      const next = new URLSearchParams(window.location.search).get("next");
      const dest =
        next && next.startsWith(`/${locale}`) ? next : dashboardPath(locale, roles);
      router.replace(dest);
      router.refresh();
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
      setLoading(false);
    }
  }

  return (
    <AuthShell locale={locale}>
      <h1 className="mb-5 text-center text-sm font-medium tracking-[0.08em] text-[#111C17] sm:mb-8">
        {isAr ? "مرحباً بعودتك" : "Welcome back"}
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
      <div className="mb-4 flex justify-center gap-2 text-xs">
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${mode === "password" ? "bg-[#17634B] text-white" : "border border-[#111C17]/15 text-[#111C17]"}`}
          onClick={() => setMode("password")}
        >
          {isAr ? "بريد" : "Email"}
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${mode === "otp" ? "bg-[#17634B] text-white" : "border border-[#111C17]/15 text-[#111C17]"}`}
          onClick={() => setMode("otp")}
        >
          {isAr ? "جوال OTP" : "Mobile OTP"}
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-[#b42318]">{error}</p> : null}
      {mode === "password" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthLuxStack>
            <AuthLuxField
              label={isAr ? "البريد" : "Email"}
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <AuthLuxField
              label={isAr ? "كلمة المرور" : "Password"}
              revealable
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </AuthLuxStack>
          <button type="submit" disabled={loading} className="auth-lux-btn">
            {loading ? (isAr ? "جارٍ تسجيل الدخول…" : "Signing in...") : isAr ? "تسجيل الدخول" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-6">
          <AuthLuxStack>
            <AuthLuxField
              label={isAr ? "الجوال" : "Mobile"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
            />
            {otpSent ? (
              <AuthLuxField
                label={isAr ? "رمز OTP" : "OTP code"}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading}
              />
            ) : null}
          </AuthLuxStack>
          {demoOtp ? (
            <p className="text-xs text-[#111C17]/50">
              {isAr ? "رمز تجريبي:" : "Demo code:"} {demoOtp}
            </p>
          ) : null}
          {!otpSent ? (
            <button type="button" disabled={loading || !phone} className="auth-lux-btn" onClick={() => void sendOtp()}>
              {loading ? "…" : isAr ? "إرسال الرمز" : "Send code"}
            </button>
          ) : (
            <button type="submit" disabled={loading} className="auth-lux-btn">
              {loading ? "…" : isAr ? "تأكيد الدخول" : "Verify & sign in"}
            </button>
          )}
        </form>
      )}
      <div className="mt-6 flex items-center justify-between text-sm text-[#111C17]/50">
        <Link href={`/${locale}/forgot-password`} className="font-semibold text-[#17634B] hover:opacity-80">
          {isAr ? "نسيت كلمة المرور" : "Forgot password"}
        </Link>
        <Link href={`/${locale}/register`} className="font-semibold text-[#17634B] hover:opacity-80">
          {isAr ? "إنشاء حساب" : "Sign up"}
        </Link>
      </div>
    </AuthShell>
  );
}
