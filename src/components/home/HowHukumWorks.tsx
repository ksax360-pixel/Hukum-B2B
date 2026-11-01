"use client";

import Link from "next/link";
import { ArrowUpRight, Handshake, Scale, Search } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function HowHukumWorks({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const reduceMotion = useReducedMotion();

  const steps = [
    {
      n: "01",
      title: isAr ? "ابحث" : "Search",
      text: isAr
        ? "ابحث بالمنتج أو العلامة أو المورد، أو صف احتياجك بالعربية أو الإنجليزية."
        : "Search by product, brand or supplier — or describe your need in English or Arabic.",
      Icon: Search,
      active: false,
    },
    {
      n: "02",
      title: isAr ? "قارن" : "Compare",
      text: isAr
        ? "راجع عروض الأسعار جنباً إلى جنب: السعر، الحد الأدنى، ومدة التوريد."
        : "Review quotations side by side — price, MOQ and lead time in one view.",
      Icon: Scale,
      active: false,
    },
    {
      n: "03",
      title: isAr ? "تواصل" : "Connect",
      text: isAr
        ? "تواصل مباشرة مع الموردين الموثّقين وأتمم الشراء بثقة."
        : "Talk to verified suppliers directly and close procurement with confidence.",
      Icon: Handshake,
      active: true,
    },
  ];

  return (
    <section className="hukum-how" aria-labelledby="hukum-how-title">
      <div className="container-custom hukum-how__wrap">
        <div className="hukum-how__grid">
          <div className="hukum-how__copy">
            <p className="hukum-how__eyebrow">
              <span className="hukum-how__eyebrow-rule" aria-hidden />
              <span>{isAr ? "مسار الشراء" : "Buying path"}</span>
            </p>
            <h2 id="hukum-how-title" className="hukum-how__title">
              {isAr ? "كيف تعمل حكوم" : "How Hukum works"}
            </h2>
            <p className="hukum-how__lead">
              {isAr
                ? "من البحث إلى العرض إلى التواصل — مسار شراء واضح مع موردين موثّقين في السعودية."
                : "From search to quote to conversation — a clear buying path with verified Saudi suppliers."}
            </p>
            <Link href={`/${locale}/rfq`} className="hukum-how__cta">
              <span>{isAr ? "اطلب عروض أسعار" : "Request quotes"}</span>
              <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
            </Link>
          </div>

          <motion.ol
            className="hukum-how__steps"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: easeOut }}
          >
            {steps.map((step, index) => (
              <motion.li
                key={step.n}
                className={`hukum-how__step${step.active ? " is-active" : ""}`}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.55,
                  delay: reduceMotion ? 0 : 0.18 + index * 0.16,
                  ease: easeOut,
                }}
              >
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
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
