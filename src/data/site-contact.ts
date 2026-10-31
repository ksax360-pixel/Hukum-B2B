/** Public contact channels — only list addresses that are officially in use. */
export const SITE_CONTACT = {
  generalEmail: "hello@kingdomtrade.sa",
  businessEmail: "hello@kingdomtrade.sa",
  vendorsEmail: "hello@kingdomtrade.sa",
  buyersEmail: "hello@kingdomtrade.sa",
  partnershipsEmail: "hello@kingdomtrade.sa",
  supportEmail: "hello@kingdomtrade.sa",
  /** Set when a public phone line is confirmed */
  phone: "" as string,
  /** Set when a public WhatsApp business line is confirmed */
  whatsapp: "" as string,
  office: {
    name: { en: "Hukum", ar: "Hukum" },
    city: { en: "Riyadh", ar: "الرياض" },
    country: { en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
    /** Leave empty until a verified street address is published */
    address: { en: "", ar: "" },
    hours: {
      en: "Sunday – Thursday, 9:00 – 18:00 (AST)",
      ar: "الأحد – الخميس، 9:00 – 18:00 (توقيت السعودية)",
    },
  },
  markets: [
    { id: "sa", name: { en: "Saudi Arabia", ar: "السعودية" }, status: { en: "Primary market", ar: "السوق الأساسي" } },
    { id: "gcc", name: { en: "GCC", ar: "دول الخليج" }, status: { en: "Regional focus", ar: "تركيز إقليمي" } },
    { id: "intl", name: { en: "International", ar: "دولي" }, status: { en: "Buyer & supplier connectivity", ar: "ربط المشترين والموردين" } },
  ],
} as const;
