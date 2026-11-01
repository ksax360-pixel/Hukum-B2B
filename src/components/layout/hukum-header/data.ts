export type HeaderLocale = "en" | "ar";

export const SECTORS = [
  { slug: "construction", en: "Construction", ar: "البناء والتشييد", icon: "HardHat" },
  { slug: "industrial", en: "Industrial", ar: "الصناعي", icon: "Factory" },
  { slug: "safety-workwear", en: "Safety & workwear", ar: "السلامة وملابس العمل", icon: "Shield" },
  { slug: "fmcg-food", en: "FMCG & food", ar: "السلع الغذائية والاستهلاكية", icon: "ShoppingBasket" },
  { slug: "medical", en: "Medical", ar: "الطبي", icon: "HeartPulse" },
  { slug: "hospitality", en: "Hospitality", ar: "الضيافة", icon: "Hotel" },
  { slug: "services", en: "Services", ar: "الخدمات", icon: "Briefcase" },
] as const;

export const POPULAR_PRODUCTS = [
  { slug: "safety-helmet", en: "Safety helmet", ar: "خوذة سلامة", tone: "#E8F0EC" },
  { slug: "cement-bags", en: "Portland cement", ar: "أسمنت بورتلاند", tone: "#F0EBE3" },
  { slug: "work-gloves", en: "Work gloves", ar: "قفازات عمل", tone: "#E6EEF5" },
  { slug: "steel-pipe", en: "Steel pipe", ar: "أنابيب فولاذ", tone: "#F3E8E8" },
] as const;

export function t(locale: HeaderLocale, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export const NAV_LABELS = {
  categories: { en: "Categories", ar: "الفئات" },
  vendors: { en: "Vendors", ar: "الموردون" },
  sourcing: { en: "Get sourcing help", ar: "المساعدة في التوريد" },
  howItWorks: { en: "How it works", ar: "كيف يعمل حكم" },
  others: { en: "Others", ar: "المزيد" },
  requestQuotes: { en: "Request quotes", ar: "اطلب عروض الأسعار" },
  signIn: { en: "Sign in", ar: "تسجيل الدخول" },
  account: { en: "Account", ar: "حسابي" },
  viewAllCategories: { en: "View all categories (49)", ar: "عرض كل الفئات (49)" },
  popularWeek: { en: "Popular this week", ar: "الأشهر هذا الأسبوع" },
  searchVendors: {
    en: "Search vendors by name, product or city…",
    ar: "ابحث عن الموردين بالاسم أو المنتج أو المدينة…",
  },
  menu: { en: "Menu", ar: "القائمة" },
  close: { en: "Close", ar: "إغلاق" },
} as const;

export const VENDOR_ITEMS = [
  {
    href: "/vendors",
    en: "All vendors",
    ar: "كل الموردين",
    descEn: "Browse the full directory",
    descAr: "تصفح الدليل بالكامل",
    icon: "Building2",
  },
  {
    href: "/vendors?type=manufacturer",
    en: "Manufacturers",
    ar: "المصانع",
    descEn: "Factories and producers",
    descAr: "المصانع والمنتجون",
    icon: "Factory",
  },
  {
    href: "/vendors?type=distributor",
    en: "Distributors & wholesalers",
    ar: "الموزعون وتجار الجملة",
    descEn: "Wholesale partners",
    descAr: "شركاء الجملة",
    icon: "Truck",
  },
  {
    href: "/vendors/cities",
    en: "Vendors by city",
    ar: "الموردون حسب المدينة",
    descEn: "Riyadh, Jeddah, Dammam, Qassim…",
    descAr: "الرياض، جدة، الدمام، القصيم…",
    icon: "MapPin",
  },
  {
    href: "/vendors/brands",
    en: "Brands & authorised distributors",
    ar: "العلامات والموزعون المعتمدون",
    descEn: "Official brand partners",
    descAr: "شركاء العلامات الرسميون",
    icon: "BadgeCheck",
  },
  {
    href: "/vendors?origin=saudi",
    en: "Made in Saudi",
    ar: "صُنع في السعودية",
    descEn: "Locally manufactured",
    descAr: "تصنيع محلي",
    icon: "Flag",
  },
] as const;

export const SOURCING_ITEMS = [
  {
    href: "/request-quotes",
    en: "Request quotes",
    ar: "اطلب عروض أسعار",
    descEn: "One request, multiple vendors",
    descAr: "طلب واحد، عدة موردين",
    icon: "Send",
    external: false,
  },
  {
    href: "__whatsapp__",
    en: "Send your request on WhatsApp",
    ar: "أرسل طلبك عبر واتساب",
    descEn: "Message our sourcing team",
    descAr: "راسل فريق التوريد",
    icon: "MessageCircle",
    external: true,
  },
  {
    href: "/request-quotes?upload=boq",
    en: "Upload a BOQ or list",
    ar: "ارفع جدول كميات أو قائمة",
    descEn: "We'll read it for you",
    descAr: "سنقرأه نيابةً عنك",
    icon: "Upload",
    external: false,
  },
  {
    href: "/sourcing-help",
    en: "VIP Concierge",
    ar: "كونسيرج VIP",
    descEn: "We compare quotations for you",
    descAr: "نقارن العروض نيابةً عنك",
    icon: "Sparkles",
    external: false,
  },
] as const;

export const HOW_ITEMS = [
  {
    href: "/how-it-works",
    en: "For buyers",
    ar: "للمشترين",
    descEn: "Search, request, compare, connect",
    descAr: "ابحث، اطلب، قارن، تواصل",
    icon: "Users",
  },
  {
    href: "/verification",
    en: "Verification levels",
    ar: "مستويات التحقق",
    descEn: "Registered, CR checked, Verified",
    descAr: "مسجّل، تحقق السجل، موثّق",
    icon: "ShieldCheck",
  },
  {
    href: "/how-it-works#compare",
    en: "Comparing quotations",
    ar: "مقارنة العروض",
    descEn: "Side-by-side quote review",
    descAr: "مراجعة العروض جنباً إلى جنب",
    icon: "GitCompare",
  },
  {
    href: "/faq",
    en: "FAQ",
    ar: "الأسئلة الشائعة",
    descEn: "Common questions answered",
    descAr: "إجابات على الأسئلة الشائعة",
    icon: "HelpCircle",
  },
] as const;

export const OTHERS_ITEMS = [
  { href: "/become-a-vendor", en: "Become a vendor", ar: "كن مورداً", icon: "Store" },
  { href: "/vendor/sign-in", en: "Vendor sign in", ar: "دخول المورد", icon: "LogIn" },
  { href: "/about", en: "About us", ar: "من نحن", icon: "Info" },
  { href: "/contact", en: "Contact us", ar: "اتصل بنا", icon: "Mail" },
  { href: "/help", en: "Help centre", ar: "مركز المساعدة", icon: "LifeBuoy" },
  { href: "/report", en: "Report a concern", ar: "الإبلاغ عن مشكلة", icon: "Flag" },
] as const;

export const LEGAL_LINKS = [
  { href: "/terms", en: "Terms", ar: "الشروط" },
  { href: "/privacy", en: "Privacy", ar: "الخصوصية" },
  { href: "/marketplace-rules", en: "Marketplace rules", ar: "قواعد السوق" },
] as const;

export const HIGHLIGHT = {
  en: "Can't find it? We'll source it.",
  ar: "لم تجده؟ سنوفره لك.",
} as const;
