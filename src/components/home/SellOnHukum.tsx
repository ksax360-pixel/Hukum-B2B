import Link from "next/link";
import { Award, Check, Inbox, Store } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { sellerRegisterUrl } from "@/lib/seller-admin";

export function SellOnHukum({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const features = [
    {
      Icon: Store,
      title: isAr ? "صفحة شركتك" : "Your company page",
      text: isAr
        ? "تُنشر بعد مراجعة بياناتك"
        : "Published after review of your details",
    },
    {
      Icon: Inbox,
      title: isAr ? "طلبات المشترين" : "Buyer requests",
      text: isAr ? "مطابقة لما تبيعه" : "Matched to what you sell",
    },
    {
      Icon: Award,
      title: isAr ? "مستوى التحقق" : "Verification level",
      text: isAr
        ? "يُكتسب عبر فحوصات حكوم، ولا يُشترى"
        : "Earned through Hukum checks, never bought",
    },
  ];

  return (
    <section className="hukum-sell">
      <div className="container-custom">
        <div className="hukum-sell__panel">
          <div className="hukum-sell__copy">
            <span className="hukum-sell__tag">
              {isAr ? "إدراج تعريفي مجاني" : "Introductory free listing"}
            </span>
            <h2 className="hukum-sell__title">
              {isAr ? "بِع لمشترين في أنحاء المملكة" : "Sell to buyers across the Kingdom"}
            </h2>
            <p className="hukum-sell__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
              {isAr
                ? "Sell to buyers across the Kingdom"
                : "بِع لمشترين في أنحاء المملكة"}
            </p>
            <div className="hukum-sell__actions">
              <a
                href={sellerRegisterUrl()}
                target="_blank"
                rel="noreferrer"
                className="hukum-sell__cta"
              >
                {isAr ? "انضم كمورد" : "Become a supplier"}
              </a>
              <Link href={`/${locale}/faq`} className="hukum-sell__secondary">
                {isAr ? "كيف يعمل التحقق" : "How verification works"}
              </Link>
            </div>
          </div>

          <ul className="hukum-sell__list">
            {features.map((f) => (
              <li key={f.title} className="hukum-sell__item">
                <span className="hukum-sell__item-icon" aria-hidden>
                  <f.Icon size={18} strokeWidth={1.75} />
                </span>
                <div className="hukum-sell__item-copy">
                  <h3 className="hukum-sell__item-title">{f.title}</h3>
                  <p className="hukum-sell__item-text">{f.text}</p>
                </div>
                <span className="hukum-sell__check" aria-hidden>
                  <Check size={14} strokeWidth={2.5} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
