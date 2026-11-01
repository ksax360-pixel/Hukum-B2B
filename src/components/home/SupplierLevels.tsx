"use client";

import { Award, Check, FileBadge2, ShieldCheck, UserRoundCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function SupplierLevels({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const reduceMotion = useReducedMotion();

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
    <section className="hukum-levels" aria-labelledby="hukum-levels-title">
      <div className="container-custom">
        <motion.div
          className="hukum-levels__head"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.55, ease: easeOut }}
        >
          <h2 id="hukum-levels-title" className="hukum-levels__title">
            {isAr ? "كل مورد يظهر مستواه" : "Every supplier shows its level"}
          </h2>
          <p className="hukum-levels__subtitle" lang={isAr ? "en" : "ar"} dir="ltr">
            {isAr ? "Every supplier shows its level" : "كل مورد يظهر مستواه"}
          </p>
        </motion.div>

        <div className="hukum-levels__track" role="list">
          {levels.map((item, i) => (
            <motion.div
              key={item.level}
              className={`hukum-level hukum-level--${item.tone}`}
              role="listitem"
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.94 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.6,
                delay: reduceMotion ? 0 : 0.12 + i * 0.18,
                ease: easeOut,
              }}
            >
              {i > 0 ? (
                <motion.span
                  className="hukum-level__connector"
                  aria-hidden
                  initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                  whileInView={reduceMotion ? undefined : { scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.55,
                    delay: reduceMotion ? 0 : 0.22 + i * 0.18,
                    ease: easeOut,
                  }}
                />
              ) : null}
              <motion.div
                className="hukum-level__tile"
                aria-hidden
                initial={reduceMotion ? false : { scale: 0.72, opacity: 0 }}
                whileInView={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  type: reduceMotion ? "tween" : "spring",
                  stiffness: 280,
                  damping: 18,
                  delay: reduceMotion ? 0 : 0.2 + i * 0.18,
                }}
              >
                <item.Icon size={30} strokeWidth={1.5} />
              </motion.div>
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
            </motion.div>
          ))}
        </div>

        <motion.p
          className="hukum-levels__note"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.55, ease: easeOut }}
        >
          {isAr
            ? "التحقق يعتمد على فحوصات حكوم فقط. الشهادات وأصل المنتج والتفويض تُعرض بشكل منفصل."
            : "Verification is based on Hukum checks only. Certificates, product origin and authorisation are shown separately."}
        </motion.p>

        <motion.div
          className="hukum-levels__badges"
          aria-label={isAr ? "شهادات" : "Certifications"}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.68, ease: easeOut }}
        >
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
        </motion.div>
      </div>
    </section>
  );
}
