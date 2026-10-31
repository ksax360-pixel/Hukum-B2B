import { absUrl, localePath, siteOrigin } from "./engine";
import type { Locale } from "@/i18n/config";

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hukum",
    url: siteOrigin(),
    logo: absUrl("/brand/hukum-logo.png"),
    email: "hello@kingdomtrade.sa",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Riyadh",
      addressCountry: "SA",
    },
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hukum",
    url: siteOrigin(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteOrigin()}/en/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(
  locale: Locale,
  crumbs: { name: string; path?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absUrl(localePath(locale, c.path)) } : {}),
    })),
  };
}

export function webPageLd(input: {
  name: string;
  description?: string;
  path: string;
  locale: Locale;
  type?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type || "WebPage",
    name: input.name,
    description: input.description,
    url: absUrl(localePath(input.locale, input.path)),
    isPartOf: { "@type": "WebSite", name: "Hukum", url: siteOrigin() },
    inLanguage: input.locale === "ar" ? "ar" : "en",
  };
}

export function collectionPageLd(input: {
  name: string;
  description?: string;
  path: string;
  locale: Locale;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absUrl(localePath(input.locale, input.path)),
    isPartOf: { "@type": "WebSite", name: "Hukum", url: siteOrigin() },
    inLanguage: input.locale === "ar" ? "ar-SA" : "en",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.slice(0, 50).map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: absUrl(localePath(input.locale, item.path)),
      })),
    },
  };
}

export function faqPageLd(faqs: { q: string; a: string }[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
