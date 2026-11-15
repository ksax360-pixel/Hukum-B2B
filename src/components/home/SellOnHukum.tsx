"use client";

// src/components/home/SellOnHukum.tsx
// Last section of the home page: why a Saudi supplier should join, with a sample of the requests they'd receive.
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Inbox, MapPin, Percent, Store } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { sellerIsExternal, sellerRegisterUrl } from "@/lib/seller-admin";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function SellOnHukum({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const reduce = useReducedMotion();
  const reveal = (i: number, x = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: x ? 0 : 16, x },
          whileInView: { opacity: 1, y: 0, x: 0 },
          viewport: { once: true, amount: 0.35 },
          transition: { duration: 0.6, delay: 0.08 + i * 0.1, ease: easeOut },
        };

  const perks = [
    { Icon: Inbox, title: L("Requests come to you", "الطلبات تجيك"), text: L("Matched by what you sell and where you deliver", "حسب اللي تبيعه والمدن اللي توصلها") },
    { Icon: Percent, title: L("No commission", "بدون عمولة"), text: L("You keep the full value of every sale", "قيمة البيع كاملة لك") },
    { Icon: BadgeCheck, title: L("Verified badge", "شارة التوثيق"), text: L("CR checked with Wathq, shown on your listings", "سجلك يُتحقق عبر واثق ويظهر على منتجاتك") },
    { Icon: Store, title: L("Your own storefront", "متجرك الخاص"), text: L("A branded page for your catalogue", "صفحة باسمك لكل منتجاتك") },
  ];
  const requests = [
    { item: L("Paper cups, 8 oz", "أكواب ورقية 8 أونصة"), qty: "3,000", city: L("Jeddah", "جدة") },
    { item: L("Rebar, 16 mm", "حديد تسليح 16 مم"), qty: L("40 ton", "40 طن"), city: L("Riyadh", "الرياض") },
    { item: L("Safety helmets", "خوذات سلامة"), qty: "200", city: L("Dammam", "الدمام") },
  ];
  const steps = [L("Register", "سجّل"), L("List products", "أدرج منتجاتك"), L("Get requests", "استقبل الطلبات")];
  const external = sellerIsExternal() ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <section className="hs" aria-labelledby="hs-title" dir={isAr ? "rtl" : "ltr"}>
      <div className="hs__panel">
        <div className="hs__copy">
          <motion.p className="hs__free" {...reveal(0)}>{L("Free through 2027", "مجاناً طوال 2027")}</motion.p>
          <motion.h2 id="hs-title" className="hs__title" {...reveal(0)}>{L("Sell to buyers across Saudi Arabia", "بِع لمشترين في كل السعودية")}</motion.h2>
          <motion.p className="hs__lead" {...reveal(1)}>
            {L("Buyers post what they need. We send the matching requests straight to you.", "المشترون يطلبون اللي يحتاجونه، ونرسل لك الطلبات المطابقة مباشرة.")}
          </motion.p>

          <ul className="hs__perks">
            {perks.map((p, i) => (
              <motion.li key={p.title} {...reveal(i + 2)}>
                <span className="hs__icon"><p.Icon size={18} strokeWidth={1.7} aria-hidden /></span>
                <span><b>{p.title}</b><small>{p.text}</small></span>
              </motion.li>
            ))}
          </ul>

          <motion.div className="hs__act" {...reveal(6)}>
            <a href={sellerRegisterUrl(locale)} {...external} className="hs__cta">
              {L("Become a supplier", "انضم كمورد")} <ArrowUpRight size={16} strokeWidth={1.85} aria-hidden />
            </a>
            <Link href={`/${locale}/how-it-works/suppliers`} className="hs__ghost">{L("How it works for suppliers", "كيف يعمل حكم للموردين")}</Link>
          </motion.div>
          <motion.ol className="hs__steps" aria-label={L("How to join", "خطوات الانضمام")} {...reveal(7)}>
            {steps.map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}
          </motion.ol>
        </div>

        <motion.div className="hs__feed" aria-hidden {...reveal(2, isAr ? -24 : 24)}>
          <div className="hs__feed-head">
            <span className="hs__live" />
            <b>{L("New requests for you", "طلبات جديدة لك")}</b>
            <small>{L("Sample", "نموذج")}</small>
          </div>
          {requests.map((r, i) => (
            <motion.div key={r.item} className="hs__req" {...reveal(i + 3, isAr ? -24 : 24)}>
              <span className="hs__req-main">
                <b>{r.item}</b>
                <span className="hs__req-meta">
                  <span>{r.qty}</span>
                  <span><MapPin size={12} aria-hidden /> {r.city}</span>
                </span>
              </span>
              <span className="hs__req-btn">{L("Quote", "قدّم عرض")}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
