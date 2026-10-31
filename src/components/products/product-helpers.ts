import type { Locale } from "@/i18n/config";
import { vendorLogoSrc as fallbackVendorLogo } from "@/lib/product-visuals";
import { t as loc } from "@/lib/utils";

/** Convert Mongoose lean docs / ObjectIds into JSON-safe props for Client Components. */
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

export type ProductLike = {
  _id?: unknown;
  sku?: string;
  productCode?: string;
  brand?: string;
  manufacturer?: string;
  manufacturerName?: string;
  name?: { en?: string; ar?: string };
  shortDescription?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  slug?: { en?: string; ar?: string };
  price?: number;
  currency?: string;
  priceType?: string;
  moq?: number;
  maxOrderQty?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  negotiable?: boolean;
  requestQuote?: boolean;
  unit?: string;
  availability?: string;
  leadTime?: string;
  deliveryTime?: string;
  paymentTerms?: string;
  condition?: string;
  countryOfOrigin?: string;
  hsCode?: string;
  certifications?: string[];
  applications?: { en?: string; ar?: string };
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    weight?: number;
    volume?: number;
    unit?: string;
    weightUnit?: string;
  };
  attributes?: Record<string, unknown> | Map<string, unknown>;
  media?: Array<{
    url?: string;
    type?: string;
    alt?: { en?: string; ar?: string };
    isPrimary?: boolean;
    order?: number;
  }>;
  verificationStatus?: string;
  shipping?: {
    available?: boolean;
    deliveryAreas?: string[];
    method?: string;
    estimatedDelivery?: string;
    warehouseLocation?: string;
    terms?: string;
    pickupAvailable?: boolean;
  };
  categoryId?: unknown;
  industryId?: unknown;
};

export type VendorLike = {
  _id?: unknown;
  legalName?: { en?: string; ar?: string } | null;
  tradeName?: string;
  slug?: { en?: string; ar?: string } | null;
  verificationStatus?: string;
  logo?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  /** True when contacts exist but were stripped for anonymous viewers. */
  hasContact?: boolean;
  /** Gated — only present after session/OTP reveal */
  website?: string;
  description?: { en?: string; ar?: string } | null;
  companyType?: string;
  certifications?: string[];
  location?: { country?: string; city?: string; region?: string; address?: string };
  citiesServed?: string[];
  marketsServed?: string[];
  exportMarkets?: string[];
  capabilities?: string[];
  moq?: string;
  leadTime?: string;
  paymentTerms?: string;
  createdAt?: string;
  featured?: boolean;
};

function attrsOf(product: ProductLike): Record<string, unknown> {
  if (!product.attributes) return {};
  if (product.attributes instanceof Map) return Object.fromEntries(product.attributes.entries());
  return product.attributes as Record<string, unknown>;
}

export function getProductAttrs(product: ProductLike) {
  return attrsOf(product);
}

function attr(product: ProductLike, ...keys: string[]) {
  const a = attrsOf(product);
  for (const key of keys) {
    const v = a[key];
    if (v != null && v !== "") return String(v);
  }
  return undefined;
}

function truthyAttr(product: ProductLike, ...keys: string[]) {
  const a = attrsOf(product);
  for (const key of keys) {
    const v = a[key];
    if (v === true || v === "true" || v === "yes" || v === "1") return true;
    if (typeof v === "string" && v.trim() && !["false", "no", "0"].includes(v.toLowerCase())) return true;
  }
  return false;
}

type Row = { label: string; value: string };

function pushRow(rows: Row[], label: string, value?: string | number | null) {
  if (value == null || value === "") return;
  rows.push({ label, value: String(value) });
}

export function buildTrustStrip(
  product: ProductLike,
  vendor: VendorLike | null,
  locale: Locale
): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  if (vendor?.verificationStatus === "verified") {
    pushRow(rows, isAr ? "المورد" : "Vendor", isAr ? "موثّق" : "Verified");
  }
  if (vendor?.companyType) {
    pushRow(rows, isAr ? "نوع الشركة" : "Business type", vendor.companyType.replace(/_/g, " "));
  }
  if (product.countryOfOrigin) {
    pushRow(rows, isAr ? "المنشأ" : "Origin", product.countryOfOrigin);
  }
  if (product.moq != null) {
    pushRow(rows, isAr ? "الحد الأدنى" : "MOQ", `${product.moq}${product.unit ? ` ${product.unit}` : ""}`);
  }
  if (product.leadTime) pushRow(rows, isAr ? "مدة التوريد" : "Lead time", product.leadTime);
  if (product.availability) {
    pushRow(rows, isAr ? "التوفر" : "Availability", product.availability.replace(/_/g, " "));
  }
  return rows;
}

