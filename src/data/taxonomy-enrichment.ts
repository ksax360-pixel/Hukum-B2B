/**
 * Deepens taxonomy beyond Category → Subcategory for buyer-intent discovery.
 * Merged at sync time; does not replace existing marketplace-categories keys.
 */

export type TaxonomyNode = {
  key: string;
  name: { en: string; ar: string };
  slug: { en: string; ar: string };
  description?: { en: string; ar: string };
  synonyms?: { en: string[]; ar: string[] };
  children?: TaxonomyNode[];
};

/** Product-type / L3–L4 enrichment keyed by existing subcategory or category key */
export const TAXONOMY_ENRICHMENT: Record<string, TaxonomyNode[]> = {
  cement: [
    {
      key: "ready-mix-concrete",
      name: { en: "Ready Mix Concrete", ar: "خرسانة جاهزة" },
      slug: { en: "ready-mix-concrete", ar: "ready-mix" },
      synonyms: { en: ["RMC", "ready-mix"], ar: ["خرسانة جاهزة"] },
      children: [
        {
          key: "rmc-c25",
          name: { en: "Grade C25", ar: "درجة C25" },
          slug: { en: "grade-c25", ar: "c25" },
        },
        {
          key: "rmc-c30",
          name: { en: "Grade C30", ar: "درجة C30" },
          slug: { en: "grade-c30", ar: "c30" },
        },
        {
          key: "rmc-c40",
          name: { en: "Grade C40", ar: "درجة C40" },
          slug: { en: "grade-c40", ar: "c40" },
        },
      ],
    },
    {
      key: "portland-cement",
      name: { en: "Portland Cement", ar: "أسمنت بورتلاند" },
      slug: { en: "portland-cement", ar: "portland" },
      synonyms: { en: ["OPC", "ordinary portland"], ar: ["أسمنت بورتلاند"] },
    },
    {
      key: "white-cement",
      name: { en: "White Cement", ar: "أسمنت أبيض" },
      slug: { en: "white-cement", ar: "white-cement" },
    },
  ],
  steel: [
    {
      key: "rebar",
      name: { en: "Reinforcing Bar (Rebar)", ar: "حديد التسليح" },
      slug: { en: "rebar", ar: "rebar" },
      synonyms: { en: ["reinforcement steel", "deformed bar"], ar: ["حديد تسليح"] },
    },
    {
      key: "structural-steel",
      name: { en: "Structural Steel", ar: "صلب إنشائي" },
      slug: { en: "structural-steel", ar: "structural-steel" },
    },
    {
      key: "steel-mesh",
      name: { en: "Steel Mesh / Wire", ar: "شبك وأسلاك حديدية" },
      slug: { en: "steel-mesh-wire", ar: "steel-mesh" },
    },
  ],
  "safety-helmets": [
    {
      key: "industrial-hard-hats",
      name: { en: "Industrial Hard Hats", ar: "خوذ صناعية" },
      slug: { en: "industrial-hard-hats", ar: "hard-hats" },
      synonyms: { en: ["hard hat", "safety helmet"], ar: ["خوذة سلامة"] },
    },
    {
      key: "ventilated-helmets",
      name: { en: "Ventilated Helmets", ar: "خوذ بتهوية" },
      slug: { en: "ventilated-helmets", ar: "ventilated" },
    },
  ],
  "safety-gloves": [
    {
      key: "cut-resistant-gloves",
      name: { en: "Cut-Resistant Gloves", ar: "قفازات مقاومة للقطع" },
      slug: { en: "cut-resistant-gloves", ar: "cut-resistant" },
    },
    {
      key: "chemical-resistant-gloves",
      name: { en: "Chemical-Resistant Gloves", ar: "قفازات مقاومة للكيماويات" },
      slug: { en: "chemical-resistant-gloves", ar: "chemical-gloves" },
    },
    {
      key: "heat-resistant-gloves",
      name: { en: "Heat-Resistant Gloves", ar: "قفازات مقاومة للحرارة" },
      slug: { en: "heat-resistant-gloves", ar: "heat-gloves" },
    },
  ],
  electrical: [
    {
      key: "cables-wiring",
      name: { en: "Cables & Wiring", ar: "الكابلات والأسلاك" },
      slug: { en: "cables-wiring", ar: "cables" },
      synonyms: { en: ["power cable", "electrical wire"], ar: ["كابل كهربائي"] },
    },
    {
      key: "switchgear",
      name: { en: "Switchgear & Panels", ar: "لوحات التوزيع والمفاتيح" },
      slug: { en: "switchgear-panels", ar: "switchgear" },
    },
    {
      key: "motors-drives",
      name: { en: "Motors & Drives", ar: "المحركات والمحولات" },
      slug: { en: "motors-drives", ar: "motors" },
      synonyms: { en: ["AC motor", "electric motor", "VFD"], ar: ["محرك كهربائي"] },
    },
    {
      key: "sensors-controls",
      name: { en: "Sensors & Controls", ar: "الحساسات وأنظمة التحكم" },
      slug: { en: "sensors-controls", ar: "sensors" },
    },
    {
      key: "generators",
      name: { en: "Generators", ar: "المولدات" },
      slug: { en: "generators", ar: "generators" },
      synonyms: { en: ["diesel generator", "genset"], ar: ["مولد كهرباء"] },
      children: [
        {
          key: "diesel-generators",
          name: { en: "Diesel Generators", ar: "مولدات ديزل" },
          slug: { en: "diesel-generators", ar: "diesel-gen" },
        },
        {
          key: "gas-generators",
          name: { en: "Gas Generators", ar: "مولدات غاز" },
          slug: { en: "gas-generators", ar: "gas-gen" },
        },
      ],
    },
  ],
  "industrial-machinery": [
    {
      key: "cnc-machines",
      name: { en: "CNC Machines", ar: "آلات CNC" },
      slug: { en: "cnc-machines", ar: "cnc" },
    },
    {
      key: "packaging-machines",
      name: { en: "Packaging Machines", ar: "آلات التعبئة" },
      slug: { en: "packaging-machines", ar: "packaging-machines" },
    },
    {
      key: "conveyors",
      name: { en: "Conveyors & Material Handling", ar: "سيور ناقلة ومناولة" },
      slug: { en: "conveyors-material-handling", ar: "conveyors" },
    },
    {
      key: "compressors",
      name: { en: "Air Compressors", ar: "ضواغط هواء" },
      slug: { en: "air-compressors", ar: "compressors" },
    },
  ],
  "oil-gas": [
    {
      key: "valves",
      name: { en: "Industrial Valves", ar: "صمامات صناعية" },
      slug: { en: "industrial-valves", ar: "valves" },
    },
    {
      key: "pipes-flanges",
      name: { en: "Pipes & Flanges", ar: "أنابيب وفلنجات" },
      slug: { en: "pipes-flanges", ar: "pipes-flanges" },
    },
    {
      key: "centrifugal-pumps",
      name: { en: "Centrifugal Pumps", ar: "مضخات طرد مركزي" },
      slug: { en: "centrifugal-pumps", ar: "centrifugal-pumps" },
      synonyms: { en: ["industrial pump", "water pump"], ar: ["مضخة صناعية"] },
    },
    {
      key: "submersible-pumps",
      name: { en: "Submersible Pumps", ar: "مضخات غاطسة" },
      slug: { en: "submersible-pumps", ar: "submersible" },
    },
  ],
  "water-treatment": [
    {
      key: "ro-plants",
      name: { en: "RO Plants", ar: "محطات تناضح عكسي" },
      slug: { en: "ro-plants", ar: "ro" },
    },
    {
      key: "filtration-systems",
      name: { en: "Filtration Systems", ar: "أنظمة ترشيح" },
      slug: { en: "filtration-systems", ar: "filtration" },
    },
    {
      key: "water-pumps",
      name: { en: "Water Pumps", ar: "مضخات مياه" },
      slug: { en: "water-pumps", ar: "water-pumps" },
    },
  ],
  textiles: [
    {
      key: "woven-fabrics",
      name: { en: "Woven Fabrics", ar: "أقمشة منسوجة" },
      slug: { en: "woven-fabrics", ar: "woven" },
    },
    {
      key: "knit-fabrics",
      name: { en: "Knit Fabrics", ar: "أقمشة تريكو" },
      slug: { en: "knit-fabrics", ar: "knit" },
    },
    {
      key: "technical-textiles",
      name: { en: "Technical Textiles", ar: "منسوجات تقنية" },
      slug: { en: "technical-textiles", ar: "technical-textiles" },
    },
    {
      key: "yarns",
      name: { en: "Yarns", ar: "خيوط" },
      slug: { en: "yarns", ar: "yarns" },
    },
  ],
  "medical-equipment": [
    {
      key: "patient-monitors",
      name: { en: "Patient Monitors", ar: "أجهزة مراقبة المرضى" },
      slug: { en: "patient-monitors", ar: "monitors" },
    },
    {
      key: "imaging-equipment",
      name: { en: "Imaging Equipment", ar: "أجهزة التصوير" },
      slug: { en: "imaging-equipment", ar: "imaging" },
    },
    {
      key: "surgical-instruments",
      name: { en: "Surgical Instruments", ar: "أدوات جراحية" },
      slug: { en: "surgical-instruments", ar: "surgical" },
    },
  ],
  hvac: [
    {
      key: "split-ac",
      name: { en: "Split AC Units", ar: "مكيفات سبليت" },
      slug: { en: "split-ac", ar: "split-ac" },
    },
    {
      key: "chillers",
      name: { en: "Chillers", ar: "مبردات" },
      slug: { en: "chillers", ar: "chillers" },
    },
    {
      key: "ventilation",
      name: { en: "Ventilation Systems", ar: "أنظمة تهوية" },
      slug: { en: "ventilation-systems", ar: "ventilation" },
    },
    {
      key: "cold-storage",
      name: { en: "Cold Storage", ar: "تخزين بارد" },
      slug: { en: "cold-storage", ar: "cold-storage" },
    },
  ],
  scaffolding: [
    {
      key: "cuplock-scaffolding",
      name: { en: "Cuplock Scaffolding", ar: "سقالات كوبلوك" },
      slug: { en: "cuplock-scaffolding", ar: "cuplock" },
    },
    {
      key: "frame-scaffolding",
      name: { en: "Frame Scaffolding", ar: "سقالات إطارية" },
      slug: { en: "frame-scaffolding", ar: "frame" },
    },
  ],
  "renewable-energy": [
    {
      key: "solar-panels",
      name: { en: "Solar Panels", ar: "ألواح شمسية" },
      slug: { en: "solar-panels", ar: "solar-panels" },
    },
    {
      key: "inverters",
      name: { en: "Inverters", ar: "عاكسات" },
      slug: { en: "inverters", ar: "inverters" },
    },
    {
      key: "battery-storage",
      name: { en: "Battery Storage", ar: "تخزين بطاريات" },
      slug: { en: "battery-storage", ar: "storage" },
    },
  ],
  logistics: [
    {
      key: "freight-forwarding",
      name: { en: "Freight Forwarding", ar: "شحن دولي" },
      slug: { en: "freight-forwarding", ar: "freight" },
    },
    {
      key: "warehousing-3pl",
      name: { en: "Warehousing & 3PL", ar: "تخزين وخدمات لوجستية" },
      slug: { en: "warehousing-3pl", ar: "3pl" },
    },
    {
      key: "racking-systems",
      name: { en: "Racking Systems", ar: "أنظمة أرفف" },
      slug: { en: "racking-systems", ar: "racking" },
    },
    {
      key: "material-handling",
      name: { en: "Material Handling Equipment", ar: "معدات مناولة المواد" },
      slug: { en: "material-handling", ar: "material-handling" },
    },
  ],
};

