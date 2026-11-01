import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  ArrowUpRight,
  Award,
  Inbox,
  Package,
  Percent,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { sellerRegisterUrl } from "@/lib/seller-admin";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/become-a-vendor", "ignored", undefined, { seoKey: "become-a-vendor" });
}

export default async function BecomeAVendorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const registerHref = sellerRegisterUrl();

  const steps = [
    {
      n: "1",
      Icon: ScrollText,
      title: isAr ? "سجّل" : "Register",
      text: isAr ? "أضف رقم السجل التجاري" : "Add your CR number",
      filled: false,
    },
    {
      n: "2",
      Icon: Package,
      title: isAr ? "أدرج المنتجات" : "List products",
      text: isAr ? "ارفع كتالوجك" : "Upload your catalogue",
      filled: false,
    },
    {
      n: "3",
      Icon: Inbox,
      title: isAr ? "استقبل الطلبات" : "Receive requests",
      text: isAr ? "المشترون يتواصلون مباشرة" : "Buyers contact you directly",
      filled: true,
    },
  ];

  const perks = [
    {
      Icon: Award,
      label: isAr ? "شارة المورد المؤسس" : "Founding Supplier badge",
    },
    {
      Icon: ShieldCheck,
      label: isAr ? "مستوى موثّق" : "Verified level",
    },
    {
      Icon: Percent,
      label: isAr ? "بدون عمولة" : "No commission",
    },
  ];

  return (
    <section className="hukum-page hukum-become" aria-labelledby="hukum-become-title">
      <div className="container-custom hukum-become__wrap">
        <nav aria-label={isAr ? "مسار التنقل" : "Breadcrumb"} className="mb-6 w-full text-start">
          <ol className="hukum-page-header__crumb">
            <li>
              <Link href={`/${locale}`}>{isAr ? "الرئيسية" : "Home"}</Link>
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="hukum-page-header__crumb-sep" aria-hidden>
                /
              </span>
              <span>{isAr ? "كن مورداً" : "Become a supplier"}</span>
            </li>
          </ol>
        </nav>

        <div className="hukum-become__seal" aria-hidden>
          <svg className="hukum-become__seal-ring" viewBox="0 0 200 200">
            <defs>
              <path
                id="hukum-become-circle"
                d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
              />
            </defs>
            <text className="hukum-become__seal-path">
              <textPath href="#hukum-become-circle" startOffset="0%">
                FREE THROUGHOUT 2027 • FOUNDING SUPPLIER • FREE THROUGHOUT 2027 • FOUNDING SUPPLIER •
              </textPath>
            </text>
          </svg>
          <div className="hukum-become__seal-core">
            <span>FREE TO JOIN</span>
          </div>
        </div>

        <h1 id="hukum-become-title" className="hukum-become__title">
          {isAr ? "كن مورداً" : "Become a supplier"}
        </h1>
        <p className="hukum-become__arabic" lang="ar" dir="rtl">
          كن مورداً على حكم
        </p>
        <p className="hukum-become__lead">
          {isAr
            ? "ثلاث خطوات. حوالي خمس دقائق. مجاناً طوال 2027."
            : "Three steps. About five minutes. Free throughout 2027."}
        </p>

        <ol className="hukum-become__steps">
          {steps.map((step, i) => (
            <li key={step.n} className="hukum-become__step">
              {i > 0 ? <span className="hukum-become__connector" aria-hidden /> : null}
              <div className={`hukum-become__icon${step.filled ? " is-filled" : ""}`}>
                <step.Icon size={28} strokeWidth={1.6} aria-hidden />
                <span className="hukum-become__num">{step.n}</span>
              </div>
              <h2 className="hukum-become__step-title">{step.title}</h2>
              <p className="hukum-become__step-text">{step.text}</p>
            </li>
          ))}
        </ol>

        <a href={registerHref} target="_blank" rel="noreferrer" className="hukum-become__cta">
          <span>{isAr ? "انضم كمورد" : "Become a supplier"}</span>
          <ArrowUpRight size={16} strokeWidth={1.85} aria-hidden />
        </a>

        <ul className="hukum-become__perks">
          {perks.map((perk) => (
            <li key={perk.label} className="hukum-become__perk">
              <perk.Icon size={15} strokeWidth={1.75} aria-hidden />
              <span>{perk.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
