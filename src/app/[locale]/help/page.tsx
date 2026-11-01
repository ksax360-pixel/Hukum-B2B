import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/help", "ignored", undefined, { seoKey: "help" });
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const topics = isAr
    ? [
        { title: "بدء الشراء", body: "تعرّف على البحث وإنشاء طلب عرض ومراجعة الردود.", href: "/how-it-works", cta: "عرض دليل المشترين" },
        { title: "الأسئلة الشائعة", body: "إجابات سريعة حول الحسابات وطلبات العروض والتحقق.", href: "/faq", cta: "تصفح الإجابات" },
        { title: "تواصل مع الدعم", body: "أرسل سؤالاً عن حسابك أو استخدام المنصة أو طلب قائم.", href: "/contact", cta: "اتصل بنا" },
        { title: "الإبلاغ عن مشكلة", body: "أبلغنا عن سلوك أو إعلان أو تواصل يثير القلق.", href: "/report", cta: "إرسال بلاغ" },
      ]
    : [
        { title: "Getting started as a buyer", body: "Learn how to search, create an RFQ and review responses.", href: "/how-it-works", cta: "View the buyer guide" },
        { title: "Frequently asked questions", body: "Quick answers about accounts, RFQs and verification.", href: "/faq", cta: "Browse answers" },
        { title: "Contact support", body: "Send a question about your account, platform use or an active request.", href: "/contact", cta: "Contact us" },
        { title: "Report a concern", body: "Tell us about conduct, a listing or a communication that concerns you.", href: "/report", cta: "Submit a report" },
      ];
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "الدعم" : "Support"}
          title={isAr ? "مركز المساعدة" : "Help centre"}
          arabic={isAr ? undefined : "مركز المساعدة"}
          lead={isAr ? "اختر الموضوع الأقرب لسؤالك للوصول إلى الدليل أو قناة الدعم المناسبة." : "Choose the topic closest to your question to find the right guide or support channel."}
          crumbs={[{ label: isAr ? "الرئيسية" : "Home", href: `/${locale}` }, { label: isAr ? "مركز المساعدة" : "Help centre" }]}
        />
        <section className="grid gap-5 sm:grid-cols-2">
          {topics.map((topic, index) => (
            <article key={topic.href} className="hukum-card flex flex-col p-6">
              <span className="hukum-badge-pill w-fit">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-4 text-lg font-bold">{topic.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-[var(--hukum-muted)]">{topic.body}</p>
              <Link href={`/${locale}${topic.href}`} className="hukum-btn hukum-btn--secondary mt-5 w-fit">{topic.cta} <span aria-hidden>→</span></Link>
            </article>
          ))}
        </section>
        <section className="mt-8 rounded-[1.35rem] bg-[var(--hukum-green-dark)] p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <h2 className="text-xl font-bold">{isAr ? "لم تجد ما تحتاجه؟" : "Still need help?"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">{isAr ? "شارك التفاصيل ورقم الطلب إن وجد، وسيساعدك فريقنا في توجيه الاستفسار." : "Share the details and your request number, if available, so our team can route your enquiry."}</p>
          </div>
          <Link href={`/${locale}/contact`} className="hukum-btn hukum-btn--gold mt-5 shrink-0 sm:mt-0">{isAr ? "تواصل مع الفريق" : "Contact the team"}</Link>
        </section>
      </div>
    </div>
  );
}
