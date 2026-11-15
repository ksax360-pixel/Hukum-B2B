"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { HowHukumViz } from "@/components/home/HowHukumViz";

export function HowHukumWorks({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  return (
    <section className="hukum-how" aria-labelledby="hukum-how-title">
      <div className="container-custom hukum-how__wrap">
        <div className="hukum-how__grid">
          <div className="hukum-how__main">
            <div className="hukum-how__copy">
              <h2 id="hukum-how-title" className="hukum-how__title">
                {isAr ? "كيف تعمل حكم" : "How Hukum works"}
              </h2>
              <p className="hukum-how__aside">
                {isAr
                  ? "لا قوائم عشوائية. يصل طلبك للموردين المناسبين فقط، وتتواصل عبر حكم بثقة."
                  : "No random lists. Your request reaches the right suppliers only — then you connect through Hukum with confidence."}
              </p>
              <Link href={`/${locale}/rfq`} className="hukum-how__cta">
                <span>{isAr ? "اطلب عروض أسعار" : "Request quotes"}</span>
                <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
          </div>

          <div className="hukum-how__viz">
            <HowHukumViz locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
