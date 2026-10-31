import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";

export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localePath(locale: Locale, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${p === "/" ? "" : p}`;
}

export function applyTemplate(template: string, vars: Record<string, string | undefined | null>) {
  let out = template;
  for (const [key, raw] of Object.entries(vars)) {
    const value = (raw || "").trim();
    out = out.replaceAll(`{${key}}`, value);
  }
  return out
    .replace(/\s*\|\s*(\||$)/g, " | ")
    .replace(/(^|\s)\|\s+/g, "$1")
    .replace(/\s+\|/g, " |")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[|,]\s*$/g, "")
    .replace(/undefined|null/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^[\s|,]+|[\s|,]+$/g, "");
}

export function brandSuffix(title: string, max = 60) {
  if (!title) return "Hukum";
  let t = title.trim();
  if (!/hukum/i.test(t)) {
    t = `${t} | Hukum`;
  } else if (!/\|\s*Hukum/i.test(t)) {
    t = t.replace(/\s*Hukum\s*$/i, " | Hukum");
  }
  return t.slice(0, 70);
}

export type SeoRecord = {
  title?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  h1?: { en?: string; ar?: string };
  ogTitle?: { en?: string; ar?: string };
  ogDescription?: { en?: string; ar?: string };
  socialImage?: string;
  twitterTitle?: { en?: string; ar?: string };
  twitterDescription?: { en?: string; ar?: string };
  twitterImage?: string;
  twitterCard?: string;
  canonical?: string;
  indexable?: boolean;
  follow?: boolean;
  sitemapInclude?: boolean;
  robotsExtra?: string;
};

export function pickLoc(locale: Locale, value?: { en?: string; ar?: string }, fallback = "") {
  return (locale === "ar" ? value?.ar || value?.en : value?.en || value?.ar) || fallback;
}

export function composeMetadata(input: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string;
  seo?: SeoRecord | null;
  indexable?: boolean;
  ogType?: "website" | "article";
}): Metadata {
  const seo = input.seo || {};
  const title = pickLoc(input.locale, seo.title, input.title).slice(0, 70);
  const description = pickLoc(input.locale, seo.description, input.description).slice(0, 160);
  const ogTitle = pickLoc(input.locale, seo.ogTitle, title);
  const ogDesc = pickLoc(input.locale, seo.ogDescription, description);
  const image = seo.socialImage || input.image || "/og/kingdom-trade-social-share.png";
  const indexable = seo.indexable ?? input.indexable ?? true;
  const follow = seo.follow ?? true;
  const canonical = seo.canonical || absUrl(localePath(input.locale, input.path));
  const twTitle = pickLoc(input.locale, seo.twitterTitle, ogTitle);
  const twDesc = pickLoc(input.locale, seo.twitterDescription, ogDesc);
  const twImage = seo.twitterImage || image;

  return {
    // absolute avoids root layout template doubling "| Hukum"
    title: { absolute: brandSuffix(title) },
    description,
    robots: {
      index: indexable,
      follow,
      googleBot: {
        index: indexable,
        follow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical,
      languages: {
        "ar-SA": absUrl(localePath("ar", input.path)),
        ar: absUrl(localePath("ar", input.path)),
        en: absUrl(localePath("en", input.path)),
        // Saudi marketplace: Arabic is primary discovery language
        "x-default": absUrl(localePath("ar", input.path)),
      },
    },
    openGraph: {
      type: input.ogType || "website",
      siteName: "Hukum",
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      images: [{ url: absUrl(image), alt: ogTitle }],
      locale: input.locale === "ar" ? "ar_SA" : "en_US",
    },
    twitter: {
      card: (seo.twitterCard as "summary_large_image") || "summary_large_image",
      title: twTitle,
      description: twDesc,
      images: [absUrl(twImage)],
    },
  };
}

export function seoScore(flags: Record<string, boolean>) {
  const keys = Object.keys(flags);
  if (!keys.length) return 0;
  const ok = keys.filter((k) => flags[k]).length;
  return Math.round((ok / keys.length) * 100);
}

export const DEFAULT_TEMPLATES = {
  product: {
    en: {
      title: "{name} | {brand}",
      description:
        "Explore {name}{brandPhrase} on Hukum. Compare specifications, request quotes and contact suppliers.",
      h1: "{name}",
    },
    ar: {
      title: "{name} | {brand}",
      description:
        "اطّلع على {name}{brandPhrase} في Hukum. قارن المواصفات واطلب عروض أسعار وتواصل مع الموردين.",
      h1: "{name}",
    },
  },
  category: {
    en: {
      title: "{name} Suppliers & Manufacturers",
      description:
        "Find verified {name} suppliers and manufacturers on Hukum. Browse products and request quotes.",
      h1: "{name}",
    },
    ar: {
      title: "موردو ومصنعو {name} | Hukum",
      description:
        "اعثر على موردي ومصنعي {name} الموثّقين على Hukum. تصفّح المنتجات واطلب عروض أسعار.",
      h1: "{name}",
    },
  },
  vendor: {
    en: {
      title: "{name} | {typePhrase}",
      description: "{name}{locationPhrase} on Hukum. View products, capabilities and contact this supplier.",
      h1: "{name}",
    },
    ar: {
      title: "{name} | {typePhrase}",
      description: "{name}{locationPhrase} على Hukum. اطّلع على المنتجات والقدرات وتواصل مع هذا المورد.",
      h1: "{name}",
    },
  },
  industry: {
    en: {
      title: "{name} Products & Suppliers",
      description: "Discover {name} products and verified suppliers on Hukum.",
      h1: "{name}",
    },
    ar: {
      title: "منتجات وموردو {name} | Hukum",
      description: "اكتشف منتجات {name} والموردين الموثّقين على Hukum.",
      h1: "{name}",
    },
  },
  page: {
    en: { title: "{name}", description: "{description}", h1: "{name}" },
    ar: { title: "{name}", description: "{description}", h1: "{name}" },
  },
};

export function generateFromEntity(
  type: keyof typeof DEFAULT_TEMPLATES,
  locale: Locale,
  vars: Record<string, string | undefined | null>
) {
  const tpl = DEFAULT_TEMPLATES[type][locale === "ar" ? "ar" : "en"];
  const titleRaw = applyTemplate(tpl.title, vars);
  const descRaw = applyTemplate(tpl.description, vars);
  const h1 = applyTemplate(tpl.h1, vars);
  return {
    title: brandSuffix(titleRaw || "Hukum"),
    description: (descRaw || (locale === "ar" ? "منصة Hukum للتجارة بين الشركات." : "Hukum B2B marketplace.")).slice(
      0,
      160
    ),
    h1: h1 || titleRaw,
  };
}
