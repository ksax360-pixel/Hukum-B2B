import Link from "next/link";
import { Building2, Headphones, MessageSquareText, Scale } from "lucide-react";
import type { Locale } from "@/i18n/config";
import {
  sourcingWhatsAppHref,
  sourcingWhatsAppIsExternal,
} from "@/lib/sourcing-contact";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

export function ConciergeSourcing({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const waHref = sourcingWhatsAppHref(locale);
  const waExternal = sourcingWhatsAppIsExternal();

  const flow = [
    {
      Icon: MessageSquareText,
      title: isAr ? "تخبرنا" : "You tell us",
    },
    {
      Icon: Building2,
      title: isAr ? "نجد الموردين" : "We find vendors",
    },
    {
      Icon: Scale,
      title: isAr ? "تقارن" : "You compare",
    },
  ];

  return (
    <section className="hukum-concierge">
      <div className="container-custom">
        <div className="hukum-concierge__panel">
          <div className="hukum-concierge__pattern" aria-hidden />
          <div className="hukum-concierge__frame" aria-hidden />
          <div className="hukum-concierge__inner">
            <span className="hukum-concierge__icon" aria-hidden>
              <Headphones size={24} strokeWidth={1.6} />
            </span>
            <p className="hukum-concierge__eyebrow">
              {isAr ? "مساعدة التوريد · مجاناً للمشترين" : "Get sourcing help · Free for buyers"}
            </p>
            <h2 className="hukum-concierge__title">
              {isAr ? "لم تجده؟ نحن نوفّره." : "Can’t find it? We’ll source it."}
            </h2>
            <p className="hukum-concierge__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
              {isAr ? "Can’t find it? We’ll source it." : "لم تجده؟ نحن نوفّره."}
            </p>

            <div className="hukum-concierge__flow">
              {flow.map((item, i) => (
                <div key={item.title} className="hukum-concierge__flow-item">
                  {i > 0 ? <span className="hukum-concierge__flow-line" aria-hidden /> : null}
                  <span className="hukum-concierge__flow-icon" aria-hidden>
                    <item.Icon size={18} strokeWidth={1.7} />
                  </span>
                  <p className="hukum-concierge__flow-title">{item.title}</p>
                </div>
              ))}
            </div>

            <div className="hukum-concierge__actions">
              <Link href={`/${locale}/contact`} className="hukum-concierge__btn-gold">
                {isAr ? "اطلب مساعدة التوريد" : "Request sourcing help"}
              </Link>
              {waExternal ? (
                <a href={waHref} target="_blank" rel="noreferrer" className="hukum-concierge__btn-outline">
                  <WhatsAppIcon />
                  {isAr ? "محادثة واتساب" : "Chat on WhatsApp"}
                </a>
              ) : (
                <Link href={waHref} className="hukum-concierge__btn-outline">
                  <WhatsAppIcon />
                  {isAr ? "محادثة واتساب" : "Chat on WhatsApp"}
                </Link>
              )}
            </div>

            <div className="hukum-concierge__advisor">
              <span className="hukum-concierge__advisor-icon" aria-hidden>
                <Headphones size={16} strokeWidth={1.75} />
              </span>
              <div>
                <p className="hukum-concierge__advisor-title">
                  {isAr
                    ? "مستشار توريد حكوم يتولى طلبك"
                    : "A Hukum sourcing advisor handles your request"}
                </p>
                <p className="hukum-concierge__advisor-meta">
                  {isAr
                    ? "العربية والإنجليزية · ساعات العمل في صفحة التواصل"
                    : "Arabic & English · working hours shown on Contact"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
