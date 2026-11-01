"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Headphones, MapPin, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { SITE_CONTACT } from "@/data/site-contact";
import { BrandMark } from "@/components/brand/BrandMark";
import { sellerLoginUrl, sellerRegisterUrl } from "@/lib/seller-admin";
import {
  sourcingWhatsAppHref,
  sourcingWhatsAppIsExternal,
} from "@/lib/sourcing-contact";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type NavItem = {
  id: string;
  label: string;
  href: string;
  items?: FooterLink[];
};

function FooterNavLink({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className="hukum-footer__drop-link">
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className="hukum-footer__drop-link">
      {link.label}
    </Link>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const isAr = locale === "ar";
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const router = useRouter();
  const email = SITE_CONTACT.generalEmail;
  const waHref = sourcingWhatsAppHref(locale);
  const waExternal = sourcingWhatsAppIsExternal();
  const city = isAr ? SITE_CONTACT.office.city.ar : SITE_CONTACT.office.city.en;
  const country = isAr ? SITE_CONTACT.office.country.ar : SITE_CONTACT.office.country.en;

  const nav: NavItem[] = [
    {
      id: "categories",
      label: isAr ? "التصنيفات" : "Categories",
      href: `/${locale}/categories`,
      items: [
        { label: isAr ? "كل التصنيفات" : "All categories", href: `/${locale}/categories` },
        { label: isAr ? "المنتجات والخدمات" : "Products & services", href: `/${locale}/products` },
        { label: isAr ? "اطلب عروض أسعار" : "Request quotes", href: `/${locale}/rfq` },
        { label: isAr ? "قارن" : "Compare", href: `/${locale}/compare` },
      ],
    },
    {
      id: "suppliers",
      label: isAr ? "الموردون" : "Suppliers",
      href: `/${locale}/vendors`,
      items: [
        { label: isAr ? "كل الموردين" : "All suppliers", href: `/${locale}/vendors` },
        { label: isAr ? "انضم كمورد" : "Become a supplier", href: sellerRegisterUrl(), external: true },
        { label: isAr ? "دخول المورد" : "Supplier sign-in", href: sellerLoginUrl(), external: true },
        { label: isAr ? "الموردون حسب المدينة" : "Suppliers by city", href: `/${locale}/vendors/cities` },
      ],
    },
    {
      id: "manufacturers",
      label: isAr ? "المصانع" : "Manufacturers",
      href: `/${locale}/vendors?companyType=manufacturer`,
      items: [
        {
          label: isAr ? "كل المصانع" : "All manufacturers",
          href: `/${locale}/vendors?companyType=manufacturer`,
        },
        { label: isAr ? "صُنع في السعودية" : "Made in Saudi", href: `/${locale}/vendors?origin=saudi` },
        { label: isAr ? "العلامات والموزعون" : "Brands & distributors", href: `/${locale}/vendors/brands` },
      ],
    },
    {
      id: "products",
      label: isAr ? "المنتجات" : "Products",
      href: `/${locale}/products`,
      items: [
        { label: isAr ? "تصفح المنتجات" : "Browse products", href: `/${locale}/products` },
        { label: isAr ? "المميز" : "Featured", href: `/${locale}/products?featured=true&sort=featured` },
        { label: isAr ? "اطلب عروض أسعار" : "Request quotes", href: `/${locale}/rfq` },
      ],
    },
    {
      id: "concierge",
      label: isAr ? "مساعدة التوريد" : "Concierge sourcing",
      href: `/${locale}/contact`,
      items: [
        { label: isAr ? "مساعدة التوريد" : "Get sourcing help", href: `/${locale}/contact` },
        { label: isAr ? "اطلب عروض أسعار" : "Request quotes", href: `/${locale}/rfq` },
        {
          label: isAr ? "واتساب" : "WhatsApp",
          href: waHref,
          external: waExternal,
        },
      ],
    },
    {
      id: "about",
      label: t("nav.about"),
      href: `/${locale}/about`,
      items: [
        { label: t("nav.about"), href: `/${locale}/about` },
        { label: isAr ? "كيف يعمل التحقق" : "How verification works", href: `/${locale}/faq` },
        { label: isAr ? "مركز المساعدة" : "Help centre", href: `/${locale}/faq` },
      ],
    },
    {
      id: "contact",
      label: t("nav.contact"),
      href: `/${locale}/contact`,
      items: [
        { label: t("nav.contact"), href: `/${locale}/contact` },
        { label: isAr ? "أبلغ عن مشكلة" : "Report a concern", href: `/${locale}/contact` },
        { label: email, href: `mailto:${email}`, external: true },
      ],
    },
  ];

  const legal: FooterLink[] = [
    { label: t("footer.terms"), href: `/${locale}/terms` },
    { label: t("footer.privacy"), href: `/${locale}/privacy` },
    { label: t("footer.rules"), href: `/${locale}/marketplace-rules` },
  ];

  const switchLocale = () => {
    const next: Locale = locale === "ar" ? "en" : "ar";
    const rest = pathname.replace(/^\/(en|ar)/, "") || "";
    router.push(`/${next}${rest}`);
  };

  return (
    <footer className="hukum-footer">
      <div className="container-custom hukum-footer__wrap">
        <div className="hukum-footer__main">
          <Link href={`/${locale}`} className="hukum-footer__logo" aria-label="Hukum">
            <BrandMark size={56} />
          </Link>

          <nav className="hukum-footer__nav" aria-label={isAr ? "روابط التذييل" : "Footer"}>
            <ul className="hukum-footer__nav-list">
              {nav.map((item) => (
                <li key={item.id} className="hukum-footer__nav-item">
                  <Link href={item.href} className="hukum-footer__nav-link">
                    {item.label}
                  </Link>
                  {item.items && item.items.length > 0 ? (
                    <div className="hukum-footer__drop" role="menu">
                      <ul className="hukum-footer__drop-list">
                        {item.items.map((link) => (
                          <li key={`${item.id}-${link.href}-${link.label}`} role="none">
                            <FooterNavLink link={link} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <div className="hukum-footer__actions">
            {waExternal ? (
              <a href={waHref} target="_blank" rel="noreferrer" className="hukum-footer__action" aria-label="WhatsApp">
                <MessageCircle size={18} strokeWidth={1.6} aria-hidden />
              </a>
            ) : (
              <Link href={waHref} className="hukum-footer__action" aria-label="WhatsApp">
                <MessageCircle size={18} strokeWidth={1.6} aria-hidden />
              </Link>
            )}
            <a href={`mailto:${email}`} className="hukum-footer__action" aria-label={isAr ? "الدعم" : "Support"}>
              <Headphones size={18} strokeWidth={1.6} aria-hidden />
            </a>
            <Link
              href={`/${locale}/contact`}
              className="hukum-footer__action"
              aria-label={isAr ? "الموقع" : "Location"}
            >
              <MapPin size={18} strokeWidth={1.6} aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div className="hukum-footer__bottom">
        <div className="container-custom hukum-footer__bottom-inner">
          <p className="hukum-footer__copy">
            © {year} Hukum — {city}, {country}
          </p>
          <div className="hukum-footer__legal">
            {legal.map((link) => (
              <Link key={link.href} href={link.href} className="hukum-footer__legal-link">
                {link.label}
              </Link>
            ))}
            <span className="hukum-footer__cr">
              {isAr ? "صُنع في السعودية" : "Made in Saudi Arabia"}
            </span>
            <button
              type="button"
              className="hukum-footer__lang"
              onClick={switchLocale}
              aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              {locale === "ar" ? "English" : "العربية"}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
