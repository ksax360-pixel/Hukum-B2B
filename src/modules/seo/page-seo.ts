import type { Locale } from "@/i18n/config";

export type PageSeoCopy = {
  title: { en: string; ar: string };
  description: { en: string; ar: string };
};

/** Unique buyer-facing titles (≈50–60) and descriptions (≈140–160) per locale. */
export const PAGE_SEO: Record<string, PageSeoCopy> = {
  home: {
    title: {
      en: "Find verified suppliers in Saudi Arabia",
      ar: "اعثر على موردين موثوقين في السعودية",
    },
    description: {
      en: "Hukum is Saudi Arabia’s B2B marketplace. Search verified suppliers, send one request and compare free quotations.",
      ar: "حكم سوق B2B في السعودية. ابحث عن موردين موثوقين، أرسل طلباً واحداً وقارن عروض الأسعار مجاناً.",
    },
  },
  categories: {
    title: {
      en: "Browse 49 B2B categories in Saudi Arabia",
      ar: "تصفّح ٤٩ تصنيفاً للأعمال في السعودية",
    },
    description: {
      en: "Explore 49 sectors on Hukum—from safety equipment to cold chain—and find verified Saudi suppliers fast.",
      ar: "استكشف ٤٩ قطاعاً على حكم—من معدات السلامة إلى سلسلة التبريد—واعثر على موردين سعوديين موثوقين بسرعة.",
    },
  },
  vendors: {
    title: {
      en: "Verified vendors & manufacturers | Hukum",
      ar: "موردون ومصانع موثّقون | حكم",
    },
    description: {
      en: "Discover CR-checked manufacturers, distributors and wholesalers across Saudi Arabia on Hukum.",
      ar: "اكتشف مصانع وموزّعين وتجار جملة مفحوصي السجل التجاري عبر المملكة على حكم.",
    },
  },
  products: {
    title: {
      en: "B2B products from Saudi suppliers | Hukum",
      ar: "منتجات B2B من موردين سعوديين | حكم",
    },
    description: {
      en: "Search industrial and commercial products, filter by sector and request quotes from verified vendors.",
      ar: "ابحث عن منتجات صناعية وتجارية، صفّ حسب القطاع واطلب عروض أسعار من موردين موثوقين.",
    },
  },
  "request-quotes": {
    title: {
      en: "Request quotes from verified vendors",
      ar: "اطلب عروض أسعار من موردين موثوقين",
    },
    description: {
      en: "Send one RFQ on Hukum and get comparable quotations from multiple verified Saudi suppliers—free.",
      ar: "أرسل طلب عرض سعر واحداً على حكم واحصل على عروض قابلة للمقارنة من عدة موردين سعوديين—مجاناً.",
    },
  },
  rfq: {
    title: {
      en: "Create a precise RFQ | Hukum",
      ar: "أنشئ طلب عرض سعر دقيقاً | حكم",
    },
    description: {
      en: "Define quantity, delivery and specs once. Hukum matches relevant verified suppliers to quote.",
      ar: "حدد الكمية والتسليم والمواصفات مرة واحدة. حكم يطابق الموردين الموثوقين المناسبين للتسعير.",
    },
  },
  "sourcing-help": {
    title: {
      en: "Get sourcing help & VIP Concierge",
      ar: "مساعدة التوريد وخدمة الكونسيرج VIP",
    },
    description: {
      en: "Choose RFQ, WhatsApp, BOQ upload or VIP Concierge to source products with Hukum’s team.",
      ar: "اختر طلب عرض سعر أو واتساب أو رفع جدول كميات أو كونسيرج VIP لتوريد منتجاتك مع فريق حكم.",
    },
  },
  "how-it-works": {
    title: {
      en: "How Hukum works for buyers",
      ar: "كيف يعمل حكم للمشترين",
    },
    description: {
      en: "Search, request quotes, compare and connect—see how Hukum helps Saudi buyers source smarter.",
      ar: "ابحث، اطلب عروضاً، قارن وتواصل—تعرّف كيف يساعد حكم المشترين السعوديين على توريد أذكى.",
    },
  },
  verification: {
    title: {
      en: "Supplier verification levels | Hukum",
      ar: "مستويات تحقق الموردين | حكم",
    },
    description: {
      en: "Understand Registered, CR checked and Verified badges—earned through Hukum checks, never bought.",
      ar: "افهم شارات مسجّل وفحص السجل التجاري وموثّق—تُكتسب عبر فحوصات حكم ولا تُشترى.",
    },
  },
  "become-a-vendor": {
    title: {
      en: "Become a supplier on Hukum",
      ar: "كن مورداً على حكم",
    },
    description: {
      en: "Join Hukum free through 2027. List your catalogue, get Founding Supplier status and receive buyer requests.",
      ar: "انضم إلى حكم مجاناً حتى ٢٠٢٧. أدرج كتالوجك، احصل على شارة المورد المؤسس واستقبل طلبات المشترين.",
    },
  },
  about: {
    title: {
      en: "About Hukum — Saudi B2B marketplace",
      ar: "عن حكم — سوق B2B سعودي",
    },
    description: {
      en: "Hukum connects buyers with verified suppliers and manufacturers across the Kingdom—bilingual and built for B2B.",
      ar: "حكم يربط المشترين بموردين ومصانع موثوقين عبر المملكة—ثنائي اللغة ومصمم للأعمال بين الشركات.",
    },
  },
  contact: {
    title: {
      en: "Contact Hukum sourcing & support",
      ar: "تواصل مع حكم للتوريد والدعم",
    },
    description: {
      en: "Reach Hukum for sourcing help, partnerships and supplier questions. Offices and channels listed here.",
      ar: "تواصل مع حكم لمساعدة التوريد والشراكات واستفسارات الموردين. القنوات والمكاتب موضّحة هنا.",
    },
  },
  faq: {
    title: {
      en: "FAQ — Hukum B2B marketplace",
      ar: "الأسئلة الشائعة — سوق حكم",
    },
    description: {
      en: "Answers on registration, RFQs, verification levels and bilingual use of the Hukum marketplace.",
      ar: "إجابات عن التسجيل وطلبات العروض ومستويات التحقق واستخدام سوق حكم بالعربية والإنجليزية.",
    },
  },
  help: {
    title: {
      en: "Help centre | Hukum",
      ar: "مركز المساعدة | حكم",
    },
    description: {
      en: "Guides for buyers and suppliers—RFQs, verification, sourcing help and how to get support on Hukum.",
      ar: "أدلة للمشترين والموردين—طلبات العروض والتحقق ومساعدة التوريد وكيفية الحصول على الدعم على حكم.",
    },
  },
  report: {
    title: {
      en: "Report a concern | Hukum",
      ar: "الإبلاغ عن مشكلة | حكم",
    },
    description: {
      en: "Report marketplace concerns safely. Hukum reviews reports to protect buyers and verified suppliers.",
      ar: "أبلغ عن مخاوف السوق بأمان. يراجع حكم البلاغات لحماية المشترين والموردين الموثوقين.",
    },
  },
  terms: {
    title: {
      en: "Terms of service | Hukum",
      ar: "شروط الاستخدام | حكم",
    },
    description: {
      en: "Read Hukum’s terms for buyers and suppliers using the Saudi B2B marketplace.",
      ar: "اطّلع على شروط حكم للمشترين والموردين عند استخدام سوق B2B السعودي.",
    },
  },
  privacy: {
    title: {
      en: "Privacy policy (PDPL) | Hukum",
      ar: "سياسة الخصوصية (PDPL) | حكم",
    },
    description: {
      en: "How Hukum collects and protects personal data under Saudi PDPL for buyers and vendors.",
      ar: "كيف يجمع حكم البيانات الشخصية ويحميها وفق نظام حماية البيانات الشخصية للمشترين والموردين.",
    },
  },
  "marketplace-rules": {
    title: {
      en: "Marketplace rules | Hukum",
      ar: "قواعد السوق | حكم",
    },
    description: {
      en: "Conduct rules for listing, quoting and contacting on Hukum’s verified B2B marketplace.",
      ar: "قواعد السلوك للإدراج والتسعير والتواصل على سوق حكم الموثّق للأعمال بين الشركات.",
    },
  },
  compare: {
    title: {
      en: "Compare products | Hukum",
      ar: "قارن المنتجات | حكم",
    },
    description: {
      en: "Compare B2B products side by side—specs, vendors and quote options—before you request prices.",
      ar: "قارن منتجات B2B جنباً إلى جنب—المواصفات والموردون وخيارات العرض—قبل طلب الأسعار.",
    },
  },
  industries: {
    title: {
      en: "Industries across Saudi Arabia | Hukum",
      ar: "قطاعات الأعمال في السعودية | حكم",
    },
    description: {
      en: "Explore Hukum industries from industrial and energy to IT and professional services.",
      ar: "استكشف قطاعات حكم من الصناعة والطاقة إلى تقنية المعلومات والخدمات المهنية.",
    },
  },
  blog: {
    title: {
      en: "Hukum blog — B2B sourcing insights",
      ar: "مدونة حكم — رؤى توريد B2B",
    },
    description: {
      en: "Practical articles on Saudi B2B sourcing, verification and procurement with Hukum.",
      ar: "مقالات عملية عن التوريد والتحقق والمشتريات بين الشركات في السعودية مع حكم.",
    },
  },
  "vendors-cities": {
    title: {
      en: "Vendors by city in Saudi Arabia",
      ar: "الموردون حسب المدينة في السعودية",
    },
    description: {
      en: "Find verified Hukum suppliers in Riyadh, Jeddah, Dammam and cities across the Kingdom.",
      ar: "اعثر على موردي حكم الموثوقين في الرياض وجدة والدمام ومدن المملكة.",
    },
  },
  "vendors-brands": {
    title: {
      en: "Brands & authorised distributors",
      ar: "العلامات والموزعون المعتمدون",
    },
    description: {
      en: "Locate authorised brand distributors and official partners listed on Hukum.",
      ar: "اعثر على موزّعي العلامات المعتمدين والشركاء الرسميين المدرجين على حكم.",
    },
  },
  "vendors-manufacturers": {
    title: {
      en: "Manufacturers on Hukum",
      ar: "المصانع على حكم",
    },
    description: {
      en: "Browse manufacturers who produce and supply directly—filter and request quotes on Hukum.",
      ar: "تصفّح المصانع التي تنتج وتورّد مباشرة—صفّ واطلب عروض أسعار على حكم.",
    },
  },
  "vendors-made-in-saudi": {
    title: {
      en: "Made in Saudi suppliers | Hukum",
      ar: "موردو صنع في السعودية | حكم",
    },
    description: {
      en: "Source locally made products and Saudi-based suppliers through Hukum’s marketplace.",
      ar: "ورّد منتجات محلية الصنع وموردين داخل المملكة عبر سوق حكم.",
    },
  },
  "upload-boq": {
    title: {
      en: "Upload a BOQ | Hukum",
      ar: "رفع جدول كميات | حكم",
    },
    description: {
      en: "Upload a bill of quantities or item list and turn it into a structured Hukum quote request.",
      ar: "ارفع جدول كميات أو قائمة أصناف وحوّله إلى طلب عرض سعر منظم على حكم.",
    },
  },
  login: {
    title: {
      en: "Sign in to Hukum",
      ar: "تسجيل الدخول إلى حكم",
    },
    description: {
      en: "Sign in to manage RFQs, quotations and messages on the Hukum B2B marketplace.",
      ar: "سجّل الدخول لإدارة طلبات العروض والعروض الواردة والرسائل على سوق حكم.",
    },
  },
  register: {
    title: {
      en: "Create a Hukum buyer account",
      ar: "إنشاء حساب مشترٍ على حكم",
    },
    description: {
      en: "Create your Hukum account to save products, send RFQs and compare supplier quotations.",
      ar: "أنشئ حسابك على حكم لحفظ المنتجات وإرسال طلبات العروض ومقارنة عروض الموردين.",
    },
  },
  "vendor-sign-in": {
    title: {
      en: "Vendor sign-in | Hukum",
      ar: "دخول المورد | حكم",
    },
    description: {
      en: "Sign in to your Hukum supplier account to manage catalogue, enquiries and quotations.",
      ar: "سجّل دخولك إلى حساب المورد على حكم لإدارة الكتالوج والاستفسارات وعروض الأسعار.",
    },
  },
};