export function buildCommercialRows(product: ProductLike, locale: Locale): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  const price = formatPrice(product, locale);
  pushRow(rows, isAr ? "السعر" : "Price", price.label);
  if (product.currency) pushRow(rows, isAr ? "العملة" : "Currency", product.currency);
  if (product.unit) pushRow(rows, isAr ? "وحدة القياس" : "Unit", product.unit);
  if (product.moq != null) pushRow(rows, isAr ? "الحد الأدنى للطلب" : "MOQ", String(product.moq));
  if (product.maxOrderQty != null) {
    pushRow(rows, isAr ? "الحد الأقصى للطلب" : "Max order qty", String(product.maxOrderQty));
  }
  if (product.wholesalePrice != null) {
    pushRow(rows, isAr ? "سعر الجملة" : "Wholesale price", `${product.wholesalePrice} ${product.currency || "SAR"}`);
  }
  if (product.paymentTerms) pushRow(rows, isAr ? "شروط الدفع" : "Payment terms", product.paymentTerms);
  if (product.leadTime) pushRow(rows, isAr ? "مدة التوريد" : "Lead time", product.leadTime);
  if (product.deliveryTime) pushRow(rows, isAr ? "مدة التسليم" : "Delivery time", product.deliveryTime);
  if (product.availability) {
    pushRow(rows, isAr ? "التوفر" : "Availability", product.availability.replace(/_/g, " "));
  }
  if (product.negotiable) pushRow(rows, isAr ? "قابل للتفاوض" : "Negotiable", isAr ? "نعم" : "Yes");
  const samplePrice = attr(product, "sample_price", "samplePrice");
  const sampleLead = attr(product, "sample_lead_time", "sampleLeadTime");
  if (samplePrice) pushRow(rows, isAr ? "سعر العينة" : "Sample price", samplePrice);
  if (sampleLead) pushRow(rows, isAr ? "مدة توريد العينة" : "Sample lead time", sampleLead);
  const incoterms = attr(product, "incoterms", "trade_terms");
  if (incoterms) pushRow(rows, isAr ? "الإنكوترمز" : "Incoterms", incoterms);
  return rows;
}

