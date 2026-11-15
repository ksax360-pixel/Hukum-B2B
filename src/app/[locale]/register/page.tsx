"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthLuxField, AuthLuxStack } from "@/components/auth/AuthLuxField";
import { isLocale, type Locale } from "@/i18n/config";
import type { ApiBody } from "@/lib/api";

const SSO_ON = process.env.NEXT_PUBLIC_AUTH_SSO === "1";
const CITIES: Array<[string, string]> = [["Riyadh", "الرياض"], ["Jeddah", "جدة"], ["Dammam", "الدمام"], ["Khobar", "الخبر"], ["Jubail", "الجبيل"], ["Mecca", "مكة"], ["Medina", "المدينة"], ["Other", "أخرى"]];
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
  const initialType = searchParams.get("type") === "vendor" || searchParams.get("role") === "vendor" ? "vendor" : "buyer";

  const [accountType, setAccountType] = useState<"buyer" | "vendor">(initialType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [sells, setSells] = useState("");
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
          ...(accountType === "vendor" ? { companyName: company.trim(), city, sells: sells.trim() } : {}),
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
    <AuthShell locale={locale} wide audience={accountType === "vendor" ? "supplier" : "buyer"}>
      <h1 className="auth2__title">
        {accountType === "vendor" ? (isAr ? "سجّل شركتك كمورد" : "List your company as a supplier") : isAr ? "أنشئ حساب مشتري" : "Create a buyer account"}
      </h1>
      {SSO_ON ? (
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
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={accountType === "buyer"}
            className={`grid gap-0.5 rounded-xl px-3 py-3 text-start ${
              accountType === "buyer" ? "bg-[#17634B] text-white" : "border border-[#111C17]/15 text-[#111C17]"
            }`}
            onClick={() => setAccountType("buyer")}
          >
            <span className="text-sm font-semibold">{isAr ? "مشتري" : "Buyer"}</span>
            <span className="text-xs opacity-75">{isAr ? "اطلب عروض الأسعار وتواصل مع الموردين" : "Request quotes and contact suppliers"}</span>
          </button>
          <button
            type="button"
            aria-pressed={accountType === "vendor"}
            className={`grid gap-0.5 rounded-xl px-3 py-3 text-start ${
              accountType === "vendor" ? "bg-[#17634B] text-white" : "border border-[#111C17]/15 text-[#111C17]"
            }`}
            onClick={() => setAccountType("vendor")}
          >
            <span className="text-sm font-semibold">{isAr ? "مورد" : "Supplier"}</span>
            <span className="text-xs opacity-75">{isAr ? "استقبل طلبات المشترين، مجاناً حتى 2027" : "Receive buyer requests, free through 2027"}</span>
          </button>
        </div>
        {accountType === "vendor" ? (
          <AuthLuxStack>
            <AuthLuxField label={isAr ? "اسم الشركة كما في السجل التجاري" : "Company name, as on your CR"} value={company} onChange={(e) => setCompany(e.target.value)} required disabled={loading} maxLength={120} />
            <AuthLuxField label={isAr ? "وش تبيع؟ مثلاً: معدات سلامة، كابلات" : "What do you sell? e.g. safety equipment, cables"} value={sells} onChange={(e) => setSells(e.target.value)} disabled={loading} maxLength={160} />
          </AuthLuxStack>
        ) : null}
        {accountType === "vendor" ? (
          <div className="reg-cities" role="radiogroup" aria-label={isAr ? "مدينتك" : "Your city"}>
            <span>{isAr ? "مدينتك" : "Your city"}</span>
            <div>
              {CITIES.map(([en, ar]) => (
                <button key={en} type="button" role="radio" aria-checked={city === en} className={city === en ? "is-on" : ""} onClick={() => setCity(city === en ? "" : en)}>{isAr ? ar : en}</button>
              ))}
            </div>
          </div>
        ) : null}
        <AuthLuxStack>
          <AuthLuxField label={isAr ? "اسمك" : "Your name"} value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} autoComplete="name" />
          <AuthLuxField label={isAr ? "البريد" : "Work email"} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          <AuthLuxField label={accountType === "vendor" ? (isAr ? "جوال المبيعات" : "Sales mobile") : isAr ? "الجوال (اختياري)" : "Mobile (optional)"} type="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required={accountType === "vendor"} disabled={loading} />
          <AuthLuxField label={isAr ? "كلمة المرور (٨ أحرف أو أكثر)" : "Password (8+ characters)"} revealable autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} disabled={loading} />
        </AuthLuxStack>
        {accountType === "vendor" ? (
          <ol className="reg-next">
            <li><b>{isAr ? "اليوم" : "Today"}</b>{isAr ? "أضف منتجاتك أو ارفع قائمة أسعارك" : "Add products or upload your price list"}</li>
            <li><b>{isAr ? "بعدها" : "Then"}</b>{isAr ? "أدخل رقم السجل التجاري لتحصل على العلامة الخضراء" : "Enter your CR number for the green tick"}</li>
            <li><b>{isAr ? "وبعدها" : "And"}</b>{isAr ? "توصلك طلبات المشترين وتسعّرها" : "Buyer requests reach you to quote"}</li>
          </ol>
        ) : null}
        {error && <p className="text-sm text-[#b42318]">{error}</p>}
        <button type="submit" className="auth-lux-btn" disabled={loading}>
          {loading ? (isAr ? "جارٍ إنشاء الحساب…" : "Creating account…") : accountType === "vendor" ? (isAr ? "أنشئ حساب المورد، مجاناً" : "Create supplier account, free") : isAr ? "أنشئ الحساب" : "Create account"}
        </button>
        <p className="text-center text-xs leading-relaxed text-[#111C17]/55">
          {isAr ? "بإنشاء الحساب توافق على " : "By creating an account you agree to the "}
          <Link href={`/${locale}/terms`} className="underline underline-offset-2">{isAr ? "شروط الاستخدام" : "terms"}</Link>
          {isAr ? " و" : " and "}
          <Link href={`/${locale}/marketplace-rules`} className="underline underline-offset-2">{isAr ? "قواعد السوق" : "marketplace rules"}</Link>
          {isAr ? "، ونعالج بياناتك حسب " : ", and we handle your data under the "}
          <Link href={`/${locale}/privacy`} className="underline underline-offset-2">{isAr ? "سياسة الخصوصية" : "privacy policy"}</Link>.
        </p>
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
