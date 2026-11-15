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
        title: ar ? "أهلاً في مساحة المورد" : "Welcome to your supplier workspace",
        description: ar
          ? "هنا توصلك طلبات المشترين وترسل عروضك. خذ دقيقة نوريك الأساسيات."
          : "Buyer requests reach you here and you send your quotes from here. One minute to show you the basics.",
        placement: "bottom",
        primaryLabel: ar ? "يلا" : "Show me",
        hideBack: true,
      },
      {
        id: "requests",
        target: "rfqs",
        title: ar ? "الطلبات أولاً" : "Requests come first",
        description: ar ? "كل طلب يطابق منتجاتك يوصل هنا. سعّر كل بند وأرسل. المشتري يقارن مدة التوريد والشروط مع السعر." : "Every request that matches what you sell lands here. Price each line and send. Buyers compare lead time and terms, not only price.",
        placement: "right",
      },
      {
        id: "products",
        target: "products",
        title: ar ? "منتجاتك تجيب الطلبات" : "Products bring requests",
        description: ar ? "الطلبات تُطابق حسب منتجاتك. أضف منتج، أو ارفع قائمة أسعارك كاملة من رفع الكتالوج." : "Requests are matched by what you list. Add a product, or upload your whole price list from Catalogue upload.",
        placement: "right",
      },
      {
        id: "storefront",
        target: "company",
        title: ar ? "صفحتك موقع لشركتك" : "Your page is your company website",
        description: ar ? "أضف شعارك وغلافك ولونك. وثّق حسابك لتحصل العلامة الخضراء." : "Add your logo, cover and colour. Get verified for the green tick.",
        placement: "right",
      },
      {
        id: "help",
        target: "help",
        title: ar ? "جاهز" : "You're set",
        description: ar ? "تقدر تعيد الجولة من هنا، وتراسلنا من المساعدة في أي وقت." : "Replay this tour from here, and write to us from Help any time.",
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
      title: ar ? "هذا يومك" : "This is Today",
      description: ar ? "كل شي يحتاج شخص يظهر هنا، الأقدم أولاً. اشتغل من فوق لتحت." : "Everything that needs a person shows here, oldest first. Work down the list.",
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
      description: ar ? "أرقام آخر ٧ أيام مقارنة بالأسبوع اللي قبله." : "The last 7 days against the week before.",
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

