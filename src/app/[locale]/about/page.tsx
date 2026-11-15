export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  Check,
  GitCompareArrows,
  Handshake,
  Search,
  Send,
  X,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/about", "ignored", undefined, { seoKey: "about" });
}

/** About: who Hukum is, how buying works, what we do — and what we never do. */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const n = (value: number): string => value.toLocaleString(isAr ? "ar-SA" : "en-US");

  let stats: { suppliers: number; verified: number; products: number; cities: number } | null = null;
  try {
    await connectDB();
    const live: Record<string, unknown> = { status: { $nin: ["suspended", "rejected", "expired"] } };
    const [suppliers, verified, products, cities] = await Promise.all([
      Vendor.countDocuments(live),
      Vendor.countDocuments({ ...live, verificationStatus: "verified" }),
      Product.countDocuments({ status: "published" }),
      Vendor.distinct("location.city", live),
    ]);
    stats = { suppliers, verified, products, cities: cities.filter(Boolean).length };
  } catch (e) {
    console.error("[about] stats", e);
  }

  const steps = [
    {
      n: "01",
      tone: "green" as const,
      icon: Search,
      title: L("Search", "ابحث"),
      text: L(
        "Browse sectors or describe what you need — in Arabic or English.",
        "تصفّح القطاعات أو اكتب احتياجك — بالعربي أو الإنجليزي."
      ),
    },
    {
      n: "02",
      tone: "gold" as const,
      icon: Send,
      title: L("Request", "اطلب"),
      text: L(
        "Send one request. We route it to suppliers who actually sell it.",
        "أرسل طلباً واحداً. نوجّهه للموردين اللي فعلاً يبيعونه."
      ),
    },
    {
      n: "03",
      tone: "ink" as const,
      icon: GitCompareArrows,
      title: L("Compare", "قارن"),
      text: L(
        "See real quotes side by side — price, lead time, and terms.",
        "قارن عروضاً حقيقية جنباً إلى جنب — السعر والمدة والشروط."
      ),
    },
    {
      n: "04",
      tone: "deep" as const,
      icon: Handshake,
      title: L("Connect", "تواصل"),
      text: L(
        "Talk through Hukum. Your number stays private until you choose.",
        "تواصل عبر حكم. رقمك يبقى خاصاً حتى تختار."
      ),
    },
  ];

  const weDo = [
    L("Verify supplier registration and company documents", "نتحقق من تسجيل المورد ووثائق الشركة"),
    L("Route your request to suppliers who match the need", "نوجّه طلبك للموردين المناسبين للاحتياج"),
    L("Keep first contact private until you decide to share", "نبقي أول تواصل خاصاً حتى تقرر المشاركة"),
    L("Show live marketplace numbers — never padded counts", "نعرض أرقاماً حية من السوق — بدون تضخيم"),
  ];

  const weDont = [
    L("Sell products ourselves or hold inventory", "نبيع منتجات بأنفسنا أو نخزّن بضاعة"),
    L("Set prices or take a cut of your deal", "نحدد الأسعار أو نأخذ عمولة من صفقتك"),
    L("Sell verification badges or bury unpaid suppliers", "نبيع علامات التوثيق أو نخفي الموردين غير المدفوعين"),
    L("Hand over your phone number without your consent", "نعطي رقم جوالك بدون موافقتك"),
  ];

  return (
    <div className="abt" dir={isAr ? "rtl" : "ltr"}>
      <header className="abt-hero">
        <div className="abt-hero__watermarks" aria-hidden>
          <span className="abt-hero__mark" />
        </div>
        <div className="abt-hero__center">
          <span className="abt-hero__rule" aria-hidden />
          <p className="abt-hero__brand">Hukum</p>
          <h1 className="abt-hero__title">
            {isAr ? (
              <>
                <span className="abt-hero__title-ink">من</span>{" "}
                <span className="abt-hero__title-green">نحن</span>
              </>
            ) : (
              <>
                <span className="abt-hero__title-ink">About</span>{" "}
                <span className="abt-hero__title-green">us</span>
              </>
            )}
          </h1>
          <p className="abt-hero__ar" lang={isAr ? "en" : "ar"}>
            {isAr ? "About us" : "من نحن"}
          </p>
        </div>
      </header>

      <div className="abt__wrap">
        <section className="abt-how" aria-labelledby="abt-how-h">
          <div className="abt-how__intro">
            <p className="abt-how__eyebrow">
              <span className="abt-how__eyebrow-rule" aria-hidden />
              <span>{L("The marketplace", "السوق")}</span>
            </p>
            <h2 id="abt-how-h">{L("How Hukum works", "كيف يعمل حكم")}</h2>
            <p className="abt-how__lead">
              {L(
                "Hukum connects buyers with verified suppliers across the Kingdom — free to search, request, and compare, with deals closed directly between you.",
                "حكم يربط المشترين بموردين موثّقين عبر المملكة — بحث وطلب ومقارنة مجاناً، والصفقة مباشرة بينكم."
              )}
            </p>
            <p className="abt-how__sub">
              {L(
                "Four clear steps from need to conversation — built for how Saudi businesses actually buy.",
                "أربع خطوات واضحة من الاحتياج إلى المحادثة — مصمّمة لطريقة الشراء في السعودية."
              )}
            </p>
            <div className="abt-how__actions">
              <Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--gold hukum-btn--lg">
                {L("Request quotes", "اطلب عروض أسعار")}
              </Link>
              <Link href={`/${locale}/become-a-vendor`} className="hukum-btn hukum-btn--ghost hukum-btn--lg">
                {L("Become a supplier", "كن مورداً")}
              </Link>
            </div>
          </div>
          <ol className="abt-how__grid">
            {steps.map((s) => (
              <li key={s.n} className="abt-how__card">
                <span className="abt-how__num" aria-hidden>
                  {s.n}
                </span>
                <span className={`abt-how__icon abt-how__icon--${s.tone}`} aria-hidden>
                  <s.icon size={18} strokeWidth={1.75} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="abt-do" aria-labelledby="abt-do-h">
          <div className="abt-sec__head">
            <h2 id="abt-do-h">{L("What we do — and don’t", "وش نسوي — ووش ما نسوي")}</h2>
            <p>
              {L(
                "Hukum is a marketplace and trust layer — not a middleman on your deal.",
                "حكم سوق وطبقة ثقة — مو وسيط على صفقتك."
              )}
            </p>
          </div>
          <div className="abt-do__grid">
            <article className="abt-do__card abt-do__card--yes">
              <h3>
                <Check size={18} strokeWidth={2.25} aria-hidden />
                {L("We do", "نسوي")}
              </h3>
              <ul>
                {weDo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="abt-do__card abt-do__card--no">
              <h3>
                <X size={18} strokeWidth={2.25} aria-hidden />
                {L("We don’t", "ما نسوي")}
              </h3>
              <ul>
                {weDont.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {stats ? (
          <section className="abt-stats" aria-labelledby="abt-stats-h">
            <div className="abt-sec__head abt-sec__head--row">
              <div>
                <h2 id="abt-stats-h">{L("Hukum today", "حكم اليوم")}</h2>
                <p>{L("Live counts from the marketplace.", "أرقام حية من السوق.")}</p>
              </div>
            </div>
            <dl className="abt-stats__grid">
              <div>
                <dd>{n(stats.suppliers)}</dd>
                <dt>{L("Suppliers listed", "موردون مسجّلون")}</dt>
              </div>
              <div>
                <dd>{n(stats.verified)}</dd>
                <dt>{L("Verified suppliers", "موردون موثّقون")}</dt>
              </div>
              <div>
                <dd>{n(stats.products)}</dd>
                <dt>{L("Products listed", "منتجات معروضة")}</dt>
              </div>
              <div>
                <dd>{n(stats.cities)}</dd>
                <dt>{L("Supplier cities", "مدن الموردين")}</dt>
              </div>
            </dl>
          </section>
        ) : null}

        <aside className="abt-saudi">
          <div className="abt-saudi__copy">
            <h2>{L("Supporting Saudi businesses", "ندعم الأعمال السعودية")}</h2>
            <p>
              {L(
                "Helping SMEs and manufacturers across the Kingdom reach more buyers through transparent procurement.",
                "نساعد المنشآت والمصانع عبر المملكة تصل لمشترين أكثر عبر توريد شفاف."
              )}
            </p>
          </div>
          <div className="abt-saudi__actions">
            <Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--gold hukum-btn--lg">
              {L("Request quotes", "اطلب عروض أسعار")}
            </Link>
            <Link href={`/${locale}/become-a-vendor`} className="abt-saudi__ghost">
              {L("Become a supplier", "كن مورداً")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
