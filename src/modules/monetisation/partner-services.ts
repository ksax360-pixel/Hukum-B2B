/**
 * 2029+ upside — kept out of the base financial plan.
 * Partner services keep Hukum asset-light; licensed partners hold funds / run logistics.
 */

export type PartnerServiceKey =
  | "lead_packs"
  | "verified_pro"
  | "performance_listings"
  | "financing_referral"
  | "logistics_inspection"
  | "data_products";

export type PartnerService = {
  key: PartnerServiceKey;
  name: { en: string; ar: string };
  blurb: { en: string; ar: string };
  horizon: "2029+";
  partnerLed: boolean;
};

export const PARTNER_SERVICES: PartnerService[] = [
  {
    key: "lead_packs",
    name: { en: "Lead packs", ar: "باقات العملاء" },
    blurb: {
      en: "Extra matched leads beyond plan allocation.",
      ar: "عملاء مطابقون إضافيون فوق حصة الخطة.",
    },
    horizon: "2029+",
    partnerLed: false,
  },
  {
    key: "verified_pro",
    name: { en: "Verified Pro fee", ar: "رسوم التوثيق الاحترافي" },
    blurb: {
      en: "Paid site audit and report.",
      ar: "تدقيق مدفوع للموقع وتقرير.",
    },
    horizon: "2029+",
    partnerLed: false,
  },
  {
    key: "performance_listings",
    name: { en: "Performance listings", ar: "إعلانات بالأداء" },
    blurb: {
      en: "Pay only when buyers engage.",
      ar: "ادفع فقط عند تفاعل المشترين.",
    },
    horizon: "2029+",
    partnerLed: false,
  },
  {
    key: "financing_referral",
    name: { en: "Financing referral", ar: "إحالة التمويل" },
    blurb: {
      en: "Fee from SAMA-licensed B2B pay-later partners. Hukum never holds buyer funds.",
      ar: "عمولة من شركاء الدفع الآجل المرخّصين من ساما. حكم لا تحتفظ بأموال المشتري.",
    },
    horizon: "2029+",
    partnerLed: true,
  },
  {
    key: "logistics_inspection",
    name: { en: "Logistics & inspection", ar: "اللوجستيات والفحص" },
    blurb: {
      en: "Commission from partner logistics and inspection services.",
      ar: "عمولة من خدمات اللوجستيات والفحص لدى الشركاء.",
    },
    horizon: "2029+",
    partnerLed: true,
  },
  {
    key: "data_products",
    name: { en: "Data products", ar: "منتجات البيانات" },
    blurb: {
      en: "Price index and demand reports.",
      ar: "مؤشر أسعار وتقارير الطلب.",
    },
    horizon: "2029+",
    partnerLed: false,
  },
];