export function buildSpecGroups(product: ProductLike, locale: Locale): { title: string; rows: Row[] }[] {
  const isAr = locale === "ar";
  const attrs = attrsOf(product);

  const general: Row[] = [];
  pushRow(general, isAr ? "رمز المنتج" : "SKU", product.sku);
  pushRow(general, isAr ? "كود المنتج" : "Product code", product.productCode);
  pushRow(general, isAr ? "العلامة" : "Brand", product.brand);
  pushRow(general, isAr ? "الشركة المصنعة" : "Manufacturer", product.manufacturer);
  pushRow(general, isAr ? "الموديل" : "Model", attr(product, "model"));
  pushRow(general, isAr ? "الحالة" : "Condition", product.condition?.replace(/_/g, " "));
  pushRow(general, isAr ? "بلد المنشأ" : "Country of origin", product.countryOfOrigin);
  pushRow(general, isAr ? "رمز النظام المنسق" : "HS code", product.hsCode || attr(product, "hs_code", "hsCode"));

  const physical: Row[] = [];
  pushRow(physical, isAr ? "المادة" : "Material", attr(product, "material"));
  pushRow(physical, isAr ? "المقاس" : "Size", attr(product, "size"));
  pushRow(physical, isAr ? "اللون" : "Color", attr(product, "color", "colour"));
  pushRow(physical, isAr ? "التشطيب" : "Finish", attr(product, "finish"));
  pushRow(physical, isAr ? "الدرجة" : "Grade", attr(product, "grade"));
  if (product.dimensions) {
    const d = product.dimensions;
    if (d.length || d.width || d.height) {
      pushRow(
        physical,
        isAr ? "الأبعاد" : "Dimensions",
        [d.length, d.width, d.height].filter((n) => n != null).join(" × ") + (d.unit ? ` ${d.unit}` : "")
      );
    }
    if (d.diameter != null) pushRow(physical, isAr ? "القطر" : "Diameter", `${d.diameter}${d.unit ? ` ${d.unit}` : ""}`);
    if (d.weight != null) pushRow(physical, isAr ? "الوزن" : "Weight", `${d.weight}${d.weightUnit ? ` ${d.weightUnit}` : ""}`);
    if (d.volume != null) pushRow(physical, isAr ? "الحجم" : "Volume", String(d.volume));
  }

  const performance: Row[] = [];
  for (const [key, labelEn, labelAr] of [
    ["capacity", "Capacity", "السعة"],
    ["power", "Power", "القدرة"],
    ["voltage", "Voltage", "الجهد"],
    ["current", "Current", "التيار"],
    ["frequency", "Frequency", "التردد"],
    ["speed", "Speed", "السرعة"],
    ["pressure", "Pressure", "الضغط"],
    ["temperature_range", "Temperature range", "نطاق الحرارة"],
    ["efficiency", "Efficiency", "الكفاءة"],
    ["output", "Output", "الإنتاج"],
  ] as const) {
    pushRow(performance, isAr ? labelAr : labelEn, attr(product, key, key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())));
  }

  const known = new Set([
    "material",
    "model",
    "size",
    "capacity",
    "grade",
    "voltage",
    "power",
    "current",
    "frequency",
    "speed",
    "pressure",
    "temperature_range",
    "efficiency",
    "output",
    "color",
    "colour",
    "finish",
    "certification",
    "hs_code",
    "hsCode",
    "sample_price",
    "samplePrice",
    "sample_lead_time",
    "sampleLeadTime",
    "sample_available",
    "packaging",
    "packaging_type",
    "units_per_carton",
    "carton_size",
    "carton_weight",
    "incoterms",
    "trade_terms",
    "port_of_loading",
    "oem",
    "odm",
    "private_label",
    "customization",
    "customization_moq",
    "customization_lead_time",
    "production_capacity",
    "daily_capacity",
    "monthly_capacity",
    "factory_location",
    "manufacturing_type",
    "quality_control",
    "inspection",
    "aql",
    "warranty",
    "warranty_period",
    "after_sales",
  ]);

  const other: Row[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (known.has(key) || value == null || value === "") continue;
    if (typeof value === "object") continue;
    pushRow(other, key.replace(/_/g, " "), String(value));
  }

  if (product.certifications?.length) {
    pushRow(general, isAr ? "الشهادات" : "Certifications", product.certifications.join(", "));
  }

  return [
    { title: isAr ? "عام" : "General", rows: general },
    { title: isAr ? "فيزيائي" : "Physical", rows: physical },
    { title: isAr ? "الأداء" : "Performance", rows: performance },
    { title: isAr ? "سمات إضافية" : "Additional attributes", rows: other },
  ].filter((g) => g.rows.length > 0);
}

export function buildPackagingRows(product: ProductLike, locale: Locale): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  pushRow(rows, isAr ? "التعبئة" : "Packaging", attr(product, "packaging", "packaging_type"));
  pushRow(rows, isAr ? "حجم الكرتون" : "Carton size", attr(product, "carton_size", "cartonSize"));
  pushRow(rows, isAr ? "وزن الكرتون" : "Carton weight", attr(product, "carton_weight", "cartonWeight"));
  pushRow(rows, isAr ? "وحدات لكل كرتون" : "Units per carton", attr(product, "units_per_carton", "unitsPerCarton"));
  pushRow(rows, isAr ? "معلومات الطبلية" : "Pallet info", attr(product, "pallet", "pallet_info"));
  pushRow(rows, isAr ? "مواد التعبئة" : "Packaging material", attr(product, "packaging_material"));
  pushRow(rows, isAr ? "الملصقات" : "Labeling", attr(product, "labeling", "labelling"));
  return rows;
}

