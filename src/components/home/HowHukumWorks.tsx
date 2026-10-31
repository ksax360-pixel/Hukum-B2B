import Link from "next/link";
import { ArrowRight, Handshake, Scale, Search } from "lucide-react";
import type { Locale } from "@/i18n/config";

export function HowHukumWorks({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const steps = [
    {
      n: "01",
      title: isAr ? "ابحث" : "Search",
      text: isAr
        ? "ابحث بالمنتج أو العلامة أو المورد، أو صف احتياجك بالعربية أو الإنجليزية."
        : "Search by product, brand or supplier — or describe your need in English or Arabic.",
      Icon: Search,
      active: false,
      chips: [{ label: isAr ? "حديد تسليح 12مم" : "Rebar 12mm", tone: "search" as const }],
    },
    {
      n: "02",
      title: isAr ? "قارن" : "Compare",
      text: isAr
        ? "راجع عروض الأسعار جنباً إلى جنب: السعر، الحد الأدنى، ومدة التوريد."
        : "Review quotations side by side — price, MOQ and lead time in one view.",
      Icon: Scale,
      active: false,
      chips: [
        { label: isAr ? "3 عروض" : "3 quotes", tone: "neutral" as const },
        { label: isAr ? "جنبًا إلى جنب" : "Side by side", tone: "neutral" as const },
      ],
    },
    {
      n: "03",
      title: isAr ? "تواصل" : "Connect",
      text: isAr
        ? "تواصل مباشرة مع الموردين الموثّقين وأتمم الشراء بثقة."
        : "Talk to verified suppliers directly and close procurement with confidence.",
      Icon: Handshake,
      active: true,
      chips: [{ label: isAr ? "الرسائل" : "Messages", tone: "success" as const }],
    },
  ];

  return (
    <section className="hukum-how">
      <div className="container-custom hukum-how__grid">
        <div className="hukum-how__copy">
          <h2 className="hukum-how__title">{isAr ? "كيف تعمل حكوم" : "How Hukum works"}</h2>
          <p className="hukum-how__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
            {isAr ? "How Hukum works" : "كيف تعمل حكوم"}
          </p>
          <p className="hukum-how__lead">
            {isAr
              ? "من البحث إلى العرض إلى التواصل — مسار شراء واضح مع موردين موثّقين في السعودية."
              : "From search to quote to conversation — a clear buying path with verified Saudi suppliers."}
          </p>
          <Link href={`/${locale}/rfq`} className="hukum-how__cta">
            {isAr ? "اطلب عروض أسعار" : "Request quotes"}
            <ArrowRight size={15} strokeWidth={2.25} className="rtl:rotate-180" />
          </Link>
        </div>

        <ol className="hukum-how__steps">
          {steps.map((step) => (
            <li key={step.n} className={`hukum-how__step${step.active ? " is-active" : ""}`}>
              <div className="hukum-how__rail" aria-hidden>
                <span className={`hukum-how__icon${step.active ? " is-filled" : ""}`}>
                  <step.Icon size={20} strokeWidth={1.75} />
                </span>
              </div>
              <div className="hukum-how__content">
                <p className="hukum-how__num">
                  {isAr ? `الخطوة ${step.n}` : `Step ${step.n}`}
                </p>
                <h3 className="hukum-how__step-title">{step.title}</h3>
                <p className="hukum-how__step-text">{step.text}</p>
              </div>
              <div className="hukum-how__chips">
                {step.chips.map((chip) => (
                  <span key={chip.label} className={`hukum-how__chip hukum-how__chip--${chip.tone}`}>
                    {chip.tone === "success" ? <span className="hukum-how__chip-dot" aria-hidden /> : null}
                    {chip.label}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
