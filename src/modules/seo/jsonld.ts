import { absUrl, localePath, siteOrigin } from "./engine";
import type { Locale } from "@/i18n/config";

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hukum",
    alternateName: "حكم",
    url: siteOrigin(),
    logo: absUrl("/brand/hukum-logo.png"),
    image: absUrl("/og/hukum-share.jpg"),
    email: "hello@hukum.sa",
    sameAs: ["https://www.hukum.sa"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Riyadh",
      addressCountry: "SA",
    },
    areaServed: { "@type": "Country", name: "Saudi Arabia" },
  };
}

export function websiteLd() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hukum",
    alternateName: "حكم",
    url: origin,
    inLanguage: ["en", "ar"],
    publisher: { "@type": "Organization", name: "Hukum", url: origin },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/en/products?q={search_term_string}`,
      },
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
    inLanguage: input.locale === "ar" ? "ar-SA" : "en-SA",
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
    inLanguage: input.locale === "ar" ? "ar-SA" : "en-SA",
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

export function itemListLd(input: {
  name: string;
  path: string;
  locale: Locale;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: absUrl(localePath(input.locale, input.path)),
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absUrl(localePath(input.locale, item.path)),
    })),
  };
}

export function productLd(input: {
  name: string;
  description?: string;
  path: string;
  locale: Locale;
  image?: string;
  brand?: string;
  sku?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: absUrl(localePath(input.locale, input.path)),
    ...(input.image ? { image: absUrl(input.image) } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.brand
      ? { brand: { "@type": "Brand", name: input.brand } }
      : {}),
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "SAR",
      url: absUrl(localePath(input.locale, input.path)),
      seller: { "@type": "Organization", name: "Hukum" },
    },
  };
}

export function localBusinessLd(input: {
  name: string;
  description?: string;
  path: string;
  locale: Locale;
  city?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    description: input.description,
    url: absUrl(localePath(input.locale, input.path)),
    ...(input.image ? { image: absUrl(input.image) } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city || "Saudi Arabia",
      addressCountry: "SA",
    },
    parentOrganization: {
      "@type": "Organization",
      name: "Hukum",
      url: siteOrigin(),
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
