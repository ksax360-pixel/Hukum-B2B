import { Award, Check, FileBadge2, ShieldCheck, UserRoundCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";

export function SupplierLevels({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const levels = [
    {
      level: "1",
      title: isAr ? "مسجّل" : "Registered",
      Icon: UserRoundCheck,
      tone: "soft" as const,
      tags: [
        { en: "Profile", ar: "الملف" },
        { en: "Contact", ar: "التواصل" },
      ],
    },
    {
      level: "2",
      title: isAr ? "سجل تجاري" : "CR checked",
      Icon: FileBadge2,
      tone: "mid" as const,
      tags: [
        { en: "CR", ar: "س.ت" },
        { en: "Licences", ar: "التراخيص" },
      ],
    },
    {
      level: "3",
      title: isAr ? "موثّق" : "Verified",
      Icon: ShieldCheck,
      tone: "strong" as const,
      tags: [{ en: "Human review", ar: "مراجعة بشرية" }],
    },
  ];

  const badges = [
    { en: "Made in Saudi", ar: "صُنع في السعودية", featured: true, medal: false },
    { en: "ISO 9001", ar: "ISO 9001", featured: false, medal: false },
    { en: "SASO", ar: "ساسو", featured: false, medal: false },
    { en: "SFDA", ar: "الغذاء والدواء", featured: false, medal: false },
    { en: "Authorised distributor", ar: "موزّع معتمد", featured: false, medal: true },
  ];

  return (
    <section className="hukum-levels">
      <div className="container-custom">
        <div className="hukum-levels__head">
          <h2 className="hukum-levels__title">
            {isAr ? "كل مورد يظهر مستواه" : "Every supplier shows its level"}
          </h2>
          <p className="hukum-levels__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
            {isAr ? "Every supplier shows its level" : "كل مورد يظهر مستواه"}
          </p>
        </div>

        <div className="hukum-levels__track" role="list">
          {levels.map((item, i) => (
            <div key={item.level} className={`hukum-level hukum-level--${item.tone}`} role="listitem">
              {i > 0 ? <span className="hukum-level__connector" aria-hidden /> : null}
              <div className="hukum-level__tile" aria-hidden>
                <item.Icon size={30} strokeWidth={1.5} />
              </div>
              <p className="hukum-level__num">
                {isAr ? `المستوى ${item.level}` : `Level ${item.level}`}
              </p>
              <h3 className="hukum-level__title">{item.title}</h3>
              <div className="hukum-level__tags">
                {item.tags.map((tag) => (
                  <span key={tag.en} className="hukum-level__tag">
                    {isAr ? tag.ar : tag.en}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="hukum-levels__note">
          {isAr
            ? "التحقق يعتمد على فحوصات حكوم فقط. الشهادات وأصل المنتج والتفويض تُعرض بشكل منفصل."
            : "Verification is based on Hukum checks only. Certificates, product origin and authorisation are shown separately."}
        </p>

        <div className="hukum-levels__badges" aria-label={isAr ? "شهادات" : "Certifications"}>
          <span className="hukum-levels__shown">
            {isAr ? "تُعرض بشكل منفصل" : "Shown separately"}
          </span>
          {badges.map((b) => (
            <span
              key={b.en}
              className={`hukum-levels__badge${b.featured ? " is-featured" : ""}`}
            >
              {b.featured ? (
                <span className="hukum-levels__flag" aria-hidden />
              ) : b.medal ? (
                <Award size={12} strokeWidth={2.4} className="hukum-levels__check" aria-hidden />
              ) : (
                <Check size={12} strokeWidth={2.5} className="hukum-levels__check" aria-hidden />
              )}
              {isAr ? b.ar : b.en}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