export function buildLogisticsRows(product: ProductLike, locale: Locale): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  const s = product.shipping;
  if (s?.warehouseLocation) pushRow(rows, isAr ? "موقع المستودع" : "Warehouse", s.warehouseLocation);
  if (s?.method) pushRow(rows, isAr ? "طريقة الشحن" : "Shipping method", s.method);
  if (s?.estimatedDelivery) pushRow(rows, isAr ? "التسليم المتوقع" : "Estimated delivery", s.estimatedDelivery);
  if (s?.terms) pushRow(rows, isAr ? "شروط الشحن" : "Shipping terms", s.terms);
  if (s?.deliveryAreas?.length) {
    pushRow(rows, isAr ? "مناطق التسليم" : "Delivery areas", s.deliveryAreas.join(", "));
  }
  if (s?.pickupAvailable) pushRow(rows, isAr ? "الاستلام متاح" : "Pickup available", isAr ? "نعم" : "Yes");
  pushRow(rows, isAr ? "ميناء التحميل" : "Port of loading", attr(product, "port_of_loading", "portOfLoading"));
  pushRow(rows, isAr ? "الإنكوترمز" : "Incoterms", attr(product, "incoterms", "trade_terms"));
  if (product.leadTime) pushRow(rows, isAr ? "مدة الإنتاج" : "Production lead time", product.leadTime);
  if (product.deliveryTime) pushRow(rows, isAr ? "مدة الشحن" : "Shipping lead time", product.deliveryTime);
  if (product.countryOfOrigin) pushRow(rows, isAr ? "منشأ الشحن" : "Shipping origin", product.countryOfOrigin);
  return rows;
}

export function buildCustomizationRows(product: ProductLike, locale: Locale): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  const flags: string[] = [];
  if (truthyAttr(product, "oem")) flags.push("OEM");
  if (truthyAttr(product, "odm")) flags.push("ODM");
  if (truthyAttr(product, "private_label", "privateLabel")) flags.push(isAr ? "علامة خاصة" : "Private label");
  if (truthyAttr(product, "customization", "customisable", "customizable")) {
    flags.push(isAr ? "تخصيص" : "Customization");
  }
  if (flags.length) pushRow(rows, isAr ? "خيارات التخصيص" : "Customization options", flags.join(" · "));
  pushRow(rows, isAr ? "تفاصيل التخصيص" : "Details", attr(product, "customization", "customization_details"));
  pushRow(rows, isAr ? "الحد الأدنى للتخصيص" : "Customization MOQ", attr(product, "customization_moq", "customizationMoq"));
  pushRow(
    rows,
    isAr ? "مدة التخصيص" : "Customization lead time",
    attr(product, "customization_lead_time", "customizationLeadTime")
  );
  return rows;
}

export function buildManufacturingRows(product: ProductLike, vendor: VendorLike | null, locale: Locale): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  pushRow(rows, isAr ? "الشركة المصنعة" : "Manufacturer", product.manufacturer || attr(product, "manufacturer"));
  pushRow(rows, isAr ? "موقع المصنع" : "Factory location", attr(product, "factory_location", "factoryLocation"));
  pushRow(rows, isAr ? "نوع التصنيع" : "Manufacturing type", attr(product, "manufacturing_type", "manufacturingType"));
  pushRow(rows, isAr ? "الطاقة الإنتاجية" : "Production capacity", attr(product, "production_capacity", "productionCapacity"));
  pushRow(rows, isAr ? "الطاقة اليومية" : "Daily capacity", attr(product, "daily_capacity", "dailyCapacity"));
  pushRow(rows, isAr ? "الطاقة الشهرية" : "Monthly capacity", attr(product, "monthly_capacity", "monthlyCapacity"));
  if (vendor?.companyType === "manufacturer") {
    pushRow(rows, isAr ? "نوع المورد" : "Vendor type", isAr ? "مصنّع" : "Manufacturer");
  }
  return rows;
}

export function buildQualityRows(product: ProductLike, locale: Locale): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  pushRow(rows, isAr ? "مراقبة الجودة" : "Quality control", attr(product, "quality_control", "qualityControl"));
  pushRow(rows, isAr ? "الفحص" : "Inspection", attr(product, "inspection"));
  pushRow(rows, isAr ? "معيار AQL" : "AQL", attr(product, "aql"));
  pushRow(rows, isAr ? "الضمان" : "Warranty", attr(product, "warranty", "warranty_period"));
  pushRow(rows, isAr ? "ما بعد البيع" : "After-sales", attr(product, "after_sales", "afterSales"));
  return rows;
}

