import type { Locale } from "@/i18n/config";

export function TrustedByBuyers({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const testimonials = [
    {
      id: "alfanar",
      logo: "/brand/trust/alfanar.png",
      alt: "alfanar",
      quote: isAr
        ? "أرسلنا طلباً واحداً وحصلنا على ثلاثة عروض موثّقة في الصباح نفسه. وفّر علينا أسبوعاً من المكالمات."
        : "We sent one request and had three verified quotes the same morning. It replaced a week of phone calls.",
    },
    {
      id: "lt",
      logo: "/brand/trust/lt-construction.png",
      alt: "L&T Construction",
      quote: isAr
        ? "إمكانية رؤية فحص السجل التجاري لكل مورد هي ما جعل فريق المالية مرتاحاً."
        : "Being able to see the CR check on every supplier is what made our finance team comfortable.",
    },
    {
      id: "habib",
      logo: "/brand/trust/dr-sulaiman-alhabib.png",
      alt: "Dr Sulaiman Al Habib Medical Group",
      quote: isAr
        ? "أرسلت طلب عرض الأسعار عبر واتساب من الموقع. حكوم أعادت موردين قبل الظهيرة."
        : "I sent our RFQ on WhatsApp from site. Hukum came back with vendors before lunch.",
    },
  ];

  return (
    <section className="hukum-trust" aria-labelledby="hukum-trust-title">
      <div className="container-custom hukum-trust__wrap">
        <div className="hukum-trust__head">
          <div className="hukum-trust__titles">
            <h2 id="hukum-trust-title" className="hukum-trust__title">
              {isAr ? "موثوق من المشترين في المملكة" : "Trusted by Saudi buyers"}
            </h2>
            <p className="hukum-trust__arabic" lang={isAr ? "en" : "ar"} dir="ltr">
              {isAr ? "Trusted by Saudi buyers" : "موثوق من المشترين في المملكة"}
            </p>
          </div>
        </div>

        <ul className="hukum-trust__grid">
          {testimonials.map((item) => (
            <li key={item.id} className="hukum-trust__card">
              <span className="hukum-trust__quote" aria-hidden>
                ”
              </span>
              <p className="hukum-trust__text">{item.quote}</p>
              <div className="hukum-trust__brand">
                <img
                  src={item.logo}
                  alt={item.alt}
                  className="hukum-trust__logo"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
