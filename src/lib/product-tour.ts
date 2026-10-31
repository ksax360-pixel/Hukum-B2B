const STORAGE = "kt.productTour";
const REPLAY = "kt.productTour.replay";

export type TourUser = { id?: string; email?: string };

export type TourStep = {
  id: string;
  target?: string;
  title: string;
  description: string;
  placement?: "bottom" | "top" | "right" | "left";
  primaryLabel?: string;
  hideBack?: boolean;
  hideSkip?: boolean;
  isComplete?: boolean;
};

function userKey(user?: TourUser | null) {
  return String(user?.email || user?.id || "guest").toLowerCase();
}

function readAll(): Record<string, Record<string, unknown>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || "{}") as Record<string, Record<string, unknown>>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, Record<string, unknown>>) {
  localStorage.setItem(STORAGE, JSON.stringify(all));
}

export function getTourState(user?: TourUser | null) {
  const record = readAll()[userKey(user)] || {};
  return {
    onboarding_started: Boolean(record.onboarding_started),
    onboarding_completed: Boolean(record.onboarding_completed),
    onboarding_skipped: Boolean(record.onboarding_skipped),
    current_step: Number.isFinite(record.current_step) ? Number(record.current_step) : 0,
  };
}

export function saveTourState(user: TourUser | null | undefined, patch: Record<string, unknown>) {
  const key = userKey(user);
  const all = readAll();
  all[key] = { ...getTourState(user), ...all[key], ...patch, updatedAt: new Date().toISOString() };
  writeAll(all);
}

export function shouldAutoStartTour(user?: TourUser | null) {
  const state = getTourState(user);
  return !state.onboarding_completed && !state.onboarding_skipped;
}

export function markTourCompleted(user?: TourUser | null) {
  saveTourState(user, { onboarding_completed: true, onboarding_skipped: false, onboarding_started: true });
}

export function markTourSkipped(user?: TourUser | null) {
  saveTourState(user, { onboarding_skipped: true, onboarding_started: true });
}

export function resetTour(user?: TourUser | null) {
  saveTourState(user, {
    onboarding_started: true,
    onboarding_completed: false,
    onboarding_skipped: false,
    current_step: 0,
  });
}

export function requestTourReplay() {
  sessionStorage.setItem(REPLAY, "1");
}

export function consumeTourReplay() {
  const pending = sessionStorage.getItem(REPLAY) === "1";
  if (pending) sessionStorage.removeItem(REPLAY);
  return pending;
}

export function getTourTarget(key: string) {
  return document.querySelector(`[data-onboarding="${key}"]`) as HTMLElement | null;
}