export function buildSampleRows(product: ProductLike, locale: Locale): Row[] {
  const isAr = locale === "ar";
  const rows: Row[] = [];
  const available =
    truthyAttr(product, "sample_available", "sampleAvailable") ||
    Boolean(attr(product, "sample_price", "samplePrice"));
  if (available) pushRow(rows, isAr ? "العينات" : "Samples", isAr ? "متاحة" : "Available");
  pushRow(rows, isAr ? "سعر العينة" : "Sample price", attr(product, "sample_price", "samplePrice"));
  pushRow(rows, isAr ? "مدة توريد العينة" : "Sample lead time", attr(product, "sample_lead_time", "sampleLeadTime"));
  pushRow(rows, isAr ? "ملاحظات العينة" : "Sample notes", attr(product, "sample_notes", "sampleNotes"));
  return rows;
}

export function buildProductFaqs(
  product: ProductLike,
  vendor: VendorLike | null,
  locale: Locale
): { q: string; a: string }[] {
  const isAr = locale === "ar";
  const faqs: { q: string; a: string }[] = [];

  if (product.moq != null) {
    faqs.push({
      q: isAr ? "ما هو الحد الأدنى للطلب؟" : "What is the MOQ?",
      a: `${product.moq}${product.unit ? ` ${product.unit}` : ""}`,
    });
  }
  if (product.leadTime) {
    faqs.push({
      q: isAr ? "ما هي مدة التوريد؟" : "What is the lead time?",
      a: product.leadTime,
    });
  }
  if (buildCustomizationRows(product, locale).length) {
    faqs.push({
      q: isAr ? "هل التخصيص متاح؟" : "Is customization available?",
      a: isAr ? "نعم — راجع قسم التخصيص للتفاصيل." : "Yes — see the customization section for details.",
    });
  }
  if (buildSampleRows(product, locale).length) {
    faqs.push({
      q: isAr ? "هل العينات متاحة؟" : "Are samples available?",
      a: isAr ? "نعم — راجع معلومات العينات أو اطلب عينة." : "Yes — see sample information or request a sample.",
    });
  }
  if (product.certifications?.length) {
    faqs.push({
      q: isAr ? "ما الشهادات المتوفرة؟" : "What certifications are available?",
      a: product.certifications.join(", "),
    });
  }
  if (product.countryOfOrigin) {
    faqs.push({
      q: isAr ? "أين يُصنع المنتج؟" : "Where is the product manufactured?",
      a: product.countryOfOrigin,
    });
  }
  if (product.paymentTerms) {
    faqs.push({
      q: isAr ? "ما شروط الدفع؟" : "What payment terms are accepted?",
      a: product.paymentTerms,
    });
  }
  if (product.shipping?.method || attr(product, "incoterms")) {
    faqs.push({
      q: isAr ? "ما خيارات الشحن؟" : "What shipping options are available?",
      a: [product.shipping?.method, attr(product, "incoterms", "trade_terms")].filter(Boolean).join(" · "),
    });
  }
  if (vendor?.location?.city || vendor?.location?.country) {
    faqs.push({
      q: isAr ? "أين يقع المورد؟" : "Where is the vendor located?",
      a: [vendor.location?.city, vendor.location?.country].filter(Boolean).join(", "),
    });
  }
  return faqs;
}

