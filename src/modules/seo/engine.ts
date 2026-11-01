import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { DEFAULT_OG_ALT, DEFAULT_SHARE_IMAGE } from "@/modules/seo/page-seo";

export function siteOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.hukum.sa";
  return raw.replace(/\/$/, "");
}

export function isProductionSite() {
  const origin = siteOrigin();
  return /hukum\.sa$/i.test(origin.replace(/^https?:\/\//, "").replace(/^www\./, "www.")) ||
    /www\.hukum\.sa$/i.test(origin.replace(/^https?:\/\//, ""));
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

/** Keep document titles readable (~50–60 target, hard cap 70). */
export function brandSuffix(title: string) {
  if (!title) return "Hukum | حكم";
  let t = title.trim();
  if (!/hukum|حكم/i.test(t)) {
    t = `${t} | Hukum`;
  }
  if (t.length > 60 && t.length <= 70) return t;
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

function clampDesc(text: string, max = 160) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function composeMetadata(input: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  /** Bilingual OG/Twitter title (EN | AR). Falls back to locale title. */
  ogTitle?: string;
  /** Bilingual OG/Twitter description (EN | AR). */
  ogDescription?: string;
  image?: string;
  imageAlt?: string;
  seo?: SeoRecord | null;
  indexable?: boolean;
  ogType?: "website" | "article";
}): Metadata {
  const seo = input.seo || {};
  const title = brandSuffix(pickLoc(input.locale, seo.title, input.title));
  const description = clampDesc(pickLoc(input.locale, seo.description, input.description), 160);

  const ogTitle =
    input.ogTitle ||
    (seo.ogTitle?.en && seo.ogTitle?.ar
      ? `${seo.ogTitle.en} | ${seo.ogTitle.ar}`
      : pickLoc(input.locale, seo.ogTitle, title));
  const ogDesc = clampDesc(
    input.ogDescription ||
      (seo.ogDescription?.en && seo.ogDescription?.ar
        ? `${seo.ogDescription.en} | ${seo.ogDescription.ar}`
        : pickLoc(input.locale, seo.ogDescription, description)),
    200
  );

  const image = seo.socialImage || input.image || DEFAULT_SHARE_IMAGE;
  const imageAlt = input.imageAlt || DEFAULT_OG_ALT;
  const staging = process.env.VERCEL_ENV === "preview" || process.env.NOINDEX === "1";
  const indexable = staging ? false : (seo.indexable ?? input.indexable ?? true);
  const follow = seo.follow ?? true;
  const canonical = seo.canonical || absUrl(localePath(input.locale, input.path));
  const enUrl = absUrl(localePath("en", input.path));
  const arUrl = absUrl(localePath("ar", input.path));
  const twTitle = pickLoc(input.locale, seo.twitterTitle, ogTitle);
  const twDesc = pickLoc(input.locale, seo.twitterDescription, ogDesc);
  const twImage = seo.twitterImage || image;

  return {
    metadataBase: new URL(siteOrigin()),
    title: { absolute: title },
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
        "en-SA": enUrl,
        "ar-SA": arUrl,
        en: enUrl,
        ar: arUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      type: input.ogType || "website",
      siteName: "Hukum | حكم",
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      images: [
        {
          url: absUrl(image),
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      locale: input.locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: input.locale === "ar" ? ["en_US"] : ["ar_SA"],
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
        "اطّلع على {name}{brandPhrase} في حكم. قارن المواصفات واطلب عروض أسعار وتواصل مع الموردين.",
      h1: "{name}",
    },
  },
  category: {
    en: {
      title: "{name} suppliers in Saudi Arabia",
      description:
        "Find verified {name} suppliers and manufacturers on Hukum. Browse products and request quotes.",
      h1: "{name}",
    },
    ar: {
      title: "موردو {name} في السعودية",
      description:
        "اعثر على موردي ومصنعي {name} الموثّقين على حكم. تصفّح المنتجات واطلب عروض أسعار.",
      h1: "{name}",
    },
  },
  vendor: {
    en: {
      title: "{name} | verified supplier",
      description: "{name}{locationPhrase} on Hukum. View products, capabilities and request a quote.",
      h1: "{name}",
    },
    ar: {
      title: "{name} | مورد موثّق",
      description: "{name}{locationPhrase} على حكم. اطّلع على المنتجات والقدرات واطلب عرض سعر.",
      h1: "{name}",
    },
  },
  industry: {
    en: {
      title: "{name} products & suppliers",
      description: "Discover {name} products and verified suppliers on Hukum.",
      h1: "{name}",
    },
    ar: {
      title: "منتجات وموردو {name}",
      description: "اكتشف منتجات {name} والموردين الموثّقين على حكم.",
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
    description: clampDesc(
      descRaw || (locale === "ar" ? "منصة حكم للتجارة بين الشركات." : "Hukum B2B marketplace.")
    ),
    h1: h1 || titleRaw,
  };
}
