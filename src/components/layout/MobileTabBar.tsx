"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileText,
  Home,
  LayoutGrid,
  Search,
  User,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import "./mobile-tabbar.css";

const STROKE = 2;
const MOBILE_MQ = "(max-width: 1023px)";

function isHome(pathname: string) {
  return /^\/(en|ar)\/?$/.test(pathname);
}

function isSectors(pathname: string) {
  return /\/(categories|c)(\/|$)/.test(pathname) || /\/industries(\/|$)/.test(pathname);
}

function isQuotes(pathname: string) {
  return /\/(rfq|request-quotes|upload-boq)(\/|$)/.test(pathname);
}

function isAccount(pathname: string) {
  return /\/(login|register|buyer|vendor|admin)(\/|$)/.test(pathname);
}

export function MobileTabBar({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "";
  const isAr = locale === "ar";
  const [isMobile, setIsMobile] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onOpened = () => setAskOpen(true);
    const onClosed = () => setAskOpen(false);
    window.addEventListener("hukum-ask-opened", onOpened);
    window.addEventListener("hukum-ask-closed", onClosed);
    return () => {
      window.removeEventListener("hukum-ask-opened", onOpened);
      window.removeEventListener("hukum-ask-closed", onClosed);
    };
  }, []);

  if (!isMobile) return null;

  const openAsk = () => {
    window.dispatchEvent(new Event(askOpen ? "hukum-ask-close" : "hukum-ask-open"));
  };

  return (
    <nav className="mtb" aria-label={isAr ? "التنقل الرئيسي" : "Main navigation"}>
      <ul className="mtb__list">
        <li className="mtb__item">
          <Link
            href={`/${locale}`}
            className={cn("mtb__link", isHome(pathname) && "is-active")}
            aria-current={isHome(pathname) ? "page" : undefined}
          >
            <Home className="mtb__icon" size={22} strokeWidth={STROKE} aria-hidden />
            <span className="mtb__label">{isAr ? "الرئيسية" : "Home"}</span>
          </Link>
        </li>

        <li className="mtb__item">
          <Link
            href={`/${locale}/categories`}
            className={cn("mtb__link", isSectors(pathname) && "is-active")}
            aria-current={isSectors(pathname) ? "page" : undefined}
          >
            <LayoutGrid className="mtb__icon" size={22} strokeWidth={STROKE} aria-hidden />
            <span className="mtb__label">{isAr ? "التصنيفات" : "Categories"}</span>
          </Link>
        </li>

        <li className="mtb__item">
          <Link
            href={`/${locale}/rfq`}
            className={cn("mtb__link", "mtb__link--center", isQuotes(pathname) && "is-active")}
            aria-current={isQuotes(pathname) ? "page" : undefined}
          >
            <span className="mtb__cta" aria-hidden>
              <FileText size={22} strokeWidth={STROKE} />
            </span>
            <span className="mtb__label">{isAr ? "اطلب عرض" : "Get quotes"}</span>
          </Link>
        </li>

        <li className="mtb__item">
          <button
            type="button"
            className={cn("mtb__link", askOpen && "is-active")}
            aria-label={isAr ? "بحث AI" : "AI search"}
            aria-pressed={askOpen}
            onClick={openAsk}
          >
            <Search className="mtb__icon" size={22} strokeWidth={STROKE} aria-hidden />
            <span className="mtb__label">{isAr ? "بحث AI" : "AI search"}</span>
          </button>
        </li>

        <li className="mtb__item">
          <Link
            href={`/${locale}/login`}
            className={cn("mtb__link", isAccount(pathname) && !askOpen && "is-active")}
            aria-current={isAccount(pathname) ? "page" : undefined}
          >
            <User className="mtb__icon" size={22} strokeWidth={STROKE} aria-hidden />
            <span className="mtb__label">{isAr ? "حسابي" : "Account"}</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
