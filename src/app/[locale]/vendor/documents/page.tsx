import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BadgeCheck, Check, Clock, Factory, Lock, ShieldAlert, Star, UserCheck } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VerificationForm } from "@/components/vendor/VerificationForm";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { Vendor } from "@/modules/vendors/vendor.model";

type Doc = { verificationStatus?: string; verificationRejectionReason?: string; crNumber?: string; vatNumber?: string };
const mask = (v?: string): string => (v ? `${"•".repeat(Math.max(0, v.length - 4))}${v.slice(-4)}` : "");

/** Supplier verification: the trust ladder, where they are on it, and the one thing to do next. */
export default async function VendorVerificationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/documents`)}`);

  let v: Doc | null = null;
  try {
    await connectDB();
    if (session.vendorId) v = (await Vendor.findById(session.vendorId).select("verificationStatus verificationRejectionReason crNumber vatNumber").lean()) as Doc | null;
  } catch (e) {
    console.error("[vendor/documents]", e);
  }
  const status = v?.verificationStatus || "unverified";
  const verified = status === "verified";
  const ladder = [
    { icon: UserCheck, title: L("Registered", "مسجّل"), body: L("Your account and storefront exist. Buyers can find your products.", "حسابك ومتجرك موجودين. المشترون يقدرون يلقون منتجاتك."), state: "done" },
    { icon: BadgeCheck, title: L("Verified", "موثّق"), body: L("CR checked with Wathq, VAT with ZATCA. You get the green tick and show in “Verified only” searches.", "السجل متحقق منه عبر واثق والضريبة عبر الزكاة. تحصل العلامة الخضراء وتظهر في بحث «الموثّقين فقط»."), state: verified ? "done" : status === "pending" ? "now" : "next" },
    { icon: Factory, title: L("Verified Pro", "موثّق برو"), body: L("A deeper check of your site and capacity. Opens later.", "تحقق أعمق من موقعك وطاقتك. يفتح لاحقاً."), state: "later" },
    { icon: Star, title: L("Performance badges", "شارات الأداء"), body: L("Earned from how you answer buyers: quick replies, quotes accepted.", "تكسبها من تعاملك مع المشترين: رد سريع وعروض مقبولة."), state: "later" },
  ];

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <div className="bh vv" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Verification", "التوثيق")}</h1>
            <p>{L("Buyers filter for verified suppliers. Verification is free.", "المشترون يفلترون على الموردين الموثّقين. التوثيق مجاني.")}</p>
          </div>
        </header>

        <ol className="vv-ladder">
          {ladder.map((s) => (
            <li key={s.title} className={`is-${s.state}`}>
              <span className="vv-ladder__icon">{s.state === "done" ? <Check size={18} aria-hidden /> : <s.icon size={18} aria-hidden />}</span>
              <b>{s.title}</b>
              <p>{s.body}</p>
              <small>
                {s.state === "done" ? L("Done", "تم") : s.state === "now" ? L("Being checked", "قيد التحقق") : s.state === "next" ? L("Your next step", "خطوتك الجاية") : L("Later", "لاحقاً")}
              </small>
            </li>
          ))}
        </ol>

        <section className="sfe-card vv-card" aria-labelledby="vv-now">
          {verified ? (
            <>
              <div className="vv-state is-ok"><BadgeCheck size={22} aria-hidden /><div><h2 id="vv-now">{L("You're verified", "حسابك موثّق")}</h2><p>{L("The green tick shows on your storefront, products and quotes.", "العلامة الخضراء تظهر في متجرك ومنتجاتك وعروضك.")}</p></div></div>
              <dl className="vv-facts">
                <div><dt>{L("CR number", "رقم السجل")}</dt><dd dir="ltr">{mask(v?.crNumber) || "—"}</dd></div>
                <div><dt>{L("VAT number", "الرقم الضريبي")}</dt><dd dir="ltr">{mask(v?.vatNumber) || L("Not added", "غير مضاف")}</dd></div>
              </dl>
              <p className="sfe-lock"><Lock size={14} aria-hidden /> {L("To change these, contact support. Changing them means checking again.", "لتغييرها تواصل مع الدعم. التغيير يعني تحقق جديد.")} <Link href={`/${locale}/vendor/tickets`}>{L("Contact support", "تواصل مع الدعم")}</Link></p>
            </>
          ) : status === "pending" ? (
            <>
              <div className="vv-state is-wait"><Clock size={22} aria-hidden /><div><h2 id="vv-now">{L("We're checking your details", "نتحقق من بياناتك")}</h2><p>{L("We'll tell you here and by email when it's done. You can keep adding products and quoting meanwhile.", "بنبلغك هنا وبالإيميل لما نخلص. تقدر تكمل إضافة منتجات والتسعير.")}</p></div></div>
              <dl className="vv-facts">
                <div><dt>{L("CR number", "رقم السجل")}</dt><dd dir="ltr">{mask(v?.crNumber) || "—"}</dd></div>
                <div><dt>{L("VAT number", "الرقم الضريبي")}</dt><dd dir="ltr">{mask(v?.vatNumber) || L("Not added", "غير مضاف")}</dd></div>
              </dl>
            </>
          ) : status === "suspended" ? (
            <div className="vv-state is-bad"><ShieldAlert size={22} aria-hidden /><div><h2 id="vv-now">{L("Your account is paused", "حسابك موقوف مؤقتاً")}</h2><p>{L("Buyers can't see your storefront right now.", "المشترون ما يشوفون متجرك حالياً.")} <Link href={`/${locale}/vendor/tickets`}>{L("Talk to support", "كلّم الدعم")}</Link></p></div></div>
          ) : (
            <>
              {status === "rejected" ? (
                <div className="vv-state is-bad"><ShieldAlert size={22} aria-hidden /><div><h2 id="vv-now">{L("We couldn't verify you", "ما قدرنا نوثّقك")}</h2><p>{v?.verificationRejectionReason || L("The details didn't match the official register.", "البيانات ما طابقت السجل الرسمي.")} {L("Fix them below and send again.", "صححها تحت وأرسل مرة ثانية.")}</p></div></div>
              ) : (
                <div className="sfe-card__head"><h2 id="vv-now">{L("Get verified", "وثّق حسابك")}</h2><p>{L("Two numbers. No documents to scan.", "رقمين بس. بدون مستندات.")}</p></div>
              )}
              <VerificationForm locale={locale} cr={v?.crNumber || ""} vat={v?.vatNumber || ""} />
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