export function formatDocSize(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function productSlug(product: ProductLike) {
  return product.slug?.en || product.slug?.ar || String(product._id);
}

export function formatPrice(product: ProductLike, locale: Locale) {
  const isAr = locale === "ar";
  const type = product.priceType || "price_on_request";
  const currency = product.currency || "SAR";
  const unit = product.unit ? ` / ${product.unit}` : "";

  if (type === "price_on_request" || type === "contact_supplier" || product.price == null) {
    return {
      label: isAr ? "السعر عند الطلب" : "Price on request",
      detail: isAr ? "اطلب التسعير" : "Request pricing",
      public: false,
      amount: null as number | null,
      compareAt: null as number | null,
      currency,
      unit,
    };
  }

  const amount = product.price;
  const compareRaw =
    product.retailPrice != null && product.retailPrice > amount
      ? product.retailPrice
      : product.wholesalePrice != null && product.wholesalePrice > amount
        ? product.wholesalePrice
        : null;
  const amountLabel = `${amount.toLocaleString()} ${currency}`;
  const compareLabel = compareRaw != null ? `${compareRaw.toLocaleString()} ${currency}` : null;

  if (type === "starting_from") {
    return {
      label: isAr ? `يبدأ من ${amountLabel}` : `From ${amountLabel}`,
      detail: unit,
      public: true,
      amount,
      compareAt: compareRaw,
      compareLabel,
      currency,
      unit,
    };
  }

  return {
    label: amountLabel,
    detail: unit,
    public: true,
    amount,
    compareAt: compareRaw,
    compareLabel,
    currency,
    unit,
  };
}

export function pickHighlights(product: ProductLike, locale: Locale) {
  const isAr = locale === "ar";
  const attrs = attrsOf(product);
  const items: { label: string; value: string }[] = [];

  const push = (label: string, value?: string | number | null) => {
    if (value == null || value === "") return;
    if (items.length >= 4) return;
    items.push({ label, value: String(value) });
  };

  push(isAr ? "المادة" : "Material", attrs.material as string | undefined);
  push(isAr ? "الموديل" : "Model", attrs.model as string | undefined);
  push(isAr ? "المقاس" : "Size", attrs.size as string | undefined);
  push(isAr ? "السعة" : "Capacity", attrs.capacity as string | undefined);
  push(isAr ? "الدرجة" : "Grade", attrs.grade as string | undefined);
  push(isAr ? "المنشأ" : "Origin", product.countryOfOrigin);
  push(
    isAr ? "الشهادة" : "Certification",
    product.certifications?.[0] || (attrs.certification as string | undefined)
  );
  push(isAr ? "العلامة" : "Brand", product.brand);

  return items.slice(0, 4);
}

/** Lean attributes for listing cards — no MOQ / availability / condition (those live elsewhere). */
export function pickCardHighlights(product: ProductLike, locale: Locale) {
  return pickHighlights(product, locale).slice(0, 3);
}

export function pickSpecRows(product: ProductLike, locale: Locale) {
  const isAr = locale === "ar";
  const attrs = attrsOf(product);
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value?: string | number | null) => {
    if (value == null || value === "") return;
    rows.push({ label, value: String(value) });
  };

  add(isAr ? "رمز المنتج" : "SKU", product.sku);
  add(isAr ? "العلامة التجارية" : "Brand", product.brand);
  add(isAr ? "الشركة المصنعة" : "Manufacturer", product.manufacturer);
  add(isAr ? "الحالة" : "Condition", product.condition?.replace(/_/g, " "));
  add(isAr ? "وحدة القياس" : "Unit", product.unit);
  add(isAr ? "بلد المنشأ" : "Country of origin", product.countryOfOrigin);
  add(isAr ? "التوفر" : "Availability", product.availability?.replace(/_/g, " "));
  add(isAr ? "شروط الدفع" : "Payment terms", product.paymentTerms);

  if (product.dimensions) {
    const d = product.dimensions;
    if (d.length || d.width || d.height) {
      add(
        isAr ? "الأبعاد" : "Dimensions",
        [d.length, d.width, d.height].filter((n) => n != null).join(" × ") + (d.unit ? ` ${d.unit}` : "")
      );
    }
    if (d.weight != null) add(isAr ? "الوزن" : "Weight", `${d.weight}${d.weightUnit ? ` ${d.weightUnit}` : ""}`);
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === "") continue;
    add(key.replace(/_/g, " "), String(value));
  }

  if (product.certifications?.length) {
    add(isAr ? "الشهادات" : "Certifications", product.certifications.join(", "));
  }

  return rows;
}

export function mediaList(product: ProductLike) {
  const media = (product.media || [])
    .filter((m) => m.url)
    .map((m) => ({
      ...m,
      url: m.url?.replace(/\/products\/([^/?]+)\.svg$/i, "/products/$1.jpg"),
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.order || 0) - (b.order || 0));
  // Do not invent static /products/*.jpg placeholders — only Mongo/multer media.
  return media;
}

export function vendorLogoUrl(vendor?: VendorLike | null) {
  if (!vendor) return undefined;
  return fallbackVendorLogo(vendor);
}

export function shortCopy(product: ProductLike, locale: Locale) {
  return loc(locale, product.shortDescription) || loc(locale, product.description) || "";
}

export function whatsappLink(phone?: string) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function telLink(phone?: string) {
  if (!phone) return null;
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function mailLink(email?: string) {
  if (!email) return null;
  return `mailto:${email}`;
}

export function toneForId(id: string) {
  const tones = ["#EEF3F7", "#F4F0E8", "#EEF2EE", "#F3F1F5", "#F0F4F2"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % tones.length;
  return tones[hash];
}
