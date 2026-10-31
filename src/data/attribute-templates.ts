/**
 * Category-family attribute templates — single source of truth for
 * attributes → filters → RFQ inheritance → PDP sections.
 * Keys are stable; names may change.
 */

export type AttrType =
  | "text"
  | "textarea"
  | "number"
  | "decimal"
  | "integer"
  | "boolean"
  | "dropdown"
  | "multi_select"
  | "radio"
  | "range"
  | "measurement"
  | "measurement_range"
  | "dimension"
  | "weight"
  | "currency"
  | "percentage"
  | "date"
  | "country"
  | "certification"
  | "file"
  | "url";

export type AttrGroup =
  | "general"
  | "technical"
  | "physical"
  | "performance"
  | "commercial"
  | "logistics"
  | "certification"
  | "packaging"
  | "warranty"
  | "compliance"
  | "regional"
  | "customization";

export type AttrRequirement = "mandatory" | "recommended" | "optional" | "conditional";

export type AttributeDef = {
  key: string;
  label: { en: string; ar: string };
  group: AttrGroup;
  type: AttrType;
  options?: { value: string; label: { en: string; ar: string } }[];
  unit?: string;
  unitSystem?: "metric" | "imperial" | "both" | "none";
  allowedUnits?: string[];
  requirement?: AttrRequirement;
  filterable?: boolean;
  searchable?: boolean;
  seoIndexable?: boolean;
  rfqInheritable?: boolean;
  multiValue?: boolean;
  validation?: { min?: number; max?: number; positive?: boolean };
};

export type AttributeTemplate = {
  key: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  /** Marketplace category keys this template applies to */
  categoryKeys: string[];
  attributes: AttributeDef[];
};

const commercialCore: AttributeDef[] = [
  {
    key: "moq",
    label: { en: "MOQ", ar: "الحد الأدنى للطلب" },
    group: "commercial",
    type: "number",
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
    validation: { positive: true },
  },
  {
    key: "lead_time",
    label: { en: "Lead Time", ar: "مدة التوريد" },
    group: "commercial",
    type: "text",
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "incoterms",
    label: { en: "Incoterms", ar: "شروط التجارة الدولية" },
    group: "logistics",
    type: "dropdown",
    options: [
      { value: "EXW", label: { en: "EXW", ar: "EXW" } },
      { value: "FOB", label: { en: "FOB", ar: "FOB" } },
      { value: "CIF", label: { en: "CIF", ar: "CIF" } },
      { value: "DDP", label: { en: "DDP", ar: "DDP" } },
      { value: "CFR", label: { en: "CFR", ar: "CFR" } },
    ],
    requirement: "optional",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "payment_terms",
    label: { en: "Payment Terms", ar: "شروط الدفع" },
    group: "commercial",
    type: "text",
    requirement: "optional",
    rfqInheritable: true,
  },
  {
    key: "brand",
    label: { en: "Brand", ar: "العلامة التجارية" },
    group: "general",
    type: "text",
    requirement: "recommended",
    filterable: true,
    searchable: true,
    seoIndexable: true,
  },
  {
    key: "model",
    label: { en: "Model", ar: "الطراز" },
    group: "general",
    type: "text",
    requirement: "optional",
    searchable: true,
    seoIndexable: true,
  },
  {
    key: "country_of_origin",
    label: { en: "Country of Origin", ar: "بلد المنشأ" },
    group: "regional",
    type: "country",
    requirement: "recommended",
    filterable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "warranty",
    label: { en: "Warranty", ar: "الضمان" },
    group: "warranty",
    type: "text",
    requirement: "optional",
    rfqInheritable: true,
  },
];