export function getWorkspaceTourSteps(role: "buyer" | "vendor" | "admin", locale = "en"): TourStep[] {
  const ar = locale === "ar";
  if (role === "vendor") {
    return [
      {
        id: "welcome",
        target: "dashboard",
        title: ar ? "مرحباً بك في مساحة المورد" : "Welcome to your vendor workspace",
        description: ar
          ? "هذه لوحة التحكم. تابع الكتالوج وطلبات الأسعار وصفحتك العامة من هنا."
          : "This is your control panel. Track catalogue health, RFQs, and your public Hukum page from here.",
        placement: "bottom",
        primaryLabel: ar ? "لنبدأ" : "Let’s go",
        hideBack: true,
      },
      {
        id: "nav",
        target: "navigation",
        title: ar ? "القائمة الجانبية الثابتة" : "Sticky sidebar",
        description: ar ? "تنتقل بين الشركة والمنتجات والطلبات والتحليلات. القائمة تبقى معك." : "Jump between company, products, RFQs, and analytics. The menu stays with you as you move around.",
        placement: "right",
      },
      {
        id: "metrics",
        target: "dashboard-metrics",
        title: ar ? "المؤشرات" : "Live metrics",
        description: ar ? "تعرض هذه البطاقات المنتجات المنشورة وزيارات الموقع والتواصل واكتمال الملف." : "These cards show published products, website views, contact actions, and profile completeness.",
        placement: "bottom",
      },
      {
        id: "products",
        target: "products",
        title: ar ? "أضف منتجات" : "Add products",
        description: ar ? "انشر قوائم حتى يجدك المشترون. ابدأ بمنتجات مكتملة ثم وسّع الكتالوج." : "Publish listings so buyers can find you. Start with a few complete products, then grow the catalogue.",
        placement: "right",
      },
      {
        id: "analytics",
        target: "analytics",
        title: ar ? "التحليلات" : "Analytics",
        description: ar ? "اعرف كيف يكتشف المشترون متجرك وأي القوائم تجذب الانتباه." : "See how buyers discover your storefront and which listings attract the most attention.",
        placement: "right",
      },
      {
        id: "help",
        target: "help",
        title: ar ? "تحتاج مراجعة؟" : "Need a recap?",
        description: ar ? "أعد الجولة من قائمة الحساب أو من زر جولة المنتج. أنت جاهز للبيع." : "Replay this tour anytime from Need help. You’re ready to start selling on Hukum.",
        placement: "top",
        primaryLabel: ar ? "ابدأ" : "Get started",
        isComplete: true,
        hideSkip: true,
      },
    ];
  }
  if (role === "buyer") {
    return [
      {
        id: "welcome",
        target: "dashboard",
        title: ar ? "مرحباً بك في مساحة المشتري" : "Welcome to your buyer workspace",
        description: ar ? "تابع التوريد والعروض والموردين المحفوظين في مكان واحد." : "Track sourcing, quotations, and saved suppliers in one place. We’ll show you the essentials.",
        placement: "bottom",
        primaryLabel: ar ? "لنبدأ" : "Let’s go",
        hideBack: true,
      },
      {
        id: "nav",
        target: "navigation",
        title: ar ? "قائمتك ثابتة" : "Your menu stays put",
        description: ar ? "القائمة الجانبية متاحة دائماً لطلبات الأسعار والعروض والمحفوظات والرسائل." : "The sidebar is always available. Use it to open RFQs, quotations, saved items, and messages.",
        placement: "right",
      },
      {
        id: "metrics",
        target: "dashboard-metrics",
        title: ar ? "ملخص التوريد" : "Sourcing snapshot",
        description: ar ? "راقب الطلبات النشطة والعروض الواردة والمنتجات المحفوظة والمحادثات." : "Watch active RFQs, incoming quotations, saved products, and conversations at a glance.",
        placement: "bottom",
      },
      {
        id: "rfqs",
        target: "rfqs",
        title: ar ? "أنشئ طلب سعر" : "Create RFQs",
        description: ar ? "أخبر الموردين بما تحتاجه. يردّون بعروض تقارنها هنا." : "Tell suppliers what you need. Vendors reply with quotations you can compare here.",
        placement: "right",
      },
      {
        id: "help",
        target: "help",
        title: ar ? "أنت جاهز" : "You’re set",
        description: ar ? "أعد هذه الجولة من قائمة الحساب متى انضم زميل جديد." : "Replay this walkthrough from Need help whenever a new teammate joins.",
        placement: "top",
        primaryLabel: ar ? "ابدأ" : "Get started",
        isComplete: true,
        hideSkip: true,
      },
    ];
  }
  return [
    {
      id: "welcome",
      target: "dashboard",
      title: ar ? "لوحة تحكم المشرف" : "Admin control panel",
      description: ar ? "راقب صحة السوق والموردين والمنتجات والتذاكر وتحسين الظهور." : "Monitor marketplace health, vendors, products, tickets, and SEO from this workspace.",
      placement: "bottom",
      primaryLabel: ar ? "لنبدأ" : "Let’s go",
      hideBack: true,
    },
    {
      id: "nav",
      target: "navigation",
      title: ar ? "القائمة الجانبية الثابتة" : "Sticky sidebar",
      description: ar ? "تبقى لوحة التحكم مثبتة أثناء تنقلك بين الصفحات." : "The control panel stays pinned as you move between pages.",
      placement: "right",
    },
    {
      id: "metrics",
      target: "dashboard-metrics",
      title: ar ? "مؤشرات السوق" : "Marketplace metrics",
      description: ar ? "تابع الموردين والمنتجات وطلبات الأسعار والمشترين بنظرة واحدة." : "These cards track vendors, products, RFQs, and buyers at a glance.",
      placement: "bottom",
    },
    {
      id: "help",
      target: "help",
      title: ar ? "تحتاج مراجعة؟" : "Need a recap?",
      description: ar ? "أعد الجولة من زر جولة المنتج، أو ارفع تذكرة من قائمة الحساب." : "Replay this tour from Product tour in the sidebar, or raise a ticket from your account menu.",
      placement: "top",
      primaryLabel: ar ? "ابدأ" : "Get started",
      isComplete: true,
      hideSkip: true,
    },
  ];
}