export function seoFor(key: string, locale: Locale): { title: string; description: string } {
  const row = PAGE_SEO[key];
  if (!row) {
    return {
      title: locale === "ar" ? "حكم" : "Hukum",
      description:
        locale === "ar"
          ? "سوق حكم للأعمال بين الشركات في المملكة العربية السعودية."
          : "Hukum B2B marketplace for Saudi Arabia.",
    };
  }
  return {
    title: locale === "ar" ? row.title.ar : row.title.en,
    description: locale === "ar" ? row.description.ar : row.description.en,
  };
}

export function bilingualOg(key: string): { title: string; description: string } {
  const row = PAGE_SEO[key];
  if (!row) {
    return {
      title: "Hukum | حكم — Find verified suppliers in Saudi Arabia | ابحث عن موردين موثوقين في المملكة",
      description:
        "Send one request and get quotes from multiple verified vendors, free. | أرسل طلبًا واحدًا واحصل على عروض أسعار من عدة موردين موثوقين مجانًا.",
    };
  }
  return {
    title: `${row.title.en} | ${row.title.ar}`,
    description: `${row.description.en} | ${row.description.ar}`,
  };
}

export const DEFAULT_SHARE_IMAGE = "/og/hukum-share.jpg";
export const DEFAULT_OG_ALT = "Hukum — Connecting Saudi businesses | حكم — ربط الشركات السعودية";