const electricalAttrs: AttributeDef[] = [
  {
    key: "voltage",
    label: { en: "Voltage", ar: "الجهد" },
    group: "technical",
    type: "measurement",
    unit: "V",
    allowedUnits: ["V", "kV"],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "current",
    label: { en: "Current", ar: "التيار" },
    group: "technical",
    type: "measurement",
    unit: "A",
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "power",
    label: { en: "Power", ar: "القدرة" },
    group: "performance",
    type: "measurement",
    unit: "kW",
    allowedUnits: ["W", "kW", "HP", "kVA"],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "frequency",
    label: { en: "Frequency", ar: "التردد" },
    group: "technical",
    type: "dropdown",
    options: [
      { value: "50Hz", label: { en: "50 Hz", ar: "50 هرتز" } },
      { value: "60Hz", label: { en: "60 Hz", ar: "60 هرتز" } },
      { value: "50/60Hz", label: { en: "50/60 Hz", ar: "50/60 هرتز" } },
    ],
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "phase",
    label: { en: "Phase", ar: "الطور" },
    group: "technical",
    type: "dropdown",
    options: [
      { value: "1", label: { en: "Single Phase", ar: "طور واحد" } },
      { value: "3", label: { en: "Three Phase", ar: "ثلاثي الأطوار" } },
    ],
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "ip_rating",
    label: { en: "IP Rating", ar: "درجة الحماية IP" },
    group: "technical",
    type: "dropdown",
    options: [
      { value: "IP20", label: { en: "IP20", ar: "IP20" } },
      { value: "IP44", label: { en: "IP44", ar: "IP44" } },
      { value: "IP54", label: { en: "IP54", ar: "IP54" } },
      { value: "IP65", label: { en: "IP65", ar: "IP65" } },
      { value: "IP67", label: { en: "IP67", ar: "IP67" } },
      { value: "IP68", label: { en: "IP68", ar: "IP68" } },
    ],
    requirement: "optional",
    filterable: true,
    seoIndexable: true,
  },
  {
    key: "material",
    label: { en: "Material", ar: "المادة" },
    group: "physical",
    type: "dropdown",
    options: [
      { value: "copper", label: { en: "Copper", ar: "نحاس" } },
      { value: "aluminum", label: { en: "Aluminum", ar: "ألومنيوم" } },
      { value: "steel", label: { en: "Steel", ar: "صلب" } },
      { value: "ss304", label: { en: "Stainless Steel 304", ar: "ستانلس ستيل 304" } },
      { value: "ss316", label: { en: "Stainless Steel 316", ar: "ستانلس ستيل 316" } },
      { value: "pvc", label: { en: "PVC", ar: "PVC" } },
      { value: "abs", label: { en: "ABS", ar: "ABS" } },
    ],
    requirement: "recommended",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "dimensions",
    label: { en: "Dimensions", ar: "الأبعاد" },
    group: "physical",
    type: "dimension",
    unit: "mm",
    requirement: "optional",
  },
  {
    key: "weight",
    label: { en: "Weight", ar: "الوزن" },
    group: "physical",
    type: "weight",
    unit: "kg",
    allowedUnits: ["g", "kg", "ton"],
    requirement: "optional",
    filterable: true,
  },
  {
    key: "mounting_type",
    label: { en: "Mounting Type", ar: "طريقة التركيب" },
    group: "technical",
    type: "dropdown",
    options: [
      { value: "wall", label: { en: "Wall", ar: "جداري" } },
      { value: "floor", label: { en: "Floor", ar: "أرضي" } },
      { value: "panel", label: { en: "Panel", ar: "لوحة" } },
      { value: "din_rail", label: { en: "DIN Rail", ar: "سكة DIN" } },
      { value: "portable", label: { en: "Portable", ar: "محمول" } },
    ],
    requirement: "optional",
    filterable: true,
  },
  {
    key: "application",
    label: { en: "Application", ar: "التطبيق" },
    group: "general",
    type: "multi_select",
    multiValue: true,
    requirement: "recommended",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "certification",
    label: { en: "Certification", ar: "الشهادة" },
    group: "certification",
    type: "multi_select",
    multiValue: true,
    options: [
      { value: "saso", label: { en: "SASO", ar: "ساسو" } },
      { value: "iec", label: { en: "IEC", ar: "IEC" } },
      { value: "ce", label: { en: "CE", ar: "CE" } },
      { value: "ul", label: { en: "UL", ar: "UL" } },
      { value: "iso", label: { en: "ISO", ar: "ISO" } },
    ],
    requirement: "recommended",
    filterable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  ...commercialCore,
];

const textileAttrs: AttributeDef[] = [
  {
    key: "fabric_type",
    label: { en: "Fabric Type", ar: "نوع القماش" },
    group: "technical",
    type: "dropdown",
    options: [
      { value: "cotton", label: { en: "Cotton", ar: "قطن" } },
      { value: "polyester", label: { en: "Polyester", ar: "بوليستر" } },
      { value: "blend", label: { en: "Blend", ar: "مزيج" } },
      { value: "nylon", label: { en: "Nylon", ar: "نايلون" } },
      { value: "wool", label: { en: "Wool", ar: "صوف" } },
      { value: "linen", label: { en: "Linen", ar: "كتان" } },
      { value: "technical", label: { en: "Technical Textile", ar: "نسيج تقني" } },
    ],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "fiber_composition",
    label: { en: "Fiber Composition", ar: "تركيب الألياف" },
    group: "technical",
    type: "text",
    requirement: "recommended",
    searchable: true,
    rfqInheritable: true,
  },
  {
    key: "gsm",
    label: { en: "GSM", ar: "الوزن بالجرام/م²" },
    group: "physical",
    type: "number",
    unit: "gsm",
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
    validation: { positive: true },
  },
  {
    key: "width",
    label: { en: "Width", ar: "العرض" },
    group: "physical",
    type: "measurement",
    unit: "cm",
    allowedUnits: ["cm", "m", "inch"],
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "weave",
    label: { en: "Weave", ar: "النسيج" },
    group: "technical",
    type: "dropdown",
    options: [
      { value: "plain", label: { en: "Plain", ar: "سادة" } },
      { value: "twill", label: { en: "Twill", ar: "مبرد" } },
      { value: "satin", label: { en: "Satin", ar: "ساتان" } },
      { value: "knit", label: { en: "Knit", ar: "تريكو" } },
    ],
    requirement: "optional",
    filterable: true,
  },
  {
    key: "color",
    label: { en: "Color", ar: "اللون" },
    group: "physical",
    type: "text",
    requirement: "recommended",
    filterable: true,
    searchable: true,
  },
  {
    key: "finish",
    label: { en: "Finish", ar: "التشطيب" },
    group: "technical",
    type: "text",
    requirement: "optional",
    filterable: true,
  },
  {
    key: "fr_rated",
    label: { en: "FR Rated", ar: "مقاوم للحريق" },
    group: "compliance",
    type: "boolean",
    requirement: "optional",
    filterable: true,
    seoIndexable: true,
  },
  {
    key: "customization",
    label: { en: "Customization", ar: "التخصيص" },
    group: "customization",
    type: "multi_select",
    multiValue: true,
    options: [
      { value: "oem", label: { en: "OEM", ar: "OEM" } },
      { value: "odm", label: { en: "ODM", ar: "ODM" } },
      { value: "private_label", label: { en: "Private Label", ar: "علامة خاصة" } },
      { value: "custom_color", label: { en: "Custom Color", ar: "لون مخصص" } },
      { value: "embroidery", label: { en: "Embroidery", ar: "تطريز" } },
    ],
    requirement: "optional",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "application",
    label: { en: "Application", ar: "التطبيق" },
    group: "general",
    type: "multi_select",
    multiValue: true,
    requirement: "recommended",
    filterable: true,
    searchable: true,
    seoIndexable: true,
  },
  ...commercialCore,
];

const machineryAttrs: AttributeDef[] = [
  {
    key: "machine_type",
    label: { en: "Machine Type", ar: "نوع الآلة" },
    group: "general",
    type: "text",
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "capacity",
    label: { en: "Capacity", ar: "السعة" },
    group: "performance",
    type: "measurement",
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "output",
    label: { en: "Output / Production Rate", ar: "الإنتاجية" },
    group: "performance",
    type: "text",
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "power",
    label: { en: "Power", ar: "القدرة" },
    group: "technical",
    type: "measurement",
    unit: "kW",
    allowedUnits: ["kW", "HP"],
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "voltage",
    label: { en: "Voltage", ar: "الجهد" },
    group: "technical",
    type: "measurement",
    unit: "V",
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "fuel_type",
    label: { en: "Fuel Type", ar: "نوع الوقود" },
    group: "technical",
    type: "dropdown",
    options: [
      { value: "electric", label: { en: "Electric", ar: "كهربائي" } },
      { value: "diesel", label: { en: "Diesel", ar: "ديزل" } },
      { value: "petrol", label: { en: "Petrol", ar: "بنزين" } },
      { value: "gas", label: { en: "Gas", ar: "غاز" } },
      { value: "hybrid", label: { en: "Hybrid", ar: "هجين" } },
    ],
    requirement: "optional",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "automation_level",
    label: { en: "Automation Level", ar: "مستوى الأتمتة" },
    group: "performance",
    type: "dropdown",
    options: [
      { value: "manual", label: { en: "Manual", ar: "يدوي" } },
      { value: "semi", label: { en: "Semi-Automatic", ar: "شبه آلي" } },
      { value: "auto", label: { en: "Automatic", ar: "آلي" } },
      { value: "cnc", label: { en: "CNC", ar: "CNC" } },
    ],
    requirement: "optional",
    filterable: true,
  },
  {
    key: "operating_temperature",
    label: { en: "Operating Temperature", ar: "درجة حرارة التشغيل" },
    group: "technical",
    type: "measurement_range",
    unit: "°C",
    requirement: "optional",
  },
  {
    key: "dimensions",
    label: { en: "Dimensions", ar: "الأبعاد" },
    group: "physical",
    type: "dimension",
    unit: "mm",
    requirement: "optional",
  },
  {
    key: "weight",
    label: { en: "Weight", ar: "الوزن" },
    group: "physical",
    type: "weight",
    unit: "kg",
    requirement: "optional",
    filterable: true,
  },
  {
    key: "certification",
    label: { en: "Certification", ar: "الشهادة" },
    group: "certification",
    type: "multi_select",
    multiValue: true,
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  ...commercialCore,
];

const foodAttrs: AttributeDef[] = [
  {
    key: "product_form",
    label: { en: "Product Form", ar: "شكل المنتج" },
    group: "general",
    type: "dropdown",
    options: [
      { value: "fresh", label: { en: "Fresh", ar: "طازج" } },
      { value: "frozen", label: { en: "Frozen", ar: "مجمد" } },
      { value: "dried", label: { en: "Dried", ar: "مجفف" } },
      { value: "canned", label: { en: "Canned", ar: "معلب" } },
      { value: "powder", label: { en: "Powder", ar: "مسحوق" } },
      { value: "liquid", label: { en: "Liquid", ar: "سائل" } },
    ],
    requirement: "recommended",
    filterable: true,
  },
  {
    key: "ingredients",
    label: { en: "Ingredients", ar: "المكونات" },
    group: "technical",
    type: "textarea",
    requirement: "recommended",
  },
  {
    key: "origin",
    label: { en: "Origin", ar: "المنشأ" },
    group: "regional",
    type: "country",
    requirement: "recommended",
    filterable: true,
  },
  {
    key: "grade",
    label: { en: "Grade", ar: "الدرجة" },
    group: "technical",
    type: "text",
    requirement: "optional",
    filterable: true,
  },
  {
    key: "net_weight",
    label: { en: "Net Weight", ar: "الوزن الصافي" },
    group: "packaging",
    type: "weight",
    unit: "kg",
    allowedUnits: ["g", "kg", "L", "ml"],
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "shelf_life",
    label: { en: "Shelf Life", ar: "مدة الصلاحية" },
    group: "technical",
    type: "text",
    requirement: "recommended",
    rfqInheritable: true,
  },
  {
    key: "storage_conditions",
    label: { en: "Storage Conditions", ar: "ظروف التخزين" },
    group: "logistics",
    type: "text",
    requirement: "recommended",
  },
  {
    key: "halal",
    label: { en: "Halal Status", ar: "حالة الحلال" },
    group: "compliance",
    type: "dropdown",
    options: [
      { value: "certified", label: { en: "Halal Certified", ar: "حلال معتمد" } },
      { value: "suitable", label: { en: "Halal Suitable", ar: "مناسب للحلال" } },
      { value: "na", label: { en: "N/A", ar: "غير منطبق" } },
    ],
    requirement: "recommended",
    filterable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "allergen_info",
    label: { en: "Allergen Information", ar: "معلومات المواد المسببة للحساسية" },
    group: "compliance",
    type: "textarea",
    requirement: "optional",
  },
  {
    key: "packaging_type",
    label: { en: "Packaging Type", ar: "نوع التعبئة" },
    group: "packaging",
    type: "text",
    requirement: "recommended",
    filterable: true,
  },
  {
    key: "certification",
    label: { en: "Certification", ar: "الشهادة" },
    group: "certification",
    type: "multi_select",
    multiValue: true,
    options: [
      { value: "halal", label: { en: "Halal", ar: "حلال" } },
      { value: "iso22000", label: { en: "ISO 22000", ar: "ISO 22000" } },
      { value: "haccp", label: { en: "HACCP", ar: "HACCP" } },
      { value: "sfda", label: { en: "SFDA", ar: "هيئة الغذاء والدواء" } },
    ],
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  ...commercialCore,
];

const constructionAttrs: AttributeDef[] = [
  {
    key: "material",
    label: { en: "Material", ar: "المادة" },
    group: "physical",
    type: "dropdown",
    options: [
      { value: "cement", label: { en: "Cement", ar: "أسمنت" } },
      { value: "concrete", label: { en: "Concrete", ar: "خرسانة" } },
      { value: "steel", label: { en: "Steel", ar: "حديد" } },
      { value: "rebar", label: { en: "Rebar", ar: "تسليح" } },
      { value: "timber", label: { en: "Timber", ar: "خشب" } },
      { value: "gypsum", label: { en: "Gypsum", ar: "جبس" } },
      { value: "aggregate", label: { en: "Aggregate", ar: "ركام" } },
      { value: "insulation", label: { en: "Insulation", ar: "عزل" } },
    ],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "grade",
    label: { en: "Grade / Strength", ar: "الدرجة / القوة" },
    group: "technical",
    type: "text",
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "dimensions",
    label: { en: "Dimensions", ar: "الأبعاد" },
    group: "physical",
    type: "dimension",
    unit: "mm",
    requirement: "recommended",
    rfqInheritable: true,
  },
  {
    key: "density",
    label: { en: "Density", ar: "الكثافة" },
    group: "physical",
    type: "measurement",
    unit: "kg/m³",
    requirement: "optional",
  },
  {
    key: "finish",
    label: { en: "Finish", ar: "التشطيب" },
    group: "physical",
    type: "text",
    requirement: "optional",
    filterable: true,
  },
  {
    key: "color",
    label: { en: "Color", ar: "اللون" },
    group: "physical",
    type: "text",
    requirement: "optional",
    filterable: true,
  },
  {
    key: "application",
    label: { en: "Application", ar: "التطبيق" },
    group: "general",
    type: "multi_select",
    multiValue: true,
    requirement: "recommended",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "standards",
    label: { en: "Standards", ar: "المواصفات القياسية" },
    group: "compliance",
    type: "multi_select",
    multiValue: true,
    options: [
      { value: "saso", label: { en: "SASO", ar: "ساسو" } },
      { value: "astm", label: { en: "ASTM", ar: "ASTM" } },
      { value: "bs", label: { en: "BS", ar: "BS" } },
      { value: "en", label: { en: "EN", ar: "EN" } },
      { value: "aci", label: { en: "ACI", ar: "ACI" } },
    ],
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "certification",
    label: { en: "Certification", ar: "الشهادة" },
    group: "certification",
    type: "multi_select",
    multiValue: true,
    requirement: "optional",
    filterable: true,
  },
  ...commercialCore,
];

const ppeAttrs: AttributeDef[] = [
  {
    key: "ppe_type",
    label: { en: "PPE Type", ar: "نوع معدات الحماية" },
    group: "general",
    type: "dropdown",
    options: [
      { value: "helmet", label: { en: "Helmet", ar: "خوذة" } },
      { value: "gloves", label: { en: "Gloves", ar: "قفازات" } },
      { value: "eye", label: { en: "Eye Protection", ar: "حماية العين" } },
      { value: "fall", label: { en: "Fall Protection", ar: "حماية من السقوط" } },
      { value: "footwear", label: { en: "Safety Footwear", ar: "أحذية السلامة" } },
      { value: "clothing", label: { en: "Protective Clothing", ar: "ملابس واقية" } },
      { value: "respiratory", label: { en: "Respiratory", ar: "تنفسي" } },
      { value: "hearing", label: { en: "Hearing Protection", ar: "حماية السمع" } },
    ],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "standard",
    label: { en: "Safety Standard", ar: "معيار السلامة" },
    group: "compliance",
    type: "multi_select",
    multiValue: true,
    options: [
      { value: "en397", label: { en: "EN 397", ar: "EN 397" } },
      { value: "en388", label: { en: "EN 388", ar: "EN 388" } },
      { value: "en166", label: { en: "EN 166", ar: "EN 166" } },
      { value: "en361", label: { en: "EN 361", ar: "EN 361" } },
      { value: "ansi", label: { en: "ANSI", ar: "ANSI" } },
      { value: "saso", label: { en: "SASO", ar: "ساسو" } },
    ],
    requirement: "mandatory",
    filterable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "size",
    label: { en: "Size", ar: "المقاس" },
    group: "physical",
    type: "multi_select",
    multiValue: true,
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "material",
    label: { en: "Material", ar: "المادة" },
    group: "physical",
    type: "text",
    requirement: "recommended",
    filterable: true,
    searchable: true,
  },
  {
    key: "color",
    label: { en: "Color", ar: "اللون" },
    group: "physical",
    type: "text",
    requirement: "optional",
    filterable: true,
  },
  {
    key: "application",
    label: { en: "Application / Industry", ar: "التطبيق / القطاع" },
    group: "general",
    type: "multi_select",
    multiValue: true,
    requirement: "recommended",
    filterable: true,
    searchable: true,
  },
  ...commercialCore,
];

const pumpAttrs: AttributeDef[] = [
  {
    key: "pump_type",
    label: { en: "Pump Type", ar: "نوع المضخة" },
    group: "general",
    type: "dropdown",
    options: [
      { value: "centrifugal", label: { en: "Centrifugal", ar: "طرد مركزي" } },
      { value: "submersible", label: { en: "Submersible", ar: "غاطسة" } },
      { value: "positive_displacement", label: { en: "Positive Displacement", ar: "إزاحة موجبة" } },
      { value: "diaphragm", label: { en: "Diaphragm", ar: "غشائية" } },
      { value: "gear", label: { en: "Gear", ar: "تروس" } },
      { value: "peristaltic", label: { en: "Peristaltic", ar: "تموّجية" } },
    ],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "flow_rate",
    label: { en: "Flow Rate", ar: "معدل التدفق" },
    group: "performance",
    type: "measurement",
    unit: "m³/h",
    allowedUnits: ["L/min", "m³/h", "GPM"],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    rfqInheritable: true,
  },
  {
    key: "head",
    label: { en: "Head", ar: "الارتفاع الضاغط" },
    group: "performance",
    type: "measurement",
    unit: "m",
    requirement: "mandatory",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "material",
    label: { en: "Material", ar: "المادة" },
    group: "physical",
    type: "dropdown",
    options: [
      { value: "cast_iron", label: { en: "Cast Iron", ar: "حديد زهر" } },
      { value: "ss304", label: { en: "SS 304", ar: "ستانلس 304" } },
      { value: "ss316", label: { en: "SS 316", ar: "ستانلس 316" } },
      { value: "bronze", label: { en: "Bronze", ar: "برونز" } },
      { value: "plastic", label: { en: "Plastic", ar: "بلاستيك" } },
    ],
    requirement: "mandatory",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "power",
    label: { en: "Power", ar: "القدرة" },
    group: "technical",
    type: "measurement",
    unit: "HP",
    allowedUnits: ["HP", "kW"],
    requirement: "mandatory",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "voltage",
    label: { en: "Voltage", ar: "الجهد" },
    group: "technical",
    type: "measurement",
    unit: "V",
    requirement: "recommended",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "application",
    label: { en: "Application", ar: "التطبيق" },
    group: "general",
    type: "multi_select",
    multiValue: true,
    options: [
      { value: "water_transfer", label: { en: "Water Transfer", ar: "نقل المياه" } },
      { value: "pressure_boosting", label: { en: "Pressure Boosting", ar: "رفع الضغط" } },
      { value: "irrigation", label: { en: "Irrigation", ar: "ري" } },
      { value: "industrial", label: { en: "Industrial Circulation", ar: "دوران صناعي" } },
      { value: "oil_gas", label: { en: "Oil & Gas", ar: "نفط وغاز" } },
      { value: "wastewater", label: { en: "Wastewater", ar: "مياه الصرف" } },
    ],
    requirement: "recommended",
    filterable: true,
    searchable: true,
    seoIndexable: true,
    rfqInheritable: true,
  },
  {
    key: "certification",
    label: { en: "Certification", ar: "الشهادة" },
    group: "certification",
    type: "multi_select",
    multiValue: true,
    requirement: "optional",
    filterable: true,
  },
  ...commercialCore,
];

const medicalAttrs: AttributeDef[] = [
  {
    key: "device_class",
    label: { en: "Device Class", ar: "فئة الجهاز" },
    group: "compliance",
    type: "dropdown",
    options: [
      { value: "I", label: { en: "Class I", ar: "الفئة الأولى" } },
      { value: "IIa", label: { en: "Class IIa", ar: "الفئة IIa" } },
      { value: "IIb", label: { en: "Class IIb", ar: "الفئة IIb" } },
      { value: "III", label: { en: "Class III", ar: "الفئة الثالثة" } },
      { value: "disposable", label: { en: "Disposable", ar: "مستهلك" } },
    ],
    requirement: "mandatory",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "sfda_registration",
    label: { en: "SFDA Registration", ar: "تسجيل هيئة الغذاء والدواء" },
    group: "regional",
    type: "text",
    requirement: "conditional",
    filterable: true,
    rfqInheritable: true,
  },
  {
    key: "sterile",
    label: { en: "Sterile", ar: "معقّم" },
    group: "technical",
    type: "boolean",
    requirement: "recommended",
    filterable: true,
  },
  {
    key: "application",
    label: { en: "Clinical Application", ar: "التطبيق السريري" },
    group: "general",
    type: "multi_select",
    multiValue: true,
    requirement: "recommended",
    filterable: true,
    searchable: true,
  },
  {
    key: "certification",
    label: { en: "Certification", ar: "الشهادة" },
    group: "certification",
    type: "multi_select",
    multiValue: true,
    options: [
      { value: "sfda", label: { en: "SFDA", ar: "هيئة الغذاء والدواء" } },
      { value: "ce_mdr", label: { en: "CE MDR", ar: "CE MDR" } },
      { value: "fda", label: { en: "FDA", ar: "FDA" } },
      { value: "iso13485", label: { en: "ISO 13485", ar: "ISO 13485" } },
    ],
    requirement: "mandatory",
    filterable: true,
    rfqInheritable: true,
  },
  ...commercialCore,
];

const genericCommercial: AttributeDef[] = [...commercialCore];

export const ATTRIBUTE_TEMPLATES: AttributeTemplate[] = [
  {
    key: "electrical",
    name: { en: "Electrical Equipment", ar: "المعدات الكهربائية" },
    description: {
      en: "Voltage, power, IP rating, and electrical performance attributes.",
      ar: "سمات الجهد والقدرة ودرجة الحماية والأداء الكهربائي.",
    },
    categoryKeys: ["electrical", "lighting", "telecom", "security-systems", "renewable-energy"],
    attributes: electricalAttrs,
  },
  {
    key: "textiles",
    name: { en: "Textiles & Apparel", ar: "المنسوجات والملابس" },
    description: {
      en: "Fabric, GSM, weave, FR rating, and textile commercialization.",
      ar: "القماش والوزن والنسيج ومقاومة الحريق والتسويق للمنسوجات.",
    },
    categoryKeys: ["textiles", "apparel"],
    attributes: textileAttrs,
  },
  {
    key: "machinery",
    name: { en: "Industrial Machinery", ar: "الآلات الصناعية" },
    description: {
      en: "Capacity, power, automation, and plant equipment specs.",
      ar: "السعة والقدرة والأتمتة ومواصفات معدات المصانع.",
    },
    categoryKeys: ["industrial-machinery", "hvac", "tools-hardware", "mining", "home-appliances"],
    attributes: machineryAttrs,
  },
  {
    key: "food",
    name: { en: "Food & Beverage", ar: "الأغذية والمشروبات" },
    description: {
      en: "Halal, shelf life, packaging, and food-grade attributes.",
      ar: "الحلال ومدة الصلاحية والتعبئة وسمات المنتجات الغذائية.",
    },
    categoryKeys: ["fmcg", "food-beverage", "beauty", "hospitality"],
    attributes: foodAttrs,
  },
  {
    key: "construction",
    name: { en: "Construction Materials", ar: "مواد البناء" },
    description: {
      en: "Grade, strength, standards, and building-material specs.",
      ar: "الدرجة والقوة والمواصفات وسمات مواد البناء.",
    },
    categoryKeys: [
      "construction",
      "building-materials",
      "plumbing",
      "furniture-fitout",
    ],
    attributes: constructionAttrs,
  },
  {
    key: "ppe",
    name: { en: "Safety & PPE", ar: "السلامة ومعدات الحماية" },
    description: {
      en: "PPE type, EN/ANSI/SASO standards, sizes, and applications.",
      ar: "نوع معدات الحماية والمعايير والمقاسات والتطبيقات.",
    },
    categoryKeys: ["safety-equipment"],
    attributes: ppeAttrs,
  },
  {
    key: "pumps",
    name: { en: "Pumps & Fluid Handling", ar: "المضخات ونقل السوائل" },
    description: {
      en: "Pump type, flow, head, material, and duty applications.",
      ar: "نوع المضخة والتدفق والارتفاع والمواد والتطبيقات.",
    },
    categoryKeys: ["oil-gas", "water-treatment", "plumbing"],
    attributes: pumpAttrs,
  },
  {
    key: "medical",
    name: { en: "Medical & Lab", ar: "الطبي والمخبري" },
    description: {
      en: "Device class, SFDA, sterility, and clinical certifications.",
      ar: "فئة الجهاز وتسجيل هيئة الغذاء والدواء والتعقيم والشهادات.",
    },
    categoryKeys: ["medical-equipment", "pharmaceuticals", "lab-scientific"],
    attributes: medicalAttrs,
  },
  {
    key: "packaging",
    name: { en: "Packaging Materials", ar: "مواد التعبئة" },
    description: {
      en: "Material, dimensions, printability, and packaging MOQ.",
      ar: "المادة والأبعاد وقابلية الطباعة والحد الأدنى للطلب.",
    },
    categoryKeys: ["packaging", "plastics", "printing-services"],
    attributes: [
      {
        key: "packaging_material",
        label: { en: "Packaging Material", ar: "مادة التعبئة" },
        group: "physical",
        type: "dropdown",
        options: [
          { value: "corrugated", label: { en: "Corrugated", ar: "مموج" } },
          { value: "flexible", label: { en: "Flexible Film", ar: "فيلم مرن" } },
          { value: "rigid_plastic", label: { en: "Rigid Plastic", ar: "بلاستيك صلب" } },
          { value: "paper", label: { en: "Paper", ar: "ورق" } },
          { value: "metal", label: { en: "Metal", ar: "معدن" } },
        ],
        requirement: "mandatory",
        filterable: true,
        searchable: true,
        rfqInheritable: true,
      },
      {
        key: "dimensions",
        label: { en: "Dimensions", ar: "الأبعاد" },
        group: "physical",
        type: "dimension",
        unit: "mm",
        requirement: "recommended",
        rfqInheritable: true,
      },
      {
        key: "print_ready",
        label: { en: "Print Ready / Custom Print", ar: "جاهز للطباعة" },
        group: "customization",
        type: "boolean",
        requirement: "optional",
        filterable: true,
      },
      ...commercialCore,
    ],
  },
  {
    key: "services",
    name: { en: "Professional Services", ar: "الخدمات المهنية" },
    description: {
      en: "Service scope, delivery model, SLA, and coverage area.",
      ar: "نطاق الخدمة ونموذج التسليم واتفاقية الخدمة ومنطقة التغطية.",
    },
    categoryKeys: [
      "it-services",
      "facility-management",
      "cleaning",
      "education",
      "waste-management",
      "marketing-services",
      "company-formation",
      "legal-services",
      "visa-services",
      "accounting-finance",
      "hr-recruitment",
      "translation-services",
      "professional-services",
      "logistics",
    ],
    attributes: [
      {
        key: "service_type",
        label: { en: "Service Type", ar: "نوع الخدمة" },
        group: "general",
        type: "text",
        requirement: "mandatory",
        filterable: true,
        searchable: true,
        rfqInheritable: true,
      },
      {
        key: "delivery_model",
        label: { en: "Delivery Model", ar: "نموذج التقديم" },
        group: "commercial",
        type: "dropdown",
        options: [
          { value: "onsite", label: { en: "On-site", ar: "في الموقع" } },
          { value: "remote", label: { en: "Remote", ar: "عن بُعد" } },
          { value: "hybrid", label: { en: "Hybrid", ar: "هجين" } },
          { value: "managed", label: { en: "Managed Service", ar: "خدمة مُدارة" } },
        ],
        requirement: "recommended",
        filterable: true,
        rfqInheritable: true,
      },
      {
        key: "coverage_area",
        label: { en: "Coverage Area", ar: "منطقة التغطية" },
        group: "logistics",
        type: "multi_select",
        multiValue: true,
        requirement: "recommended",
        filterable: true,
        rfqInheritable: true,
      },
      {
        key: "sla",
        label: { en: "SLA / Response Time", ar: "اتفاقية مستوى الخدمة" },
        group: "commercial",
        type: "text",
        requirement: "optional",
        rfqInheritable: true,
      },
      ...genericCommercial,
    ],
  },
  {
    key: "chemicals",
    name: { en: "Chemicals", ar: "الكيماويات" },
    description: {
      en: "CAS/grade, hazard class, packaging, and SDS-linked fields.",
      ar: "الدرجة وتصنيف الخطر والتعبئة وحقول مرتبطة بصحيفة السلامة.",
    },
    categoryKeys: ["chemicals", "plastics"],
    attributes: [
      {
        key: "chemical_name",
        label: { en: "Chemical / Trade Name", ar: "الاسم الكيميائي / التجاري" },
        group: "general",
        type: "text",
        requirement: "mandatory",
        searchable: true,
        seoIndexable: true,
      },
      {
        key: "cas_number",
        label: { en: "CAS Number", ar: "رقم CAS" },
        group: "technical",
        type: "text",
        requirement: "optional",
        searchable: true,
      },
      {
        key: "purity",
        label: { en: "Purity / Grade", ar: "النقاء / الدرجة" },
        group: "technical",
        type: "text",
        requirement: "recommended",
        filterable: true,
        rfqInheritable: true,
      },
      {
        key: "hazard_class",
        label: { en: "Hazard Class", ar: "فئة الخطر" },
        group: "compliance",
        type: "text",
        requirement: "recommended",
        filterable: true,
        rfqInheritable: true,
      },
      {
        key: "packaging_size",
        label: { en: "Packaging Size", ar: "حجم التعبئة" },
        group: "packaging",
        type: "text",
        requirement: "recommended",
        filterable: true,
        rfqInheritable: true,
      },
      ...commercialCore,
    ],
  },
  {
    key: "automotive",
    name: { en: "Automotive Parts", ar: "قطع غيار السيارات" },
    description: {
      en: "OEM/aftermarket, vehicle fitment, and part references.",
      ar: "أصلي/بديل وتوافق المركبة ومراجع القطع.",
    },
    categoryKeys: ["automotive"],
    attributes: [
      {
        key: "oem_aftermarket",
        label: { en: "OEM / Aftermarket", ar: "أصلي / بديل" },
        group: "general",
        type: "dropdown",
        options: [
          { value: "oem", label: { en: "OEM", ar: "أصلي" } },
          { value: "aftermarket", label: { en: "Aftermarket", ar: "بديل" } },
          { value: "both", label: { en: "Both", ar: "كلاهما" } },
        ],
        requirement: "recommended",
        filterable: true,
      },
      {
        key: "part_number",
        label: { en: "Part Number", ar: "رقم القطعة" },
        group: "general",
        type: "text",
        requirement: "recommended",
        searchable: true,
        seoIndexable: true,
      },
      {
        key: "vehicle_compatibility",
        label: { en: "Vehicle Compatibility", ar: "توافق المركبة" },
        group: "technical",
        type: "textarea",
        requirement: "recommended",
        searchable: true,
        rfqInheritable: true,
      },
      ...commercialCore,
    ],
  },
  {
    key: "agriculture",
    name: { en: "Agriculture", ar: "الزراعة" },
    description: {
      en: "Irrigation, crop application, and agri-equipment specs.",
      ar: "الري وتطبيق المحاصيل ومواصفات المعدات الزراعية.",
    },
    categoryKeys: ["agriculture"],
    attributes: [
      {
        key: "agri_product_type",
        label: { en: "Agri Product Type", ar: "نوع المنتج الزراعي" },
        group: "general",
        type: "dropdown",
        options: [
          { value: "irrigation", label: { en: "Irrigation", ar: "ري" } },
          { value: "fertilizer", label: { en: "Fertilizer", ar: "سماد" } },
          { value: "greenhouse", label: { en: "Greenhouse", ar: "بيت محمي" } },
          { value: "machinery", label: { en: "Machinery", ar: "آلات" } },
          { value: "seeds", label: { en: "Seeds", ar: "بذور" } },
        ],
        requirement: "mandatory",
        filterable: true,
        searchable: true,
        rfqInheritable: true,
      },
      {
        key: "crop_application",
        label: { en: "Crop / Application", ar: "المحصول / التطبيق" },
        group: "general",
        type: "multi_select",
        multiValue: true,
        requirement: "optional",
        filterable: true,
      },
      ...commercialCore,
    ],
  },
  {
    key: "generic",
    name: { en: "Generic Commercial", ar: "تجاري عام" },
    description: {
      en: "Fallback commercial attributes when no specialist template applies.",
      ar: "سمات تجارية احتياطية عند عدم وجود قالب متخصص.",
    },
    categoryKeys: ["stationery", "office-supplies", "others"],
    attributes: genericCommercial,
  },
];

export function getTemplateByKey(key: string) {
  return ATTRIBUTE_TEMPLATES.find((t) => t.key === key);
}

export function getTemplateForCategoryKey(categoryKey: string) {
  return (
    ATTRIBUTE_TEMPLATES.find((t) => t.categoryKeys.includes(categoryKey)) ||
    getTemplateByKey("generic")
  );
}

export function getAllAttributeDefs(): AttributeDef[] {
  const map = new Map<string, AttributeDef>();
  for (const tpl of ATTRIBUTE_TEMPLATES) {
    for (const attr of tpl.attributes) {
      if (!map.has(attr.key)) map.set(attr.key, attr);
    }
  }
  return [...map.values()];
}

export function getFilterableKeysForCategory(categoryKey: string): string[] {
  const tpl = getTemplateForCategoryKey(categoryKey);
  return (tpl?.attributes || []).filter((a) => a.filterable).map((a) => a.key);
}

export function getRfqFieldsForCategory(categoryKey: string): AttributeDef[] {
  const tpl = getTemplateForCategoryKey(categoryKey);
  return (tpl?.attributes || []).filter((a) => a.rfqInheritable !== false && (a.requirement === "mandatory" || a.requirement === "recommended" || a.filterable));
}