/** Synonyms for top-level marketplace categories (catalogKey) */
export const CATEGORY_SYNONYMS: Record<string, { en: string[]; ar: string[] }> = {
  "safety-equipment": {
    en: ["PPE", "personal protective equipment", "safety gear", "workplace safety"],
    ar: ["معدات الحماية الشخصية", "معدات السلامة", "PPE"],
  },
  electrical: {
    en: ["electrical equipment", "power distribution", "electronics wholesale"],
    ar: ["معدات كهربائية", "توزيع الطاقة"],
  },
  "building-materials": {
    en: ["construction materials", "building supplies"],
    ar: ["مواد بناء", "مستلزمات البناء"],
  },
  "industrial-machinery": {
    en: ["plant equipment", "production machinery", "factory machines"],
    ar: ["آلات مصانع", "معدات إنتاج"],
  },
  "oil-gas": {
    en: ["oilfield supplies", "upstream equipment", "O&G"],
    ar: ["معدات نفط وغاز", "مستلزمات حقول النفط"],
  },
  fmcg: {
    en: ["fast moving consumer goods", "consumer wholesale"],
    ar: ["سلع استهلاكية", "جملة استهلاكية"],
  },
};

/**
 * Categories that currently lack children in marketplace-categories —
 * add first-level subcategories here (keyed by parent catalog key).
 */
