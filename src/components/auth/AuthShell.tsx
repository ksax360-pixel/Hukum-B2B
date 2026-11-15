"use client";

// Shared sign-in / sign-up frame for buyers, suppliers and the Hukum team. Form on one side with a way back
// to the site and a language switch; on wide screens a brand panel that speaks to whoever is signing in.
// Audience comes from the page (register knows the account type) or from ?next= (supplier portal, admin).

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, FileText, Inbox, Lock, Scale, Send, ShieldCheck, Store } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";

type Audience = "buyer" | "supplier" | "admin";

export function AuthShell({
  children,
  wide = false,
  locale = "en",
  audience,
}: {
  children: ReactNode;
  wide?: boolean;
  locale?: string;
  audience?: Audience;
}) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const [detected, setDetected] = useState<Audience>("buyer");
  const [altHref, setAltHref] = useState(`/${isAr ? "en" : "ar"}`);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.add("kt-public");
    document.documentElement.style.colorScheme = "light";
    const { pathname, search } = window.location;
    const next = new URLSearchParams(search).get("next") || "";
    setDetected(/\/admin(\/|$)/.test(next) ? "admin" : /\/vendor(\/|$)/.test(next) ? "supplier" : "buyer");
    setAltHref(pathname.replace(/^\/(en|ar)/, `/${isAr ? "en" : "ar"}`) + search);
  }, [isAr]);

  const who = audience || detected;
  const panel = {
    buyer: {
      title: L("Buy from verified Saudi suppliers", "اشترِ من موردين سعوديين موثّقين"),
      points: [
        { icon: Send, t: L("One request reaches every supplier who sells it", "طلب واحد يوصل لكل مورد يبيعه") },
        { icon: Scale, t: L("Compare quotes side by side, VAT and delivery included", "قارن العروض جنباً إلى جنب شاملة الضريبة والتوصيل") },
        { icon: Lock, t: L("Your number stays private until you choose", "رقمك يبقى خاصاً لين تختار") },
      ],
      card: { k: L("Request", "طلب"), b: L("500 safety helmets", "500 خوذة سلامة"), s: L("3 quotes to compare", "3 عروض للمقارنة") },
    },
    supplier: {
      title: L("Your supplier workspace", "مساحة المورد"),
      points: [
        { icon: Inbox, t: L("Requests that match what you sell", "طلبات تطابق منتجاتك") },
        { icon: Store, t: L("Your storefront, products and catalogue in one place", "متجرك ومنتجاتك وكتالوجك في مكان واحد") },
        { icon: BadgeCheck, t: L("Verification that buyers can see", "توثيق يشوفه المشتري") },
      ],
      card: { k: L("New request", "طلب جديد"), b: L("Cable tray 300 mm, 120 lengths", "صينية كابلات 300 مم، 120 طول"), s: L("Deliver to Riyadh", "التوصيل إلى الرياض") },
    },
    admin: {
      title: L("Hukum team", "فريق حكم"),
      points: [
        { icon: ShieldCheck, t: L("Verification and listing review", "مراجعة التوثيق والعروض") },
        { icon: FileText, t: L("Every action is logged", "كل إجراء مسجّل") },
        { icon: Lock, t: L("Authorised staff only", "للموظفين المصرّح لهم فقط") },
      ],
      card: null as null | { k: string; b: string; s: string },
    },
  }[who];

  return (
    <div className={`auth2${wide ? " is-wide" : ""}`} dir={isAr ? "rtl" : "ltr"}>
      <main className="auth2__side">
        <header className="auth2__top">
          <Link href={`/${locale}`} aria-label={L("Hukum home", "الصفحة الرئيسية لحكم")} className="auth2__logo">
            <BrandMark size={44} />
          </Link>
          <div className="auth2__top-links">
            <Link href={altHref} hrefLang={isAr ? "en" : "ar"} className="auth2__lang">{isAr ? "English" : "العربية"}</Link>
            <Link href={`/${locale}`} className="auth2__back"><ArrowLeft size={15} aria-hidden /> {L("Back to Hukum", "رجوع لحكم")}</Link>
          </div>
        </header>
        <div className="auth2__form">{children}</div>
        <footer className="auth2__foot">
          <Link href={`/${locale}/privacy`}>{L("Privacy", "الخصوصية")}</Link>
          <Link href={`/${locale}/terms`}>{L("Terms", "الشروط")}</Link>
          <Link href={`/${locale}/help`}>{L("Help", "المساعدة")}</Link>
        </footer>
      </main>

      <aside className={`auth2__panel is-${who}`} aria-hidden>
        <div className="auth2__panel-inner">
          <h2>{panel.title}</h2>
          <ul>
            {panel.points.map((p) => (
              <li key={p.t}><span><p.icon size={18} /></span>{p.t}</li>
            ))}
          </ul>
          {panel.card ? (
            <div className="auth2__card">
              <small>{panel.card.k}</small>
              <b>{panel.card.b}</b>
              <span>{panel.card.s}</span>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
