export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { CMSPage } from "@/modules/platform/platform.model";
import { t } from "@/lib/utils";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, faqPageLd } from "@/modules/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/faq", "ignored", undefined, { seoKey: "faq" });
}

const fallbackFaqs = (isAr: boolean) =>
  isAr
    ? [
        {
          q: "من يمكنه التسجيل؟",
          a: "المشترون المؤسسيون والموردون الذين يكملون التحقق عبر حكوم.",
        },
        {
          q: "كيف تعمل طلبات عروض الأسعار؟",
          a: "ينشئ المشتري طلباً واحداً، ثم تتم مطابقة الموردين المناسبين وإرسال الدعوات.",
        },
        {
          q: "هل المنصة ثنائية اللغة؟",
          a: "نعم — العربية والإنجليزية مدعومتان في الواجهة والمحتوى.",
        },
        {
          q: "ماذا تعني مستويات التحقق؟",
          a: "مسجّل، وفحص السجل التجاري، وموثّق — تُكتسب عبر فحوصات حكوم ولا تُشترى.",
        },
      ]
    : [
        {
          q: "Who can register?",
          a: "Enterprise buyers and suppliers who complete Hukum verification.",
        },
        {
          q: "How do RFQs work?",
          a: "Buyers submit one request; Hukum matches relevant suppliers and invites them to quote.",
        },
        {
          q: "Is the platform bilingual?",
          a: "Yes — Arabic and English are supported across the experience.",
        },
        {
          q: "What do verification levels mean?",
          a: "Registered, CR checked and Verified — earned through Hukum checks, never bought.",
        },
      ];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  let cmsFaqs: Array<Record<string, unknown>> = [];

  try {
    await connectDB();
    cmsFaqs = await CMSPage.find({ status: "published", type: "faq" }).sort({ createdAt: 1 }).lean();
  } catch {
    /* offline */
  }

  const staticFaqs = fallbackFaqs(isAr);
  const displayedFaqs =
    cmsFaqs.length > 0
      ? cmsFaqs.map((item) => ({
          q: t(locale, item.title as { en?: string; ar?: string }),
          a: t(locale, item.body as { en?: string; ar?: string }),
        }))
      : staticFaqs;

  return (
    <>
      <JsonLd
        data={[
          faqPageLd(displayedFaqs),
          breadcrumbLd(locale, [
            { name: isAr ? "الرئيسية" : "Home", path: "/" },
            { name: isAr ? "الأسئلة الشائعة" : "FAQ" },
          ]),
        ]}
      />
      <div className="hukum-page">
        <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "المساعدة" : "Help"}
          title={isAr ? "الأسئلة الشائعة" : "Frequently asked questions"}
          arabic={isAr ? undefined : "الأسئلة الشائعة"}
          lead={
            isAr
              ? "إجابات مباشرة عن التسجيل، طلبات العروض، والتحقق على حكوم."
              : "Straight answers on registration, quote requests and verification on Hukum."
          }
          crumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "الأسئلة الشائعة" : "FAQ" },
          ]}
        />

        <div className="hukum-accordion">
          {cmsFaqs.map((item) => (
            <details key={String(item._id)} className="hukum-accordion__item group">
              <summary className="hukum-accordion__summary">
                {t(locale, item.title as { en?: string; ar?: string })}
                <span className="text-[var(--hukum-muted)] transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="hukum-accordion__body whitespace-pre-wrap">
                {t(locale, item.body as { en?: string; ar?: string })}
              </p>
            </details>
          ))}

          {cmsFaqs.length === 0 &&
            staticFaqs.map((item) => (
              <details key={item.q} className="hukum-accordion__item group">
                <summary className="hukum-accordion__summary">
                  {item.q}
                  <span className="text-[var(--hukum-muted)] transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="hukum-accordion__body">{item.a}</p>
              </details>
            ))}
        </div>
        </div>
      </div>
    </>
  );
}
