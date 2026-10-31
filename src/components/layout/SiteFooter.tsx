"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { SITE_CONTACT } from "@/data/site-contact";
import { BrandMark } from "@/components/brand/BrandMark";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { sellerLoginUrl, sellerRegisterUrl } from "@/lib/seller-admin";
import {
  sourcingWhatsAppHref,
  sourcingWhatsAppIsExternal,
} from "@/lib/sourcing-contact";

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const isAr = locale === "ar";
  const year = new Date().getFullYear();
  const email = SITE_CONTACT.generalEmail;
  const waHref = sourcingWhatsAppHref(locale);
  const waExternal = sourcingWhatsAppIsExternal();

  const cols = [
    {
      heading: isAr ? "شراء" : "Buy",
      links: [
        { label: isAr ? "التصنيفات" : "Categories", href: `/${locale}/categories` },
        { label: isAr ? "المنتجات والخدمات" : "Products & services", href: `/${locale}/products` },
        { label: isAr ? "اطلب عروض أسعار" : "Request quotes", href: `/${locale}/rfq` },
        { label: isAr ? "مساعدة التوريد" : "Get sourcing help", href: `/${locale}/contact` },
        { label: isAr ? "قارن" : "Compare", href: `/${locale}/compare` },
      ],
    },
    {
      heading: isAr ? "الموردون" : "Suppliers",
      links: [
        { label: isAr ? "الموردون" : "Suppliers", href: `/${locale}/vendors` },
        {
          label: isAr ? "المصانع" : "Manufacturers",
          href: `/${locale}/vendors?companyType=manufacturer`,
        },
        { label: isAr ? "انضم كمورد" : "Become a supplier", href: sellerRegisterUrl(), external: true },
        { label: isAr ? "دخول المورد" : "Supplier sign-in", href: sellerLoginUrl(), external: true },
      ],
    },
    {
      heading: isAr ? "الثقة والمساعدة" : "Trust & help",
      links: [
        { label: isAr ? "مركز المساعدة" : "Help centre", href: `/${locale}/faq` },
        { label: isAr ? "كيف يعمل التحقق" : "How verification works", href: `/${locale}/faq` },
        { label: isAr ? "أبلغ عن مشكلة" : "Report a concern", href: `/${locale}/contact` },
        { label: t("nav.contact"), href: `/${locale}/contact` },
      ],
    },
    {
      heading: isAr ? "الشركة" : "Company",
      links: [
        { label: t("nav.about"), href: `/${locale}/about` },
        { label: t("footer.terms"), href: `/${locale}/terms` },
        { label: t("footer.privacy"), href: `/${locale}/privacy` },
        { label: t("footer.rules"), href: `/${locale}/marketplace-rules` },
      ],
    },
  ];

  return (
    <footer className="hukum-footer">
      <div className="container-custom">
        <div className="hukum-footer__grid">
          <div className="hukum-footer__brand">
            <Link href={`/${locale}`} className="hukum-footer__logo" aria-label="Hukum">
              <BrandMark size={34} />
              <BrandWordmark size="md" className="!text-[#111C17]" />
            </Link>
            <p className="hukum-footer__desc">
              {isAr
                ? "سوق B2B السعودي للعثور على الموردين وطلب عروض الأسعار."
                : "The Saudi B2B marketplace for finding suppliers and requesting quotations."}
            </p>
            <div className="hukum-footer__social">
              {waExternal ? (
                <a href={waHref} target="_blank" rel="noreferrer" className="hukum-footer__social-btn" aria-label="WhatsApp">
                  <WhatsAppGlyph />
                </a>
              ) : (
                <Link href={waHref} className="hukum-footer__social-btn" aria-label="WhatsApp">
                  <WhatsAppGlyph />
                </Link>
              )}
              <a href={`mailto:${email}`} className="hukum-footer__social-btn" aria-label="Email">
                <Mail size={14} strokeWidth={1.75} />
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                className="hukum-footer__social-btn"
                aria-label="LinkedIn"
              >
                <LinkedInGlyph />
              </a>
            </div>
          </div>

          <div className="hukum-footer__cols">
            {cols.map((col) => (
              <div key={col.heading} className="hukum-footer__col">
                <p className="hukum-footer__heading">{col.heading}</p>
                <ul className="hukum-footer__list">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      {"external" in link && link.external ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className="hukum-footer__link">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="hukum-footer__link">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="hukum-footer__bottom">
          <p>
            © {year} Hukum. {t("footer.rights")}
          </p>
          <LanguageSwitcher locale={locale} variant="soft" />
        </div>
      </div>
    </footer>
  );
}
