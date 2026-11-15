import { MARKETPLACE_CATEGORIES } from "./marketplace-categories";

export type MarketplaceIndustry = {
  key: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  slug: { en: string; ar: string };
  accent: string;
  soft: string;
  order: number;
  categoryKeys: string[];
};

const INDUSTRY_META: Record<
  string,
  {
    key: string;
    description: { en: string; ar: string };
    slug: { en: string; ar: string };
    accent: string;
    soft: string;
    order: number;
  }
> = {
  "Safety & PPE": {
    key: "safety-ppe",
    description: {
      en: "Industrial safety, personal protective equipment, and site-compliance supplies.",
      ar: "السلامة الصناعية ومعدات الحماية الشخصية ومستلزمات الامتثال في المواقع.",
    },
    slug: { en: "safety-ppe", ar: "safety-ppe" },
    accent: "#E11D48",
    soft: "#FFE4E6",
    order: 1,
  },
  Construction: {
    key: "construction",
    description: {
      en: "Civil works, building materials, lighting, plumbing, and site infrastructure.",
      ar: "الأعمال المدنية ومواد البناء والإضاءة والسباكة والبنية التحتية للمواقع.",
    },
    slug: { en: "construction", ar: "construction" },
    accent: "#EA580C",
    soft: "#FFEDD5",
    order: 2,
  },
  FMCG: {
    key: "fmcg",
    description: {
      en: "Fast-moving consumer goods, food & beverage, and personal care wholesale.",
      ar: "السلع الاستهلاكية سريعة الحركة والأغذية والمشروبات والعناية الشخصية بالجملة.",
    },
    slug: { en: "fmcg", ar: "fmcg" },
    accent: "#CA8A04",
    soft: "#FEF9C3",
    order: 3,
  },
  Healthcare: {
    key: "healthcare",
    description: {
      en: "Medical equipment, pharmaceuticals, and laboratory & scientific procurement.",
      ar: "المعدات الطبية والأدوية والمشتريات المخبرية والعلمية.",
    },
    slug: { en: "healthcare", ar: "healthcare" },
    accent: "#0891B2",
    soft: "#CFFAFE",
    order: 4,
  },
  "Apparel & Textiles": {
    key: "apparel-textiles",
    description: {
      en: "Industrial textiles, uniforms, workwear, and apparel supply chains.",
      ar: "المنسوجات الصناعية والزي الرسمي وملابس العمل وسلاسل توريد الملابس.",
    },
    slug: { en: "apparel-textiles", ar: "apparel-textiles" },
    accent: "#BE185D",
    soft: "#FCE7F3",
    order: 5,
  },
  "Technology & Services": {
    key: "technology-services",
    description: {
      en: "IT services, telecom, networking, and digital security solutions.",
      ar: "خدمات تقنية المعلومات والاتصالات والشبكات وحلول الأمن الرقمي.",
    },
    slug: { en: "technology-services", ar: "technology-services" },
    accent: "#4F46E5",
    soft: "#E0E7FF",
    order: 6,
  },
  Industrial: {
    key: "industrial",
    description: {
      en: "Electrical, machinery, HVAC, packaging, tools, chemicals, and plant supplies.",
      ar: "الكهرباء والآلات والتكييف والتعبئة والأدوات والكيماويات ومستلزمات المصانع.",
    },
    slug: { en: "industrial", ar: "industrial" },
    accent: "#475569",
    soft: "#E2E8F0",
    order: 7,
  },
  Energy: {
    key: "energy",
    description: {
      en: "Oil & gas equipment, renewable energy, and water treatment systems.",
      ar: "معدات النفط والغاز والطاقة المتجددة وأنظمة معالجة المياه.",
    },
    slug: { en: "energy", ar: "energy" },
    accent: "#0F766E",
    soft: "#CCFBF1",
    order: 8,
  },
  Automotive: {
    key: "automotive",
    description: {
      en: "Automotive parts, fleet maintenance, and workshop procurement.",
      ar: "قطع غيار السيارات وصيانة الأساطيل ومشتريات الورش.",
    },
    slug: { en: "automotive", ar: "automotive" },
    accent: "#DC2626",
    soft: "#FEE2E2",
    order: 9,
  },
  "Business Supplies": {
    key: "business-supplies",
    description: {
      en: "Stationery, printing, office equipment, furniture & fit-out, and commercial appliances.",
      ar: "القرطاسية والطباعة ومعدات المكاتب والأثاث والتجهيزات والأجهزة التجارية.",
    },
    slug: { en: "business-supplies", ar: "business-supplies" },
    accent: "#0D9488",
    soft: "#CCFBF1",
    order: 10,
  },
  Agriculture: {
    key: "agriculture",
    description: {
      en: "Farming equipment, irrigation, agritech, and agribusiness supplies.",
      ar: "معدات الزراعة والري والتقنية الزراعية ومستلزمات الأعمال الزراعية.",
    },
    slug: { en: "agriculture", ar: "agriculture" },
    accent: "#65A30D",
    soft: "#ECFCCB",
    order: 11,
  },
  Logistics: {
    key: "logistics",
    description: {
      en: "Warehousing, freight, packaging logistics, and supply-chain services.",
      ar: "التخزين والشحن ولوجستيات التعبئة وخدمات سلاسل الإمداد.",
    },
    slug: { en: "logistics", ar: "logistics" },
    accent: "#0369A1",
    soft: "#E0F2FE",
    order: 12,
  },
  Services: {
    key: "services",
    description: {
      en: "Facility management, cleaning, education, hospitality support, and operations.",
      ar: "إدارة المرافق والتنظيف والتعليم ودعم الضيافة والعمليات.",
    },
    slug: { en: "services", ar: "services" },
    accent: "#334155",
    soft: "#F1F5F9",
    order: 13,
  },
  Hospitality: {
    key: "hospitality",
    description: {
      en: "Hotel, F&B, and hospitality operational supplies at scale.",
      ar: "مستلزمات تشغيل الفنادق والمطاعم والضيافة على نطاق واسع.",
    },
    slug: { en: "hospitality", ar: "hospitality" },
    accent: "#B45309",
    soft: "#FEF3C7",
    order: 14,
  },
  "Business Services": {
    key: "business-services",
    description: {
      en: "Company formation, legal, visa, accounting, HR, and translation services.",
      ar: "تأسيس الشركات والخدمات القانونية والتأشيرات والمحاسبة والموارد البشرية والترجمة.",
    },
    slug: { en: "business-services", ar: "business-services" },
    accent: "#0E7490",
    soft: "#CFFAFE",
    order: 15,
  },
  General: {
    key: "general",
    description: {
      en: "Uncategorized and custom B2B requests when no other industry applies.",
      ar: "طلبات B2B عامة ومخصصة عندما لا ينطبق أي قطاع آخر.",
    },
    slug: { en: "general", ar: "general" },
    accent: "#64748B",
    soft: "#F1F5F9",
    order: 99,
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** All industries covered by the marketplace category catalog. */
export const MARKETPLACE_INDUSTRIES: MarketplaceIndustry[] = (() => {
  const map = new Map<string, MarketplaceIndustry>();

  for (const cat of MARKETPLACE_CATEGORIES) {
    const en = cat.industry.en;
    const meta = INDUSTRY_META[en];
    const existing = map.get(en);

    if (existing) {
      if (!existing.categoryKeys.includes(cat.key)) existing.categoryKeys.push(cat.key);
      continue;
    }

    map.set(en, {
      key: meta?.key || slugify(en),
      name: { en: cat.industry.en, ar: cat.industry.ar },
      description: meta?.description || {
        en: `${cat.industry.en} suppliers and procurement on Hukum.`,
        ar: `موردو ومشتريات ${cat.industry.ar} على Hukum.`,
      },
      slug: meta?.slug || { en: slugify(en), ar: slugify(en) },
      accent: meta?.accent || cat.accent,
      soft: meta?.soft || cat.soft,
      order: meta?.order ?? 50,
      categoryKeys: [cat.key],
    });
  }

  return Array.from(map.values()).sort((a, b) => a.order - b.order || a.name.en.localeCompare(b.name.en));
})();

export function getIndustryByKey(key: string) {
  return MARKETPLACE_INDUSTRIES.find((i) => i.key === key);
}

export function getIndustryBySlug(slug: string) {
  return MARKETPLACE_INDUSTRIES.find((i) => i.slug.en === slug || i.slug.ar === slug || i.key === slug);
}

export function getIndustryCategories(industry: MarketplaceIndustry) {
  return MARKETPLACE_CATEGORIES.filter((c) => industry.categoryKeys.includes(c.key));
}