export const MISSING_SUBCATEGORY_BACKFILL: Record<string, TaxonomyNode[]> = {
  "food-beverage": [
    { key: "dairy", name: { en: "Dairy", ar: "ألبان" }, slug: { en: "dairy", ar: "dairy" } },
    { key: "meat-poultry", name: { en: "Meat & Poultry", ar: "لحوم ودواجن" }, slug: { en: "meat-poultry", ar: "meat" } },
    { key: "dry-goods", name: { en: "Dry Goods & Staples", ar: "مواد جافة وأساسية" }, slug: { en: "dry-goods", ar: "dry-goods" } },
    { key: "horeca-supplies", name: { en: "HORECA Supplies", ar: "مستلزمات الضيافة" }, slug: { en: "horeca-supplies", ar: "horeca" } },
    { key: "cold-chain", name: { en: "Cold Chain Products", ar: "منتجات سلسلة التبريد" }, slug: { en: "cold-chain", ar: "cold-chain" } },
  ],
  pharmaceuticals: [
    { key: "otc", name: { en: "OTC Medicines", ar: "أدوية بدون وصفة" }, slug: { en: "otc-medicines", ar: "otc" } },
    { key: "rx-wholesale", name: { en: "Prescription Wholesale", ar: "أدوية بوصفة بالجملة" }, slug: { en: "prescription-wholesale", ar: "rx" } },
    { key: "pharma-consumables", name: { en: "Pharma Consumables", ar: "مستهلكات دوائية" }, slug: { en: "pharma-consumables", ar: "pharma-consumables" } },
  ],
  "lab-scientific": [
    { key: "lab-instruments", name: { en: "Lab Instruments", ar: "أجهزة مختبر" }, slug: { en: "lab-instruments", ar: "instruments" } },
    { key: "reagents", name: { en: "Reagents", ar: "كواشف" }, slug: { en: "reagents", ar: "reagents" } },
    { key: "lab-glassware", name: { en: "Glassware & Consumables", ar: "زجاجيات ومستلزمات" }, slug: { en: "lab-glassware", ar: "glassware" } },
  ],
  textiles: TAXONOMY_ENRICHMENT.textiles,
  telecom: [
    { key: "networking-gear", name: { en: "Networking Gear", ar: "معدات شبكات" }, slug: { en: "networking-gear", ar: "networking" } },
    { key: "structured-cabling", name: { en: "Structured Cabling", ar: "كابلات منظمة" }, slug: { en: "structured-cabling", ar: "cabling" } },
    { key: "telecom-infra", name: { en: "Telecom Infrastructure", ar: "بنية اتصالات" }, slug: { en: "telecom-infrastructure", ar: "telecom-infra" } },
  ],
  electrical: TAXONOMY_ENRICHMENT.electrical,
  "industrial-machinery": TAXONOMY_ENRICHMENT["industrial-machinery"],
  hvac: TAXONOMY_ENRICHMENT.hvac,
  "oil-gas": TAXONOMY_ENRICHMENT["oil-gas"],
  "renewable-energy": TAXONOMY_ENRICHMENT["renewable-energy"],
  automotive: [
    { key: "engine-parts", name: { en: "Engine Parts", ar: "قطع محرك" }, slug: { en: "engine-parts", ar: "engine" } },
    { key: "braking-systems", name: { en: "Braking Systems", ar: "أنظمة فرامل" }, slug: { en: "braking-systems", ar: "brakes" } },
    { key: "filters-fluids", name: { en: "Filters & Fluids", ar: "فلاتر وسوائل" }, slug: { en: "filters-fluids", ar: "filters" } },
    { key: "workshop-tools", name: { en: "Workshop Tools", ar: "أدوات ورش" }, slug: { en: "workshop-tools", ar: "workshop" } },
  ],
  "furniture-fitout": [
    { key: "office-furniture", name: { en: "Office Furniture", ar: "أثاث مكتبي" }, slug: { en: "office-furniture", ar: "office-furniture" } },
    { key: "retail-fitout", name: { en: "Retail Fit-out", ar: "تجهيز محلات" }, slug: { en: "retail-fitout", ar: "retail-fitout" } },
    { key: "joinery", name: { en: "Joinery", ar: "نجارة" }, slug: { en: "joinery", ar: "joinery" } },
  ],
  lighting: [
    { key: "led-lighting", name: { en: "LED Lighting", ar: "إضاءة LED" }, slug: { en: "led-lighting", ar: "led" } },
    { key: "outdoor-lighting", name: { en: "Outdoor Lighting", ar: "إضاءة خارجية" }, slug: { en: "outdoor-lighting", ar: "outdoor" } },
    { key: "industrial-lighting", name: { en: "Industrial Lighting", ar: "إضاءة صناعية" }, slug: { en: "industrial-lighting", ar: "industrial-lighting" } },
  ],
  plumbing: [
    { key: "pipes-fittings", name: { en: "Pipes & Fittings", ar: "أنابيب وتوصيلات" }, slug: { en: "pipes-fittings", ar: "pipes-fittings" } },
    { key: "sanitary-ware", name: { en: "Sanitary Ware", ar: "أدوات صحية" }, slug: { en: "sanitary-ware", ar: "sanitary" } },
    { key: "plumbing-pumps", name: { en: "Plumbing Pumps", ar: "مضخات سباكة" }, slug: { en: "plumbing-pumps", ar: "plumbing-pumps" } },
  ],
  "tools-hardware": [
    { key: "hand-tools", name: { en: "Hand Tools", ar: "أدوات يدوية" }, slug: { en: "hand-tools", ar: "hand-tools" } },
    { key: "power-tools", name: { en: "Power Tools", ar: "أدوات كهربائية" }, slug: { en: "power-tools", ar: "power-tools" } },
    { key: "fasteners", name: { en: "Fasteners", ar: "مثبتات" }, slug: { en: "fasteners", ar: "fasteners" } },
  ],
  agriculture: [
    { key: "irrigation-systems", name: { en: "Irrigation Systems", ar: "أنظمة ري" }, slug: { en: "irrigation-systems", ar: "irrigation" } },
    { key: "fertilizers", name: { en: "Fertilizers", ar: "أسمدة" }, slug: { en: "fertilizers", ar: "fertilizers" } },
    { key: "greenhouse-supplies", name: { en: "Greenhouse Supplies", ar: "مستلزمات بيوت محمية" }, slug: { en: "greenhouse-supplies", ar: "greenhouse" } },
    { key: "agri-machinery", name: { en: "Agri Machinery", ar: "آلات زراعية" }, slug: { en: "agri-machinery", ar: "agri-machinery" } },
  ],
  logistics: TAXONOMY_ENRICHMENT.logistics,
  "facility-management": [
    { key: "fm-maintenance", name: { en: "Maintenance Contracts", ar: "عقود صيانة" }, slug: { en: "maintenance-contracts", ar: "maintenance" } },
    { key: "building-ops", name: { en: "Building Operations", ar: "تشغيل المباني" }, slug: { en: "building-operations", ar: "building-ops" } },
  ],
  cleaning: [
    { key: "janitorial-supplies", name: { en: "Janitorial Supplies", ar: "مستلزمات نظافة" }, slug: { en: "janitorial-supplies", ar: "janitorial" } },
    { key: "hygiene-chemicals", name: { en: "Hygiene Chemicals", ar: "كيماويات تعقيم" }, slug: { en: "hygiene-chemicals", ar: "hygiene" } },
    { key: "cleaning-machines", name: { en: "Cleaning Machines", ar: "آلات تنظيف" }, slug: { en: "cleaning-machines", ar: "cleaning-machines" } },
  ],
  chemicals: [
    { key: "industrial-chemicals", name: { en: "Industrial Chemicals", ar: "كيماويات صناعية" }, slug: { en: "industrial-chemicals", ar: "industrial-chem" } },
    { key: "solvents", name: { en: "Solvents", ar: "مذيبات" }, slug: { en: "solvents", ar: "solvents" } },
    { key: "resins", name: { en: "Resins", ar: "راتنجات" }, slug: { en: "resins", ar: "resins" } },
  ],
  plastics: [
    { key: "plastic-resins", name: { en: "Plastic Resins", ar: "راتنجات بلاستيكية" }, slug: { en: "plastic-resins", ar: "plastic-resins" } },
    { key: "films-sheets", name: { en: "Films & Sheets", ar: "أفلام وصفائح" }, slug: { en: "films-sheets", ar: "films" } },
    { key: "molded-parts", name: { en: "Molded Parts", ar: "أجزاء مصبوبة" }, slug: { en: "molded-parts", ar: "molded" } },
  ],
  "security-systems": [
    { key: "cctv", name: { en: "CCTV & Surveillance", ar: "كاميرات مراقبة" }, slug: { en: "cctv-surveillance", ar: "cctv" } },
    { key: "access-control", name: { en: "Access Control", ar: "التحكم بالدخول" }, slug: { en: "access-control", ar: "access" } },
    { key: "alarms", name: { en: "Alarm Systems", ar: "أنظمة إنذار" }, slug: { en: "alarm-systems", ar: "alarms" } },
  ],
  hospitality: [
    { key: "hotel-amenities", name: { en: "Hotel Amenities", ar: "مستلزمات فنادق" }, slug: { en: "hotel-amenities", ar: "amenities" } },
    { key: "kitchen-equipment", name: { en: "Commercial Kitchen Equipment", ar: "معدات مطابخ تجارية" }, slug: { en: "commercial-kitchen", ar: "kitchen" } },
    { key: "tableware", name: { en: "Tableware & Serviceware", ar: "أواني تقديم" }, slug: { en: "tableware", ar: "tableware" } },
  ],
  beauty: [
    { key: "salon-equipment", name: { en: "Salon Equipment", ar: "معدات صالونات" }, slug: { en: "salon-equipment", ar: "salon" } },
    { key: "skincare-wholesale", name: { en: "Skincare Wholesale", ar: "عناية بالبشرة بالجملة" }, slug: { en: "skincare-wholesale", ar: "skincare" } },
  ],
  education: [
    { key: "school-supplies", name: { en: "School Supplies", ar: "مستلزمات مدارس" }, slug: { en: "school-supplies", ar: "school" } },
    { key: "elearning", name: { en: "E-Learning", ar: "تعليمليم إلكتروني" }, slug: { en: "e-learning", ar: "elearning" } },
    { key: "training-kits", name: { en: "Training Kits", ar: "حقائب تدريب" }, slug: { en: "training-kits", ar: "training-kits" } },
  ],
  "water-treatment": TAXONOMY_ENRICHMENT["water-treatment"],
  "waste-management": [
    { key: "waste-bins", name: { en: "Waste Bins", ar: "حاويات نفايات" }, slug: { en: "waste-bins", ar: "bins" } },
    { key: "recycling", name: { en: "Recycling Solutions", ar: "حلول إعادة التدوير" }, slug: { en: "recycling", ar: "recycling" } },
    { key: "compactors", name: { en: "Compactors", ar: "ضواغط" }, slug: { en: "compactors", ar: "compactors" } },
  ],
  mining: [
    { key: "quarry-equipment", name: { en: "Quarry Equipment", ar: "معدات محاجر" }, slug: { en: "quarry-equipment", ar: "quarry" } },
    { key: "minerals-trading", name: { en: "Minerals Trading", ar: "تجارة معادن" }, slug: { en: "minerals-trading", ar: "minerals" } },
  ],
  "home-appliances": [
    { key: "white-goods", name: { en: "White Goods", ar: "أجهزة بيضاء" }, slug: { en: "white-goods", ar: "white-goods" } },
    { key: "small-appliances", name: { en: "Small Appliances", ar: "أجهزة صغيرة" }, slug: { en: "small-appliances", ar: "small-appliances" } },
    { key: "commercial-kitchen-appliances", name: { en: "Commercial Kitchen Appliances", ar: "أجهزة مطابخ تجارية" }, slug: { en: "commercial-kitchen-appliances", ar: "commercial-appliances" } },
  ],
};

export function getEnrichmentForKey(key: string): TaxonomyNode[] {
  return TAXONOMY_ENRICHMENT[key] || MISSING_SUBCATEGORY_BACKFILL[key] || [];
}
