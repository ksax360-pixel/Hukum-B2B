export type MarketplaceCategory = {
  key: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  industry: { en: string; ar: string };
  slug: { en: string; ar: string };
  accent: string;
  soft: string;
  order: number;
  children?: Array<{
    key: string;
    name: { en: string; ar: string };
    slug: { en: string; ar: string };
  }>;
};

/** Top-level B2B marketplace categories shown on the Categories page. */
export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    key: "safety-equipment",
    name: { en: "Safety Equipment", ar: "معدات السلامة" },
    description: {
      en: "Industrial PPE and safety gear from verified Saudi suppliers — helmets, gloves, eye protection, footwear, harnesses, and more for construction and plant sites.",
      ar: "معدات وقاية شخصية وسلامة صناعية من موردين موثّقين في السعودية — خوذ وقفازات وحماية العين والأحذية وأحزمة الأمان لمواقع الإنشاء والمصانع.",
    },
    industry: { en: "Safety & PPE", ar: "السلامة والحماية" },
    slug: { en: "safety-equipment", ar: "safety-equipment" },
    accent: "#E11D48",
    soft: "#FFE4E6",
    order: 1,
    children: [
      { key: "safety-helmets", name: { en: "Safety Helmets", ar: "خوذ السلامة" }, slug: { en: "safety-helmets", ar: "safety-helmets" } },
      { key: "safety-gloves", name: { en: "Safety Gloves", ar: "قفازات السلامة" }, slug: { en: "safety-gloves", ar: "safety-gloves" } },
      { key: "eye-protection", name: { en: "Eye & Face Protection", ar: "حماية العين والوجه" }, slug: { en: "eye-protection", ar: "eye-protection" } },
      { key: "fall-protection", name: { en: "Fall Protection", ar: "الحماية من السقوط" }, slug: { en: "fall-protection", ar: "fall-protection" } },
      { key: "safety-footwear", name: { en: "Safety Footwear", ar: "أحذية السلامة" }, slug: { en: "safety-footwear", ar: "safety-footwear" } },
      { key: "hi-vis-vests", name: { en: "Hi-Vis Vests", ar: "سترات عاكسة" }, slug: { en: "hi-vis-vests", ar: "hi-vis-vests" } },
      { key: "hearing-protection", name: { en: "Hearing Protection", ar: "حماية السمع" }, slug: { en: "hearing-protection", ar: "hearing-protection" } },
      { key: "respiratory-protection", name: { en: "Respiratory Protection", ar: "حماية الجهاز التنفسي" }, slug: { en: "respiratory-protection", ar: "respiratory-protection" } },
    ],
  },
  {
    key: "construction",
    name: { en: "Construction", ar: "الإنشاءات" },
    description: {
      en: "Contracting, civil works, scaffolding, and site equipment.",
      ar: "المقاولات والأعمال المدنية والسقالات ومعدات المواقع.",
    },
    industry: { en: "Construction", ar: "الإنشاءات" },
    slug: { en: "construction", ar: "construction" },
    accent: "#EA580C",
    soft: "#FFEDD5",
    order: 2,
    children: [
      { key: "scaffolding", name: { en: "Scaffolding", ar: "السقالات" }, slug: { en: "scaffolding", ar: "scaffolding" } },
      { key: "formwork", name: { en: "Formwork", ar: "القوالب" }, slug: { en: "formwork", ar: "formwork" } },
      { key: "heavy-equipment", name: { en: "Heavy Equipment", ar: "المعدات الثقيلة" }, slug: { en: "heavy-equipment", ar: "heavy-equipment" } },
    ],
  },
  {
    key: "building-materials",
    name: { en: "Building Materials", ar: "مواد البناء" },
    description: {
      en: "Cement, steel, blocks, insulation, finishes, and hardware.",
      ar: "الأسمنت والحديد والبلوك والعزل والتشطيبات.",
    },
    industry: { en: "Construction", ar: "الإنشاءات" },
    slug: { en: "building-materials", ar: "building-materials" },
    accent: "#B45309",
    soft: "#FEF3C7",
    order: 3,
    children: [
      { key: "cement", name: { en: "Cement & Concrete", ar: "الأسمنت والخرسانة" }, slug: { en: "cement-concrete", ar: "cement" } },
      { key: "steel", name: { en: "Steel & Metals", ar: "الحديد والمعادن" }, slug: { en: "steel-metals", ar: "steel" } },
      { key: "pipes", name: { en: "Pipes & Fittings", ar: "الأنابيب والتوصيلات" }, slug: { en: "pipes-fittings", ar: "pipes" } },
      { key: "tiles", name: { en: "Tiles & Finishing", ar: "البلاط والتشطيبات" }, slug: { en: "tiles-finishing", ar: "tiles" } },
      { key: "building-chemicals", name: { en: "Building Chemicals", ar: "كيماويات البناء" }, slug: { en: "building-chemicals", ar: "building-chemicals" } },
      { key: "insulation", name: { en: "Insulation Materials", ar: "مواد العزل" }, slug: { en: "insulation-materials", ar: "insulation" } },
      { key: "bricks", name: { en: "Bricks & Blocks", ar: "الطوب والبلوك" }, slug: { en: "bricks-blocks", ar: "bricks" } },
      { key: "aggregates", name: { en: "Sand & Aggregates", ar: "الرمل والركام" }, slug: { en: "sand-aggregates", ar: "aggregates" } },
    ],
  },
  {
    key: "fmcg",
    name: { en: "FMCG", ar: "السلع الاستهلاكية" },
    description: {
      en: "Fast-moving consumer goods, beverages, snacks, and retail staples.",
      ar: "السلع الاستهلاكية سريعة الحركة والمشروبات والوجبات الخفيفة.",
    },
    industry: { en: "FMCG", ar: "السلع الاستهلاكية" },
    slug: { en: "fmcg", ar: "fmcg" },
    accent: "#CA8A04",
    soft: "#FEF9C3",
    order: 4,
    children: [
      { key: "beverages", name: { en: "Beverages", ar: "المشروبات" }, slug: { en: "beverages", ar: "beverages" } },
      { key: "snacks", name: { en: "Snacks & Confectionery", ar: "الوجبات والحلويات" }, slug: { en: "snacks", ar: "snacks" } },
      { key: "household", name: { en: "Household Consumables", ar: "مستهلكات المنزل" }, slug: { en: "household", ar: "household" } },
    ],
  },
  {
    key: "food-beverage",
    name: { en: "Food & Beverage", ar: "الأغذية والمشروبات" },
    description: {
      en: "Wholesale food, catering supplies, cold chain, and HORECA.",
      ar: "الأغذية بالجملة ومستلزمات التموين وسلسلة التبريد.",
    },
    industry: { en: "FMCG", ar: "السلع الاستهلاكية" },
    slug: { en: "food-beverage", ar: "food-beverage" },
    accent: "#16A34A",
    soft: "#DCFCE7",
    order: 5,
  },
  {
    key: "medical-equipment",
    name: { en: "Medical Equipment", ar: "المعدات الطبية" },
    description: {
      en: "Hospital devices, diagnostics, disposables, and clinic supplies.",
      ar: "أجهزة المستشفيات والتشخيص والمستلزمات الطبية.",
    },
    industry: { en: "Healthcare", ar: "الرعاية الصحية" },
    slug: { en: "medical-equipment", ar: "medical-equipment" },
    accent: "#0EA5E9",
    soft: "#E0F2FE",
    order: 6,
    children: [
      { key: "diagnostics", name: { en: "Diagnostics", ar: "أجهزة التشخيص" }, slug: { en: "diagnostics", ar: "diagnostics" } },
      { key: "disposables", name: { en: "Medical Disposables", ar: "المستهلكات الطبية" }, slug: { en: "disposables", ar: "disposables" } },
    ],
  },
  {
    key: "pharmaceuticals",
    name: { en: "Pharmaceuticals", ar: "الأدوية" },
    description: {
      en: "Wholesale pharma, OTC, and pharmacy distribution (demo catalog).",
      ar: "توزيع الأدوية والمستحضرات الصيدلانية (كتالوج تجريبي).",
    },
    industry: { en: "Healthcare", ar: "الرعاية الصحية" },
    slug: { en: "pharmaceuticals", ar: "pharmaceuticals" },
    accent: "#0284C7",
    soft: "#E0F2FE",
    order: 7,
  },
  {
    key: "lab-scientific",
    name: { en: "Lab & Scientific", ar: "المختبرات والعلوم" },
    description: {
      en: "Lab instruments, reagents, glassware, and research supplies.",
      ar: "أجهزة المختبرات والكواشف والزجاجيات ومستلزمات البحث.",
    },
    industry: { en: "Healthcare", ar: "الرعاية الصحية" },
    slug: { en: "lab-scientific", ar: "lab-scientific" },
    accent: "#6366F1",
    soft: "#E0E7FF",
    order: 8,
  },
  {
    key: "textiles",
    name: { en: "Textiles", ar: "المنسوجات" },
    description: {
      en: "Fabrics, yarns, industrial textiles, and finishing materials.",
      ar: "الأقمشة والخيوط والمنسوجات الصناعية ومواد التشطيب.",
    },
    industry: { en: "Apparel & Textiles", ar: "الملابس والمنسوجات" },
    slug: { en: "textiles", ar: "textiles" },
    accent: "#DB2777",
    soft: "#FCE7F3",
    order: 9,
  },
  {
    key: "apparel",
    name: { en: "Apparel & Uniforms", ar: "الملابس والزي الموحد" },
    description: {
      en: "Workwear, corporate uniforms, FR clothing, and fashion wholesale.",
      ar: "ملابس العمل والزي الموحد والملابس المقاومة للحريق.",
    },
    industry: { en: "Apparel & Textiles", ar: "الملابس والمنسوجات" },
    slug: { en: "apparel-uniforms", ar: "apparel" },
    accent: "#BE185D",
    soft: "#FCE7F3",
    order: 10,
    children: [
      { key: "workwear", name: { en: "Workwear", ar: "ملابس العمل" }, slug: { en: "workwear", ar: "workwear" } },
      { key: "fr-uniforms", name: { en: "FR Uniforms", ar: "زي مقاوم للحريق" }, slug: { en: "fr-uniforms", ar: "fr-uniforms" } },
    ],
  },
  {
    key: "it-services",
    name: { en: "IT Services", ar: "خدمات تقنية المعلومات" },
    description: {
      en: "Website development, software, ERP, 3D/360, digital marketing, and full IT services.",
      ar: "تطوير المواقع والبرمجيات وأنظمة ERP وثلاثي الأبعاد والتسويق الرقمي وجميع خدمات تقنية المعلومات.",
    },
    industry: { en: "Technology & Services", ar: "التقنية والخدمات" },
    slug: { en: "it-services", ar: "it-services" },
    accent: "#4F46E5",
    soft: "#E0E7FF",
    order: 11,
    children: [
      { key: "web-dev", name: { en: "Website Development", ar: "تطوير المواقع" }, slug: { en: "website-development", ar: "web-dev" } },
      { key: "software-dev", name: { en: "Software Development", ar: "تطوير البرمجيات" }, slug: { en: "software-development", ar: "software-dev" } },
      { key: "erp-systems", name: { en: "ERP & Business Systems", ar: "أنظمة تخطيط الموارد والأعمال" }, slug: { en: "erp-business-systems", ar: "erp" } },
      { key: "3d-360", name: { en: "3D & 360 Visualization", ar: "تصوير ثلاثي الأبعاد و360" }, slug: { en: "3d-360-visualization", ar: "3d-360" } },
      { key: "digital-marketing", name: { en: "Digital Marketing", ar: "التسويق الرقمي" }, slug: { en: "digital-marketing", ar: "digital-marketing" } },
      { key: "mobile-apps", name: { en: "Mobile App Development", ar: "تطوير تطبيقات الجوال" }, slug: { en: "mobile-app-development", ar: "mobile-apps" } },
      { key: "cloud-hosting", name: { en: "Cloud & Hosting", ar: "السحابة والاستضافة" }, slug: { en: "cloud-hosting", ar: "cloud" } },
      { key: "cybersecurity", name: { en: "Cybersecurity", ar: "الأمن السيبراني" }, slug: { en: "cybersecurity", ar: "cybersecurity" } },
      { key: "ui-ux", name: { en: "UI / UX Design", ar: "تصميم واجهات وتجربة المستخدم" }, slug: { en: "ui-ux-design", ar: "ui-ux" } },
      { key: "it-consulting", name: { en: "IT Consulting", ar: "استشارات تقنية المعلومات" }, slug: { en: "it-consulting", ar: "it-consulting" } },
      { key: "it-others", name: { en: "Others (IT)", ar: "أخرى (تقنية معلومات)" }, slug: { en: "it-others", ar: "it-others" } },
    ],
  },
  {
    key: "telecom",
    name: { en: "Telecom & Networking", ar: "الاتصالات والشبكات" },
    description: {
      en: "Networking gear, structured cabling, and telecom infrastructure.",
      ar: "معدات الشبكات والكابلات والبنية التحتية للاتصالات.",
    },
    industry: { en: "Technology & Services", ar: "التقنية والخدمات" },
    slug: { en: "telecom-networking", ar: "telecom" },
    accent: "#7C3AED",
    soft: "#EDE9FE",
    order: 12,
  },
  {
    key: "electrical",
    name: { en: "Electrical & Electronics", ar: "الكهرباء والإلكترونيات" },
    description: {
      en: "Cables, switchgear, panels, sensors, and electronic components.",
      ar: "الكابلات ولوحات التوزيع والحساسات والمكونات الإلكترونية.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "electrical-electronics", ar: "electrical" },
    accent: "#F59E0B",
    soft: "#FEF3C7",
    order: 13,
  },
  {
    key: "industrial-machinery",
    name: { en: "Industrial Machinery", ar: "الآلات الصناعية" },
    description: {
      en: "Production lines, CNC, packaging machines, and plant equipment.",
      ar: "خطوط الإنتاج وآلات CNC ومعدات المصانع.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "industrial-machinery", ar: "machinery" },
    accent: "#475569",
    soft: "#E2E8F0",
    order: 14,
  },
  {
    key: "hvac",
    name: { en: "HVAC & Refrigeration", ar: "التكييف والتبريد" },
    description: {
      en: "AC units, chillers, ventilation, and cold-storage systems.",
      ar: "أجهزة التكييف والمبردات والتهوية والتخزين البارد.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "hvac-refrigeration", ar: "hvac" },
    accent: "#06B6D4",
    soft: "#CFFAFE",
    order: 15,
  },
  {
    key: "oil-gas",
    name: { en: "Oil & Gas Equipment", ar: "معدات النفط والغاز" },
    description: {
      en: "Valves, pipes, flanges, pumps, and upstream/downstream supplies.",
      ar: "الصمامات والأنابيب والفلنجات والمضخات ومستلزمات القطاع.",
    },
    industry: { en: "Energy", ar: "الطاقة" },
    slug: { en: "oil-gas-equipment", ar: "oil-gas" },
    accent: "#0F766E",
    soft: "#CCFBF1",
    order: 16,
  },
  {
    key: "renewable-energy",
    name: { en: "Renewable Energy", ar: "الطاقة المتجددة" },
    description: {
      en: "Solar panels, inverters, storage, and green-energy projects.",
      ar: "الألواح الشمسية والعاكسات والتخزين ومشاريع الطاقة الخضراء.",
    },
    industry: { en: "Energy", ar: "الطاقة" },
    slug: { en: "renewable-energy", ar: "renewable" },
    accent: "#65A30D",
    soft: "#ECFCCB",
    order: 17,
  },
  {
    key: "automotive",
    name: { en: "Automotive & Spare Parts", ar: "السيارات وقطع الغيار" },
    description: {
      en: "OEM/aftermarket parts, fleet maintenance, and workshop tools.",
      ar: "قطع الغيار وصيانة الأساطيل وأدوات الورش.",
    },
    industry: { en: "Automotive", ar: "السيارات" },
    slug: { en: "automotive-spare-parts", ar: "automotive" },
    accent: "#DC2626",
    soft: "#FEE2E2",
    order: 18,
  },
  {
    key: "packaging",
    name: { en: "Packaging Materials", ar: "مواد التعبئة والتغليف" },
    description: {
      en: "Corrugated boxes, flexible packaging, labels, tapes, and industrial packing supplies.",
      ar: "الكراتين والتعبئة المرنة والملصقات والأشرطة ومستلزمات التعبئة الصناعية.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "packaging-materials", ar: "packaging" },
    accent: "#0F766E",
    soft: "#CCFBF1",
    order: 19,
    children: [
      { key: "corrugated-boxes", name: { en: "Corrugated Boxes", ar: "كراتين مموجة" }, slug: { en: "corrugated-boxes", ar: "corrugated" } },
      { key: "flexible-packaging", name: { en: "Flexible Packaging", ar: "تعبئة مرنة" }, slug: { en: "flexible-packaging", ar: "flexible" } },
      { key: "labels-stickers", name: { en: "Labels & Stickers", ar: "الملصقات والستيكرات" }, slug: { en: "labels-stickers", ar: "labels" } },
      { key: "packing-tapes", name: { en: "Tapes & Strapping", ar: "الأشرطة والتطويق" }, slug: { en: "tapes-strapping", ar: "tapes" } },
      { key: "packaging-others", name: { en: "Others (Packaging)", ar: "أخرى (تعبئة)" }, slug: { en: "packaging-others", ar: "packaging-others" } },
    ],
  },
  {
    key: "printing-services",
    name: { en: "Printing & Digital Printing", ar: "الطباعة والطباعة الرقمية" },
    description: {
      en: "Commercial printing, digital printing, large-format, promotional print, and print finishing.",
      ar: "الطباعة التجارية والرقمية والطباعة كبيرة الحجم والمطبوعات الترويجية والتشطيب.",
    },
    industry: { en: "Business Supplies", ar: "مستلزمات الأعمال" },
    slug: { en: "printing-digital-printing", ar: "printing" },
    accent: "#1D4ED8",
    soft: "#DBEAFE",
    order: 20,
    children: [
      { key: "commercial-printing", name: { en: "Commercial Printing", ar: "الطباعة التجارية" }, slug: { en: "commercial-printing", ar: "commercial-print" } },
      { key: "digital-printing", name: { en: "Digital Printing", ar: "الطباعة الرقمية" }, slug: { en: "digital-printing", ar: "digital-print" } },
      { key: "large-format-printing", name: { en: "Large Format Printing", ar: "الطباعة كبيرة الحجم" }, slug: { en: "large-format-printing", ar: "large-format" } },
      { key: "offset-printing", name: { en: "Offset Printing", ar: "طباعة أوفست" }, slug: { en: "offset-printing", ar: "offset" } },
      { key: "promotional-print", name: { en: "Promotional Print", ar: "مطبوعات ترويجية" }, slug: { en: "promotional-print", ar: "promo-print" } },
      { key: "print-finishing", name: { en: "Print Finishing & Binding", ar: "تشطيب وتجليد المطبوعات" }, slug: { en: "print-finishing-binding", ar: "finishing" } },
      { key: "printing-materials", name: { en: "Printing Materials & Consumables", ar: "مواد ومستلزمات الطباعة" }, slug: { en: "printing-materials", ar: "print-materials" } },
      { key: "printing-others", name: { en: "Others (Printing)", ar: "أخرى (طباعة)" }, slug: { en: "printing-others", ar: "printing-others" } },
    ],
  },
  {
    key: "stationery",
    name: { en: "Stationery", ar: "القرطاسية" },
    description: {
      en: "Office stationery, writing supplies, notebooks, files, and school & corporate stationery.",
      ar: "القرطاسية المكتبية ومستلزمات الكتابة والدفاتر والملفات وقرطاسية المدارس والشركات.",
    },
    industry: { en: "Business Supplies", ar: "مستلزمات الأعمال" },
    slug: { en: "stationery", ar: "stationery" },
    accent: "#B45309",
    soft: "#FEF3C7",
    order: 21,
    children: [
      { key: "writing-instruments", name: { en: "Writing Instruments", ar: "أدوات الكتابة" }, slug: { en: "writing-instruments", ar: "writing" } },
      { key: "notebooks-paper", name: { en: "Notebooks & Paper", ar: "الدفاتر والورق" }, slug: { en: "notebooks-paper", ar: "paper" } },
      { key: "files-folders", name: { en: "Files & Folders", ar: "الملفات والمجلدات" }, slug: { en: "files-folders", ar: "files" } },
      { key: "desk-accessories", name: { en: "Desk Accessories", ar: "إكسسوارات المكتب" }, slug: { en: "desk-accessories", ar: "desk" } },
      { key: "school-stationery", name: { en: "School Stationery", ar: "قرطاسية مدرسية" }, slug: { en: "school-stationery", ar: "school-stationery" } },
      { key: "corporate-stationery", name: { en: "Corporate Stationery", ar: "قرطاسية الشركات" }, slug: { en: "corporate-stationery", ar: "corporate-stationery" } },
      { key: "stationery-others", name: { en: "Others (Stationery)", ar: "أخرى (قرطاسية)" }, slug: { en: "stationery-others", ar: "stationery-others" } },
    ],
  },
  {
    key: "office-supplies",
    name: { en: "Office Supplies & Equipment", ar: "مستلزمات ومعدات المكاتب" },
    description: {
      en: "Printers, copiers, toner, office machines, and workplace essentials.",
      ar: "الطابعات والناسخات والأحبار والآلات المكتبية ومستلزمات بيئة العمل.",
    },
    industry: { en: "Business Supplies", ar: "مستلزمات الأعمال" },
    slug: { en: "office-supplies-equipment", ar: "office" },
    accent: "#2563EB",
    soft: "#DBEAFE",
    order: 22,
    children: [
      { key: "printers-copiers", name: { en: "Printers & Copiers", ar: "طابعات وناسخات" }, slug: { en: "printers-copiers", ar: "printers" } },
      { key: "toner-ink", name: { en: "Toner, Ink & Cartridges", ar: "أحبار وخراطيش" }, slug: { en: "toner-ink-cartridges", ar: "toner" } },
      { key: "office-machines", name: { en: "Office Machines", ar: "آلات مكتبية" }, slug: { en: "office-machines", ar: "office-machines" } },
      { key: "workplace-essentials", name: { en: "Workplace Essentials", ar: "أساسيات بيئة العمل" }, slug: { en: "workplace-essentials", ar: "workplace" } },
      { key: "office-others", name: { en: "Others (Office)", ar: "أخرى (مكاتب)" }, slug: { en: "office-others", ar: "office-others" } },
    ],
  },
  {
    key: "furniture-fitout",
    name: { en: "Furniture & Fit-out", ar: "الأثاث والتشطيب" },
    description: {
      en: "Commercial furniture, interior fit-out, and joinery.",
      ar: "أثاث تجاري وتشطيب داخلي وأعمال النجارة.",
    },
    industry: { en: "Business Supplies", ar: "مستلزمات الأعمال" },
    slug: { en: "furniture-fitout", ar: "furniture" },
    accent: "#92400E",
    soft: "#FEF3C7",
    order: 23,
  },
  {
    key: "lighting",
    name: { en: "Lighting & Fixtures", ar: "الإضاءة والتركيبات" },
    description: {
      en: "LED lighting, outdoor fixtures, and smart lighting systems.",
      ar: "إضاءة LED والتركيبات الخارجية وأنظمة الإضاءة الذكية.",
    },
    industry: { en: "Construction", ar: "الإنشاءات" },
    slug: { en: "lighting-fixtures", ar: "lighting" },
    accent: "#FBBF24",
    soft: "#FEF9C3",
    order: 24,
  },
  {
    key: "plumbing",
    name: { en: "Plumbing & Sanitary", ar: "السباكة والصحي" },
    description: {
      en: "Pipes, fittings, bathrooms, pumps, and sanitary ware.",
      ar: "الأنابيب والتوصيلات والحمامات والمضخات والأدوات الصحية.",
    },
    industry: { en: "Construction", ar: "الإنشاءات" },
    slug: { en: "plumbing-sanitary", ar: "plumbing" },
    accent: "#0891B2",
    soft: "#CFFAFE",
    order: 25,
  },
  {
    key: "tools-hardware",
    name: { en: "Tools & Hardware", ar: "الأدوات والأدوات المعدنية" },
    description: {
      en: "Hand tools, power tools, fasteners, and workshop hardware.",
      ar: "الأدوات اليدوية والكهربائية والمثبتات ومستلزمات الورش.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "tools-hardware", ar: "tools" },
    accent: "#64748B",
    soft: "#F1F5F9",
    order: 26,
  },
  {
    key: "agriculture",
    name: { en: "Agriculture & Farming", ar: "الزراعة والمزارع" },
    description: {
      en: "Irrigation, fertilizers, greenhouse supplies, and agri machinery.",
      ar: "الري والأسمدة ومستلزمات البيوت المحمية والآلات الزراعية.",
    },
    industry: { en: "Agriculture", ar: "الزراعة" },
    slug: { en: "agriculture-farming", ar: "agriculture" },
    accent: "#15803D",
    soft: "#DCFCE7",
    order: 27,
  },
  {
    key: "logistics",
    name: { en: "Logistics & Warehousing", ar: "الخدمات اللوجستية والمستودعات" },
    description: {
      en: "Freight, 3PL, racking, material handling, and warehouse tech.",
      ar: "الشحن والتخزين والأرفف ومناولة المواد وتقنية المستودعات.",
    },
    industry: { en: "Logistics", ar: "اللوجستيات" },
    slug: { en: "logistics-warehousing", ar: "logistics" },
    accent: "#1D4ED8",
    soft: "#DBEAFE",
    order: 28,
  },
  {
    key: "facility-management",
    name: { en: "Facility Management", ar: "إدارة المرافق" },
    description: {
      en: "FM services, maintenance contracts, and building operations.",
      ar: "خدمات إدارة المرافق وعقود الصيانة وتشغيل المباني.",
    },
    industry: { en: "Services", ar: "الخدمات" },
    slug: { en: "facility-management", ar: "fm" },
    accent: "#334155",
    soft: "#F1F5F9",
    order: 29,
  },
  {
    key: "cleaning",
    name: { en: "Cleaning & Sanitation", ar: "التنظيف والتعقيم" },
    description: {
      en: "Janitorial supplies, hygiene chemicals, and cleaning machines.",
      ar: "مستلزمات النظافة ومواد التعقيم وآلات التنظيف.",
    },
    industry: { en: "Services", ar: "الخدمات" },
    slug: { en: "cleaning-sanitation", ar: "cleaning" },
    accent: "#14B8A6",
    soft: "#CCFBF1",
    order: 30,
  },
  {
    key: "chemicals",
    name: { en: "Chemicals & Petrochemicals", ar: "الكيماويات والبتروكيماويات" },
    description: {
      en: "Industrial chemicals, solvents, resins, and specialty compounds.",
      ar: "الكيماويات الصناعية والمذيبات والراتنجات والمركبات الخاصة.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "chemicals-petrochemicals", ar: "chemicals" },
    accent: "#7E22CE",
    soft: "#F3E8FF",
    order: 31,
  },
  {
    key: "plastics",
    name: { en: "Plastics & Rubber", ar: "البلاستيك والمطاط" },
    description: {
      en: "Resins, films, molded parts, hoses, and rubber products.",
      ar: "الراتنجات والأفلام والأجزاء المصبوبة والخراطيم.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "plastics-rubber", ar: "plastics" },
    accent: "#A855F7",
    soft: "#F3E8FF",
    order: 32,
  },
  {
    key: "security-systems",
    name: { en: "Security Systems", ar: "أنظمة الأمن" },
    description: {
      en: "CCTV, access control, alarms, and surveillance solutions.",
      ar: "كاميرات المراقبة والتحكم بالدخول والإنذار.",
    },
    industry: { en: "Technology & Services", ar: "التقنية والخدمات" },
    slug: { en: "security-systems", ar: "security" },
    accent: "#1E3A8A",
    soft: "#DBEAFE",
    order: 33,
  },
  {
    key: "hospitality",
    name: { en: "Hospitality Supplies", ar: "مستلزمات الضيافة" },
    description: {
      en: "Hotel, restaurant, and catering equipment and amenities.",
      ar: "معدات ومستلزمات الفنادق والمطاعم والتموين.",
    },
    industry: { en: "Hospitality", ar: "الضيافة" },
    slug: { en: "hospitality-supplies", ar: "hospitality" },
    accent: "#C026D3",
    soft: "#FAE8FF",
    order: 34,
  },
  {
    key: "beauty",
    name: { en: "Beauty & Personal Care", ar: "التجميل والعناية الشخصية" },
    description: {
      en: "Salon, spa, and wholesale personal-care products.",
      ar: "مستلزمات الصالونات والمنتجعات والعناية الشخصية بالجملة.",
    },
    industry: { en: "FMCG", ar: "السلع الاستهلاكية" },
    slug: { en: "beauty-personal-care", ar: "beauty" },
    accent: "#EC4899",
    soft: "#FCE7F3",
    order: 35,
  },
  {
    key: "education",
    name: { en: "Education & Training", ar: "التعليم والتدريب" },
    description: {
      en: "School supplies, lab kits, e-learning, and training services.",
      ar: "مستلزمات المدارس وحقائب المختبرات والتعليم الإلكتروني.",
    },
    industry: { en: "Services", ar: "الخدمات" },
    slug: { en: "education-training", ar: "education" },
    accent: "#F97316",
    soft: "#FFEDD5",
    order: 36,
  },
  {
    key: "water-treatment",
    name: { en: "Water Treatment", ar: "معالجة المياه" },
    description: {
      en: "Filtration, RO plants, pumps, and water-quality systems.",
      ar: "الترشيح ومحطات التناضح العكسي والمضخات وأنظمة جودة المياه.",
    },
    industry: { en: "Energy", ar: "الطاقة" },
    slug: { en: "water-treatment", ar: "water" },
    accent: "#0284C7",
    soft: "#E0F2FE",
    order: 37,
  },
  {
    key: "waste-management",
    name: { en: "Waste Management", ar: "إدارة النفايات" },
    description: {
      en: "Waste bins, recycling, compactors, and environmental services.",
      ar: "حاويات النفايات وإعادة التدوير والضواغط والخدمات البيئية.",
    },
    industry: { en: "Services", ar: "الخدمات" },
    slug: { en: "waste-management", ar: "waste" },
    accent: "#4D7C0F",
    soft: "#ECFCCB",
    order: 38,
  },
  {
    key: "mining",
    name: { en: "Mining & Minerals", ar: "التعدين والمعادن" },
    description: {
      en: "Mining tools, minerals trading, and quarry equipment.",
      ar: "أدوات التعدين وتجارة المعادن ومعدات المحاجر.",
    },
    industry: { en: "Industrial", ar: "الصناعي" },
    slug: { en: "mining-minerals", ar: "mining" },
    accent: "#78716C",
    soft: "#F5F5F4",
    order: 39,
  },
  {
    key: "home-appliances",
    name: { en: "Home Appliances", ar: "الأجهزة المنزلية" },
    description: {
      en: "Wholesale white goods, small appliances, and kitchen equipment.",
      ar: "الأجهزة البيضاء والأجهزة الصغيرة ومعدات المطابخ بالجملة.",
    },
    industry: { en: "Business Supplies", ar: "مستلزمات الأعمال" },
    slug: { en: "home-appliances", ar: "appliances" },
    accent: "#0D9488",
    soft: "#CCFBF1",
    order: 40,
  },
  {
    key: "marketing-services",
    name: { en: "Marketing & Creative", ar: "التسويق والإبداع" },
    description: {
      en: "Branding, advertising, media production, and event services.",
      ar: "العلامة التجارية والإعلان والإنتاج الإعلامي والفعاليات.",
    },
    industry: { en: "Services", ar: "الخدمات" },
    slug: { en: "marketing-creative", ar: "marketing" },
    accent: "#E11D48",
    soft: "#FFE4E6",
    order: 41,
    children: [
      { key: "branding", name: { en: "Branding & Identity", ar: "الهوية والعلامة التجارية" }, slug: { en: "branding-identity", ar: "branding" } },
      { key: "media-production", name: { en: "Media Production", ar: "الإنتاج الإعلامي" }, slug: { en: "media-production", ar: "media" } },
      { key: "events", name: { en: "Events & Activations", ar: "الفعاليات والتنشيط" }, slug: { en: "events-activations", ar: "events" } },
      { key: "marketing-others", name: { en: "Others (Marketing)", ar: "أخرى (تسويق)" }, slug: { en: "marketing-others", ar: "marketing-others" } },
    ],
  },
  {
    key: "company-formation",
    name: { en: "Company Registration & Formation", ar: "تأسيس وتسجيل الشركات" },
    description: {
      en: "Company formation, commercial registration, licensing, and business setup services.",
      ar: "تأسيس الشركات والسجل التجاري والتراخيص وخدمات تأسيس الأعمال.",
    },
    industry: { en: "Business Services", ar: "خدمات الأعمال" },
    slug: { en: "company-registration-formation", ar: "company-formation" },
    accent: "#0E7490",
    soft: "#CFFAFE",
    order: 42,
    children: [
      { key: "company-formation-setup", name: { en: "Company Formation", ar: "تأسيس الشركة" }, slug: { en: "company-formation", ar: "formation" } },
      { key: "commercial-registration", name: { en: "Commercial Registration (CR)", ar: "السجل التجاري" }, slug: { en: "commercial-registration", ar: "cr" } },
      { key: "business-licensing", name: { en: "Business Licensing", ar: "التراخيص التجارية" }, slug: { en: "business-licensing", ar: "licensing" } },
      { key: "foreign-investment", name: { en: "Foreign Investment Setup", ar: "تأسيس الاستثمار الأجنبي" }, slug: { en: "foreign-investment-setup", ar: "foreign-investment" } },
      { key: "branch-office", name: { en: "Branch & Representative Office", ar: "فرع ومكتب تمثيل" }, slug: { en: "branch-representative-office", ar: "branch-office" } },
      { key: "company-formation-others", name: { en: "Others (Company Setup)", ar: "أخرى (تأسيس شركات)" }, slug: { en: "company-setup-others", ar: "company-others" } },
    ],
  },
  {
    key: "legal-services",
    name: { en: "Legal Services", ar: "الخدمات القانونية" },
    description: {
      en: "Corporate legal counsel, contracts, IP, compliance, and dispute support.",
      ar: "الاستشارات القانونية للشركات والعقود والملكية الفكرية والامتثال والنزاعات.",
    },
    industry: { en: "Business Services", ar: "خدمات الأعمال" },
    slug: { en: "legal-services", ar: "legal" },
    accent: "#1E3A8A",
    soft: "#DBEAFE",
    order: 43,
    children: [
      { key: "corporate-legal", name: { en: "Corporate Legal", ar: "قانون الشركات" }, slug: { en: "corporate-legal", ar: "corporate-legal" } },
      { key: "contracts", name: { en: "Contracts & Agreements", ar: "العقود والاتفاقيات" }, slug: { en: "contracts-agreements", ar: "contracts" } },
      { key: "intellectual-property", name: { en: "Intellectual Property", ar: "الملكية الفكرية" }, slug: { en: "intellectual-property", ar: "ip" } },
      { key: "compliance-regulatory", name: { en: "Compliance & Regulatory", ar: "الامتثال والتنظيم" }, slug: { en: "compliance-regulatory", ar: "compliance" } },
      { key: "dispute-resolution", name: { en: "Dispute Resolution", ar: "حل النزاعات" }, slug: { en: "dispute-resolution", ar: "disputes" } },
      { key: "legal-others", name: { en: "Others (Legal)", ar: "أخرى (قانونية)" }, slug: { en: "legal-others", ar: "legal-others" } },
    ],
  },
  {
    key: "visa-services",
    name: { en: "Visa Services", ar: "خدمات التأشيرات" },
    description: {
      en: "Work visas, visit visas, iqama, residency, and immigration support services.",
      ar: "تأشيرات العمل والزيارة والإقامة ونقل الكفالة وخدمات الهجرة.",
    },
    industry: { en: "Business Services", ar: "خدمات الأعمال" },
    slug: { en: "visa-services", ar: "visa" },
    accent: "#7C2D12",
    soft: "#FFEDD5",
    order: 44,
    children: [
      { key: "work-visas", name: { en: "Work Visas", ar: "تأشيرات العمل" }, slug: { en: "work-visas", ar: "work-visas" } },
      { key: "business-visit-visas", name: { en: "Business Visit Visas", ar: "تأشيرات زيارة عمل" }, slug: { en: "business-visit-visas", ar: "visit-visas" } },
      { key: "family-visas", name: { en: "Family Visas", ar: "تأشيرات عائلية" }, slug: { en: "family-visas", ar: "family-visas" } },
      { key: "iqama-residency", name: { en: "Iqama & Residency", ar: "الإقامة والهوية" }, slug: { en: "iqama-residency", ar: "iqama" } },
      { key: "visa-transfer", name: { en: "Visa Transfer / Sponsorship", ar: "نقل الكفالة" }, slug: { en: "visa-transfer", ar: "visa-transfer" } },
      { key: "visa-others", name: { en: "Others (Visa)", ar: "أخرى (تأشيرات)" }, slug: { en: "visa-others", ar: "visa-others" } },
    ],
  },
  {
    key: "accounting-finance",
    name: { en: "Accounting & Finance", ar: "المحاسبة والمالية" },
    description: {
      en: "Bookkeeping, VAT, auditing, payroll, and financial advisory services.",
      ar: "المحاسبة وضريبة القيمة المضافة والتدقيق والرواتب والاستشارات المالية.",
    },
    industry: { en: "Business Services", ar: "خدمات الأعمال" },
    slug: { en: "accounting-finance", ar: "accounting" },
    accent: "#166534",
    soft: "#DCFCE7",
    order: 45,
    children: [
      { key: "bookkeeping", name: { en: "Bookkeeping", ar: "مسك الدفاتر" }, slug: { en: "bookkeeping", ar: "bookkeeping" } },
      { key: "vat-tax", name: { en: "VAT & Tax", ar: "ضريبة القيمة المضافة والضرائب" }, slug: { en: "vat-tax", ar: "vat-tax" } },
      { key: "audit", name: { en: "Audit Services", ar: "خدمات التدقيق" }, slug: { en: "audit-services", ar: "audit" } },
      { key: "payroll", name: { en: "Payroll Services", ar: "خدمات الرواتب" }, slug: { en: "payroll-services", ar: "payroll" } },
      { key: "accounting-others", name: { en: "Others (Accounting)", ar: "أخرى (محاسبة)" }, slug: { en: "accounting-others", ar: "accounting-others" } },
    ],
  },
  {
    key: "hr-recruitment",
    name: { en: "HR & Recruitment", ar: "الموارد البشرية والتوظيف" },
    description: {
      en: "Talent acquisition, HR outsourcing, payroll support, and workforce services.",
      ar: "استقطاب المواهب وتعهيد الموارد البشرية ودعم الرواتب وخدمات القوى العاملة.",
    },
    industry: { en: "Business Services", ar: "خدمات الأعمال" },
    slug: { en: "hr-recruitment", ar: "hr" },
    accent: "#9D174D",
    soft: "#FCE7F3",
    order: 46,
    children: [
      { key: "recruitment", name: { en: "Recruitment", ar: "التوظيف" }, slug: { en: "recruitment", ar: "recruitment" } },
      { key: "hr-outsourcing", name: { en: "HR Outsourcing", ar: "تعهيد الموارد البشرية" }, slug: { en: "hr-outsourcing", ar: "hr-outsourcing" } },
      { key: "workforce-services", name: { en: "Workforce Services", ar: "خدمات القوى العاملة" }, slug: { en: "workforce-services", ar: "workforce" } },
      { key: "hr-others", name: { en: "Others (HR)", ar: "أخرى (موارد بشرية)" }, slug: { en: "hr-others", ar: "hr-others" } },
    ],
  },
  {
    key: "translation-services",
    name: { en: "Translation & Localization", ar: "الترجمة والتوطين" },
    description: {
      en: "Document translation, certified translation, and Arabic/English localization.",
      ar: "ترجمة المستندات والترجمة المعتمدة وتوطين المحتوى بالعربية والإنجليزية.",
    },
    industry: { en: "Business Services", ar: "خدمات الأعمال" },
    slug: { en: "translation-localization", ar: "translation" },
    accent: "#6D28D9",
    soft: "#EDE9FE",
    order: 47,
    children: [
      { key: "certified-translation", name: { en: "Certified Translation", ar: "ترجمة معتمدة" }, slug: { en: "certified-translation", ar: "certified" } },
      { key: "business-translation", name: { en: "Business Translation", ar: "ترجمة أعمال" }, slug: { en: "business-translation", ar: "business-translation" } },
      { key: "localization", name: { en: "Localization", ar: "التوطين" }, slug: { en: "localization", ar: "localization" } },
      { key: "translation-others", name: { en: "Others (Translation)", ar: "أخرى (ترجمة)" }, slug: { en: "translation-others", ar: "translation-others" } },
    ],
  },
  {
    key: "professional-services",
    name: { en: "Professional & Consulting", ar: "الخدمات المهنية والاستشارات" },
    description: {
      en: "Business consulting, strategy, training, and general professional support.",
      ar: "استشارات الأعمال والاستراتيجية والتدريب والدعم المهني العام.",
    },
    industry: { en: "Services", ar: "الخدمات" },
    slug: { en: "professional-services", ar: "professional" },
    accent: "#0F172A",
    soft: "#F1F5F9",
    order: 48,
    children: [
      { key: "business-consulting", name: { en: "Business Consulting", ar: "استشارات الأعمال" }, slug: { en: "business-consulting", ar: "consulting" } },
      { key: "strategy-advisory", name: { en: "Strategy & Advisory", ar: "الاستراتيجية والاستشارات" }, slug: { en: "strategy-advisory", ar: "strategy" } },
      { key: "corporate-training", name: { en: "Corporate Training", ar: "التدريب المؤسسي" }, slug: { en: "corporate-training", ar: "training" } },
      { key: "professional-others", name: { en: "Others (Professional)", ar: "أخرى (مهنية)" }, slug: { en: "professional-others", ar: "professional-others" } },
    ],
  },
  {
    key: "others",
    name: { en: "Others", ar: "أخرى" },
    description: {
      en: "Products and services that do not fit the listed categories. Use this when nothing else matches.",
      ar: "منتجات وخدمات لا تندرج تحت التصنيفات المدرجة. استخدم هذا الخيار إذا لم تجد تصنيفاً مناسباً.",
    },
    industry: { en: "General", ar: "عام" },
    slug: { en: "others", ar: "others" },
    accent: "#64748B",
    soft: "#F1F5F9",
    order: 99,
    children: [
      { key: "others-general", name: { en: "General / Uncategorized", ar: "عام / غير مصنّف" }, slug: { en: "general-uncategorized", ar: "others-general" } },
      { key: "others-custom", name: { en: "Custom Request", ar: "طلب مخصص" }, slug: { en: "custom-request", ar: "others-custom" } },
    ],
  },
];

export function getCategoryByKey(key: string) {
  return MARKETPLACE_CATEGORIES.find((c) => c.key === key);
}

export function getCategoryBySlug(slug: string) {
  return MARKETPLACE_CATEGORIES.find((c) => c.slug.en === slug || c.slug.ar === slug);
}

/** Curated industry segments used to organize the Categories page. */
export type CategorySegment = {
  id: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  /** Matches `MarketplaceCategory.industry.en` values belonging to this segment. */
  industryKeys: string[];
};

export const CATEGORY_SEGMENTS: CategorySegment[] = [
  {
    id: "construction",
    name: { en: "Construction & Safety", ar: "الإنشاءات والسلامة" },
    description: {
      en: "Site works, building materials, fixtures, and protective equipment.",
      ar: "أعمال المواقع ومواد البناء والتجهيزات ومعدات الحماية.",
    },
    industryKeys: ["Construction", "Safety & PPE"],
  },
  {
    id: "industrial",
    name: { en: "Industrial & Energy", ar: "الصناعة والطاقة" },
    description: {
      en: "Machinery, electronics, chemicals, oil & gas, renewables, and automotive.",
      ar: "الآلات والإلكترونيات والكيماويات والنفط والغاز والطاقة المتجددة والسيارات.",
    },
    industryKeys: ["Industrial", "Energy", "Automotive"],
  },
  {
    id: "fmcg-hospitality",
    name: { en: "Food, FMCG & Hospitality", ar: "الأغذية والضيافة" },
    description: {
      en: "Consumer goods, foodservice, beauty, and hotel & catering supplies.",
      ar: "السلع الاستهلاكية والأغذية والتجميل ومستلزمات الفنادق والتموين.",
    },
    industryKeys: ["FMCG", "Hospitality"],
  },
  {
    id: "healthcare",
    name: { en: "Healthcare", ar: "الرعاية الصحية" },
    description: {
      en: "Medical equipment, pharmaceuticals, and laboratory supplies.",
      ar: "المعدات الطبية والأدوية ومستلزمات المختبرات.",
    },
    industryKeys: ["Healthcare"],
  },
  {
    id: "technology",
    name: { en: "Technology & Security", ar: "التقنية والأمن" },
    description: {
      en: "IT services, telecom, networking, and security systems.",
      ar: "خدمات تقنية المعلومات والاتصالات والشبكات وأنظمة الأمن.",
    },
    industryKeys: ["Technology & Services"],
  },
  {
    id: "apparel",
    name: { en: "Apparel & Textiles", ar: "الملابس والمنسوجات" },
    description: {
      en: "Fabrics, uniforms, and textile procurement for business use.",
      ar: "الأقمشة والزي الموحّد والمنسوجات للاستخدام التجاري.",
    },
    industryKeys: ["Apparel & Textiles"],
  },
  {
    id: "logistics-agri",
    name: { en: "Logistics & Agriculture", ar: "اللوجستيات والزراعة" },
    description: {
      en: "Warehousing, freight, farming, and agribusiness supplies.",
      ar: "التخزين والشحن والزراعة ومستلزمات الأعمال الزراعية.",
    },
    industryKeys: ["Logistics", "Agriculture"],
  },
  {
    id: "business-supplies",
    name: { en: "Office & Business Supplies", ar: "مستلزمات المكاتب والأعمال" },
    description: {
      en: "Stationery, furniture, printing, appliances, and workplace fit-out.",
      ar: "القرطاسية والأثاث والطباعة والأجهزة وتجهيز أماكن العمل.",
    },
    industryKeys: ["Business Supplies"],
  },
  {
    id: "facility-services",
    name: { en: "Facility & Professional Services", ar: "خدمات المرافق والمهنية" },
    description: {
      en: "Cleaning, facility management, waste, training, and consulting.",
      ar: "النظافة وإدارة المرافق والنفايات والتدريب والاستشارات.",
    },
    industryKeys: ["Services"],
  },
  {
    id: "company-services",
    name: { en: "Company & Legal Services", ar: "خدمات الشركات والقانونية" },
    description: {
      en: "Formation, visas, HR, accounting, legal, and localization support.",
      ar: "تأسيس الشركات والتأشيرات والموارد البشرية والمحاسبة والدعم القانوني.",
    },
    industryKeys: ["Business Services"],
  },
  {
    id: "other",
    name: { en: "Other", ar: "أخرى" },
    description: {
      en: "Requests that don’t fit a listed industry — our team can still help.",
      ar: "طلبات لا تنتمي لقطاع مدرج — وفريقنا جاهز للمساعدة.",
    },
    industryKeys: ["General"],
  },
];

export function getCategoriesBySegment() {
  const used = new Set<string>();
  const grouped = CATEGORY_SEGMENTS.map((segment) => {
    const industrySet = new Set(segment.industryKeys);
    const categories = MARKETPLACE_CATEGORIES.filter((c) => industrySet.has(c.industry.en)).sort(
      (a, b) => a.order - b.order
    );
    categories.forEach((c) => used.add(c.key));
    return { segment, categories };
  }).filter((g) => g.categories.length > 0);

  const leftover = MARKETPLACE_CATEGORIES.filter((c) => !used.has(c.key));
  if (leftover.length > 0) {
    grouped.push({
      segment: {
        id: "more",
        name: { en: "More categories", ar: "تصنيفات إضافية" },
        description: {
          en: "Additional marketplace categories.",
          ar: "تصنيفات إضافية في السوق.",
        },
        industryKeys: [],
      },
      categories: leftover.sort((a, b) => a.order - b.order),
    });
  }

  return grouped;
}

export function getSegmentForCategory(categoryKey: string) {
  const cat = getCategoryByKey(categoryKey);
  if (!cat) return null;
  return CATEGORY_SEGMENTS.find((s) => s.industryKeys.includes(cat.industry.en)) || null;
}
