export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { CMSPage } from "@/modules/platform/platform.model";
import { t } from "@/lib/utils";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/faq",
    isAr ? "الأسئلة الشائعة | Hukum" : "FAQ | Hukum",
    isAr ? "إجابات عن التسجيل وطلبات عروض الأسعار والمنصة ثنائية اللغة." : "Answers about registration, RFQs and the bilingual Hukum platform."
  );
}

const fallbackFaqs = (isAr: boolean) =>
  isAr
    ? [
        { q: "من يمكنه التسجيل؟", a: "المشترون المؤسسيون والموردون المعتمدون عبر عملية تحقق." },
        { q: "كيف تعمل طلبات عروض الأسعار؟", a: "ينشئ المشتري RFQ، ثم تتم مطابقة الموردين وإرسال الدعوات." },
        { q: "هل المنصة ثنائية اللغة؟", a: "نعم — العربية والإنجليزية مدعومتان في الواجهة والمحتوى." },
      ]
    : [
        { q: "Who can register?", a: "Enterprise buyers and vendors who complete verification." },
        { q: "How do RFQs work?", a: "Buyers publish an RFQ; the platform matches and invites relevant vendors." },
        { q: "Is the platform bilingual?", a: "Yes — Arabic and English are supported across the experience." },
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

  return (
    <div className="container-custom section max-w-3xl">
      <div className="mb-10 space-y-3">
        <p className="label-caps">FAQ</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--ink)]">
          {isAr ? "الأسئلة الشائعة" : "Frequently asked questions"}
        </h1>
      </div>

      <div className="space-y-4">
        {cmsFaqs.map((item) => (
          <details key={String(item._id)} className="surface-card p-5 group">
            <summary className="font-semibold cursor-pointer list-none flex justify-between gap-4">
              {t(locale, item.title as { en?: string; ar?: string })}
              <span className="text-[var(--muted)] group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
              {t(locale, item.body as { en?: string; ar?: string })}
            </p>
          </details>
        ))}

        {cmsFaqs.length === 0 &&
          staticFaqs.map((item) => (
            <details key={item.q} className="surface-card p-5 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between gap-4">
                {item.q}
                <span className="text-[var(--muted)] group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">{item.a}</p>
            </details>
          ))}
      </div>
    </div>
  );
}
