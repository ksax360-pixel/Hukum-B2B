export type MarketplaceSector = {
  slug: string;
  nameEn: string;
  nameAr: string;
  subject: string;
  /** Existing public asset to reuse when present (under /categories or /images/categories). */
  legacyKeys?: string[];
  children?: Array<{ slug: string; nameEn: string; nameAr: string; subject: string; legacyKeys?: string[] }>;
};

export type MarketplaceSectorGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  sectors: MarketplaceSector[];
};

/** Popular row — same 10 keys as the homepage Browse by sector strip. */
export const POPULAR_SECTOR_SLUGS = [
  "safety-equipment",
  "building-materials",
  "electrical",
  "food-beverage",
  "oil-gas-equipment",
  "medical-supplies",
  "textiles",
  "lab-scientific",
  "office-stationery",
  "furniture-fit-out",
] as const;

export const MARKETPLACE_SECTOR_GROUPS: MarketplaceSectorGroup[] = [
  {
    id: "construction-building",
    nameEn: "Construction & building",
    nameAr: "البناء والتشييد",
    sectors: [
      {
        slug: "construction-services",
        nameEn: "Construction services",
        nameAr: "خدمات البناء",
        subject: "yellow hard hat on rolled blueprints with a measuring tape",
        legacyKeys: ["construction", "construction-services"],
        children: [
          { slug: "general-contracting", nameEn: "General contracting", nameAr: "مقاولات عامة", subject: "yellow hard hat and rolled blueprints" },
          { slug: "site-equipment", nameEn: "Site equipment", nameAr: "معدات الموقع", subject: "construction measuring tools and hard hat" },
        ],
      },
      {
        slug: "building-materials",
        nameEn: "Building materials",
        nameAr: "مواد البناء",
        subject: "cement bags stacked with red bricks and sand",
        legacyKeys: ["building-materials"],
        children: [
          { slug: "cement-concrete", nameEn: "Cement & concrete", nameAr: "أسمنت وخرسانة", subject: "cement bags and concrete blocks" },
          { slug: "bricks-blocks", nameEn: "Bricks & blocks", nameAr: "طوب وبلوك", subject: "stack of red clay bricks" },
        ],
      },
      {
        slug: "tools-hardware",
        nameEn: "Tools & hardware",
        nameAr: "الأدوات والمعدات",
        subject: "power drill, hammer and spanner set",
        legacyKeys: ["tools-hardware"],
      },
      {
        slug: "paints-coatings",
        nameEn: "Paints & coatings",
        nameAr: "الدهانات والطلاءات",
        subject: "paint cans with a roller and brush",
        legacyKeys: ["paints-coatings", "paints"],
      },
      {
        slug: "steel-rebar",
        nameEn: "Steel & rebar",
        nameAr: "الحديد والتسليح",
        subject: "bundle of steel rebar rods",
        legacyKeys: ["steel-rebar", "steel"],
      },
      {
        slug: "doors-windows",
        nameEn: "Doors & windows",
        nameAr: "الأبواب والنوافذ",
        subject: "modern wooden door beside an aluminium window frame",
        legacyKeys: ["doors-windows"],
      },
      {
        slug: "lighting",
        nameEn: "Lighting",
        nameAr: "الإضاءة",
        subject: "LED panel light, bulb and pendant lamp",
        legacyKeys: ["lighting"],
      },
      {
        slug: "plumbing-sanitary",
        nameEn: "Plumbing & sanitary",
        nameAr: "السباكة والأدوات الصحية",
        subject: "chrome tap, pipes and fittings",
        legacyKeys: ["plumbing", "plumbing-sanitary"],
      },
    ],
  },
  {
    id: "industrial-energy",
    nameEn: "Industrial & energy",
    nameAr: "الصناعة والطاقة",
    sectors: [
      {
        slug: "industrial-machinery",
        nameEn: "Industrial machinery",
        nameAr: "الآلات الصناعية",
        subject: "orange industrial robotic arm",
        legacyKeys: ["industrial-machinery"],
      },
      {
        slug: "electrical",
        nameEn: "Electrical",
        nameAr: "الكهرباء",
        subject: "circuit breakers, cable coil, socket and bulb",
        legacyKeys: ["electrical"],
      },
      {
        slug: "cables-wires",
        nameEn: "Cables & wires",
        nameAr: "الكابلات والأسلاك",
        subject: "coils of coloured electrical cables",
        legacyKeys: ["cables-wires", "cables"],
      },
      {
        slug: "renewable-energy",
        nameEn: "Renewable energy",
        nameAr: "الطاقة المتجددة",
        subject: "solar panel with inverter",
        legacyKeys: ["renewable-energy"],
      },
      {
        slug: "oil-gas-equipment",
        nameEn: "Oil & gas equipment",
        nameAr: "معدات النفط والغاز",
        subject: "industrial valve and pressure gauge",
        legacyKeys: ["oil-gas", "oil-gas-equipment"],
      },
      {
        slug: "hvac-refrigeration",
        nameEn: "HVAC & refrigeration",
        nameAr: "التكييف والتبريد",
        subject: "split AC unit and outdoor compressor",
        legacyKeys: ["hvac", "hvac-refrigeration"],
      },
      {
        slug: "spare-parts",
        nameEn: "Spare parts",
        nameAr: "قطع الغيار",
        subject: "gears, bearings and filters",
        legacyKeys: ["spare-parts"],
      },
      {
        slug: "instruments-testing",
        nameEn: "Instruments & testing",
        nameAr: "أجهزة القياس والاختبار",
        subject: "digital multimeter and pressure gauge",
        legacyKeys: ["instruments-testing", "instruments"],
      },
    ],
  },
  {
    id: "safety-workwear",
    nameEn: "Safety & workwear",
    nameAr: "السلامة وملابس العمل",
    sectors: [
      {
        slug: "safety-equipment",
        nameEn: "Safety equipment",
        nameAr: "معدات السلامة",
        subject: "white safety helmet",
        legacyKeys: ["safety-equipment"],
        children: [
          { slug: "ppe-kits", nameEn: "PPE kits", nameAr: "أطقم الحماية", subject: "safety helmet goggles and gloves kit" },
          { slug: "fall-protection", nameEn: "Fall protection", nameAr: "الحماية من السقوط", subject: "safety harness and lanyard" },
        ],
      },
      {
        slug: "safety-footwear",
        nameEn: "Safety footwear",
        nameAr: "أحذية السلامة",
        subject: "pair of steel-toe safety boots",
        legacyKeys: ["safety-footwear"],
      },
      {
        slug: "hand-protection",
        nameEn: "Hand protection",
        nameAr: "حماية اليدين",
        subject: "pair of leather work gloves",
        legacyKeys: ["hand-protection"],
      },
      {
        slug: "eye-protection",
        nameEn: "Eye protection",
        nameAr: "حماية العينين",
        subject: "safety goggles and glasses",
        legacyKeys: ["eye-protection"],
      },
      {
        slug: "workwear-uniforms",
        nameEn: "Workwear & uniforms",
        nameAr: "ملابس العمل والزي الموحد",
        subject: "hi-vis vest and coverall",
        legacyKeys: ["workwear-uniforms", "apparel"],
      },
      {
        slug: "fire-safety",
        nameEn: "Fire safety",
        nameAr: "السلامة من الحرائق",
        subject: "red fire extinguisher",
        legacyKeys: ["fire-safety"],
      },
      {
        slug: "security-systems",
        nameEn: "Security systems",
        nameAr: "أنظمة الأمن",
        subject: "CCTV camera and access-control keypad",
        legacyKeys: ["security-systems"],
      },
      {
        slug: "signage-barriers",
        nameEn: "Signage & barriers",
        nameAr: "اللافتات والحواجز",
        subject: "traffic cone and safety barrier",
        legacyKeys: ["signage-barriers"],
      },
    ],
  },
  {
    id: "food-hospitality",
    nameEn: "Food & hospitality",
    nameAr: "الأغذية والضيافة",
    sectors: [
      {
        slug: "food-beverage",
        nameEn: "Food & beverage",
        nameAr: "الأغذية والمشروبات",
        subject: "burlap sack of coffee beans",
        legacyKeys: ["food-beverage", "fmcg"],
      },
      {
        slug: "beverages",
        nameEn: "Beverages",
        nameAr: "المشروبات",
        subject: "bottled water and juice bottles",
        legacyKeys: ["beverages"],
      },
      {
        slug: "grains-staples",
        nameEn: "Grains & staples",
        nameAr: "الحبوب والأساسيات",
        subject: "sacks of rice and flour",
        legacyKeys: ["grains-staples"],
      },
      {
        slug: "kitchen-equipment",
        nameEn: "Kitchen equipment",
        nameAr: "معدات المطابخ",
        subject: "stainless steel commercial pots and pans",
        legacyKeys: ["kitchen-equipment", "home-appliances"],
      },
      {
        slug: "hospitality-cafes",
        nameEn: "Hospitality & cafés",
        nameAr: "الضيافة والمقاهي",
        subject: "espresso cup and saucer",
        legacyKeys: ["hospitality", "hospitality-cafes"],
      },
      {
        slug: "fresh-produce",
        nameEn: "Fresh produce",
        nameAr: "المنتجات الطازجة",
        subject: "crate of fresh fruit and vegetables",
        legacyKeys: ["fresh-produce"],
      },
      {
        slug: "confectionery",
        nameEn: "Confectionery",
        nameAr: "الحلويات والتمور",
        subject: "assorted chocolates and dates",
        legacyKeys: ["confectionery"],
      },
      {
        slug: "cold-chain",
        nameEn: "Cold chain",
        nameAr: "سلسلة التبريد",
        subject: "insulated cooler box with ice packs",
        legacyKeys: ["cold-chain"],
      },
    ],
  },
  {
    id: "health-science",
    nameEn: "Health & science",
    nameAr: "الصحة والعلوم",
    sectors: [
      {
        slug: "medical-supplies",
        nameEn: "Medical supplies",
        nameAr: "المستلزمات الطبية",
        subject: "surgical masks box and stethoscope",
        legacyKeys: ["medical-equipment", "medical-supplies"],
      },
      {
        slug: "pharmaceuticals",
        nameEn: "Pharmaceuticals",
        nameAr: "الأدوية",
        subject: "medicine boxes and blister packs",
        legacyKeys: ["pharmaceuticals"],
      },
      {
        slug: "lab-scientific",
        nameEn: "Lab & scientific",
        nameAr: "المختبرات والعلوم",
        subject: "microscope and lab glassware",
        legacyKeys: ["lab-scientific"],
      },
      {
        slug: "medical-consumables",
        nameEn: "Medical consumables",
        nameAr: "المستهلكات الطبية",
        subject: "syringes, gloves and gauze",
        legacyKeys: ["medical-consumables"],
      },
      {
        slug: "cleaning-hygiene",
        nameEn: "Cleaning & hygiene",
        nameAr: "التنظيف والنظافة",
        subject: "cleaning bottles and microfibre cloths",
        legacyKeys: ["cleaning", "cleaning-hygiene"],
      },
      {
        slug: "cosmetics-personal-care",
        nameEn: "Cosmetics & personal care",
        nameAr: "التجميل والعناية الشخصية",
        subject: "skincare bottles and jars",
        legacyKeys: ["beauty", "cosmetics-personal-care"],
      },
    ],
  },
  {
    id: "business-logistics",
    nameEn: "Business & logistics",
    nameAr: "الأعمال والخدمات اللوجستية",
    sectors: [
      {
        slug: "packaging",
        nameEn: "Packaging",
        nameAr: "التعبئة والتغليف",
        subject: "stack of brown cardboard boxes and stretch wrap",
        legacyKeys: ["packaging"],
      },
      {
        slug: "logistics",
        nameEn: "Logistics",
        nameAr: "الخدمات اللوجستية",
        subject: "white delivery truck",
        legacyKeys: ["logistics"],
      },
      {
        slug: "warehousing",
        nameEn: "Warehousing",
        nameAr: "التخزين والمستودعات",
        subject: "pallet of boxes on a pallet jack",
        legacyKeys: ["warehousing"],
      },
      {
        slug: "printing",
        nameEn: "Printing",
        nameAr: "الطباعة",
        subject: "office printer with paper stack",
        legacyKeys: ["printing-services", "printing"],
      },
      {
        slug: "office-stationery",
        nameEn: "Office & stationery",
        nameAr: "المكتب والقرطاسية",
        subject: "stack of A4 paper reams and pens",
        legacyKeys: ["stationery", "office-supplies", "office-stationery"],
      },
      {
        slug: "it-electronics",
        nameEn: "IT & electronics",
        nameAr: "تقنية المعلومات والإلكترونيات",
        subject: "laptop and monitor",
        legacyKeys: ["it-services", "it-electronics"],
      },
      {
        slug: "telecom-networking",
        nameEn: "Telecom & networking",
        nameAr: "الاتصالات والشبكات",
        subject: "network switch and router",
        legacyKeys: ["telecom", "telecom-networking"],
      },
      {
        slug: "furniture-fit-out",
        nameEn: "Furniture & fit-out",
        nameAr: "الأثاث والتشطيبات",
        subject: "modern sofa and side table",
        legacyKeys: ["furniture-fitout", "furniture-fit-out"],
      },
      {
        slug: "automotive-parts",
        nameEn: "Automotive & parts",
        nameAr: "السيارات وقطع الغيار",
        subject: "car tyre and brake disc",
        legacyKeys: ["automotive", "automotive-parts"],
      },
      {
        slug: "agriculture",
        nameEn: "Agriculture",
        nameAr: "الزراعة",
        subject: "seedling tray and fertiliser bag",
        legacyKeys: ["agriculture"],
      },
      {
        slug: "textiles",
        nameEn: "Textiles",
        nameAr: "المنسوجات",
        subject: "rolls of fabric",
        legacyKeys: ["textiles"],
      },
    ],
  },
];

export const ALL_MARKETPLACE_SECTORS = MARKETPLACE_SECTOR_GROUPS.flatMap((g) => g.sectors);

export function findMarketplaceSector(slug: string) {
  return ALL_MARKETPLACE_SECTORS.find((s) => s.slug === slug) || null;
}

export function sectorImagePaths(slug: string) {
  return {
    webp: `/images/categories/${slug}.webp`,
    png: `/images/categories/${slug}.png`,
    legacyJpg: `/categories/${slug}.jpg`,
    legacyPng: `/categories/${slug}.png`,
  };
}
