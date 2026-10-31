/**
 * Hukum Revenue — committed subscription model: Free / Gold / Premium.
 * Partner services (2029+) are upside and stay out of the base plan.
 */

export type PlanKey = "free" | "gold" | "premium";

export type PlanEntitlements = {
  storefront: boolean;
  aiCatalogue: boolean;
  customDomain: boolean;
  leadsMode: "standard" | "guaranteed" | "highest";
  matchedLeadsPerMonth: number;
  priorityLabelled: boolean;
  dedicatedManager: boolean;
  crm: "basic_inbox" | "full" | "full_team";
  teamSeats: number;
  analytics: "views" | "benchmarks" | "full";
  viewersConsent: boolean;
  demandRadar: boolean;
  support: "help_centre" | "priority" | "dedicated_rm";
  erpIntegration: boolean;
  productLimit: number;
  aiUploads: number;
};

export type PlanDefinition = {
  key: PlanKey;
  name: { en: string; ar: string };
  /** List price before VAT (Premium is VAT-inclusive list). */
  priceSar: number;
  /** What buyer/seller is charged monthly (incl. VAT where applicable). */
  chargeSar: number;
  vatIncluded: boolean;
  vatRate: number;
  currency: "SAR";
  billingPeriod: "monthly";
  blurb: { en: string; ar: string };
  matrix: {
    storefront: string;
    leads: string;
    crm: string;
    analytics: string;
    support: string;
  };
  entitlements: PlanEntitlements;
};

const VAT = 0.15;

export const SUPPLIER_PLANS: PlanDefinition[] = [
  {
    key: "free",
    name: { en: "Free", ar: "مجاني" },
    priceSar: 0,
    chargeSar: 0,
    vatIncluded: true,
    vatRate: VAT,
    currency: "SAR",
    billingPeriod: "monthly",
    blurb: {
      en: "Verified storefront, organised leads, and basic inbox.",
      ar: "واجهة موثّقة، عملاء منظمون، وصندوق أساسي.",
    },
    matrix: {
      storefront: "Yes",
      leads: "Standard matching",
      crm: "Basic inbox",
      analytics: "Views",
      support: "Help centre",
    },
    entitlements: {
      storefront: true,
      aiCatalogue: false,
      customDomain: false,
      leadsMode: "standard",
      matchedLeadsPerMonth: 5,
      priorityLabelled: false,
      dedicatedManager: false,
      crm: "basic_inbox",
      teamSeats: 1,
      analytics: "views",
      viewersConsent: false,
      demandRadar: false,
      support: "help_centre",
      erpIntegration: false,
      productLimit: 50,
      aiUploads: 5,
    },
  },
  {
    key: "gold",
    name: { en: "Gold", ar: "ذهبي" },
    priceSar: 320,
    chargeSar: Math.round(320 * (1 + VAT)), // 368
    vatIncluded: false,
    vatRate: VAT,
    currency: "SAR",
    billingPeriod: "monthly",
    blurb: {
      en: "AI catalogue, guaranteed matched leads, full CRM, priority support.",
      ar: "كتالوج ذكي، عملاء مضمونون، CRM كامل، ودعم أولوية.",
    },
    matrix: {
      storefront: "Yes + AI catalogue builder",
      leads: "Guaranteed matched leads / month + priority (labelled)",
      crm: "Full CRM",
      analytics: "Views, reveals, response benchmarks",
      support: "Priority",
    },
    entitlements: {
      storefront: true,
      aiCatalogue: true,
      customDomain: false,
      leadsMode: "guaranteed",
      matchedLeadsPerMonth: 40,
      priorityLabelled: true,
      dedicatedManager: false,
      crm: "full",
      teamSeats: 3,
      analytics: "benchmarks",
      viewersConsent: false,
      demandRadar: false,
      support: "priority",
      erpIntegration: false,
      productLimit: 500,
      aiUploads: 100,
    },
  },
  {
    key: "premium",
    name: { en: "Premium", ar: "مميز" },
    priceSar: 4000,
    chargeSar: 4000, // incl. VAT
    vatIncluded: true,
    vatRate: VAT,
    currency: "SAR",
    billingPeriod: "monthly",
    blurb: {
      en: "Custom domain, highest lead allocation, demand radar, dedicated RM + ERP.",
      ar: "نطاق مخصص، أعلى تخصيص عملاء، رادار طلب، مدير علاقات وتكامل ERP.",
    },
    matrix: {
      storefront: "Yes + custom domain",
      leads: "Highest allocation + dedicated manager",
      crm: "Full CRM + team seats",
      analytics: "Plus companies that viewed you, demand radar",
      support: "Dedicated relationship manager, ERP integration",
    },
    entitlements: {
      storefront: true,
      aiCatalogue: true,
      customDomain: true,
      leadsMode: "highest",
      matchedLeadsPerMonth: 200,
      priorityLabelled: true,
      dedicatedManager: true,
      crm: "full_team",
      teamSeats: 15,
      analytics: "full",
      viewersConsent: true,
      demandRadar: true,
      support: "dedicated_rm",
      erpIntegration: true,
      productLimit: 5000,
      aiUploads: 1000,
    },
  },
];

export function getPlan(key: string | null | undefined): PlanDefinition {
  const k = String(key || "free").toLowerCase() as PlanKey;
  return SUPPLIER_PLANS.find((p) => p.key === k) || SUPPLIER_PLANS[0];
}

export function planChargeSar(key: string) {
  return getPlan(key).chargeSar;
}

/** Map DB SubscriptionPlan.features for seed/upsert. */
export function planToDbFeatures(plan: PlanDefinition) {
  return {
    productLimit: plan.entitlements.productLimit,
    aiUploads: plan.entitlements.aiUploads,
    rfqs: plan.entitlements.matchedLeadsPerMonth,
    leads: plan.entitlements.matchedLeadsPerMonth,
    analytics: plan.entitlements.analytics !== "views",
    featuredListings: plan.key !== "free",
    microsite: plan.entitlements.storefront,
    verification: true,
    teamMembers: plan.entitlements.teamSeats,
    // Extended entitlements (stored alongside classic fields)
    entitlements: plan.entitlements,
    matrix: plan.matrix,
    chargeSar: plan.chargeSar,
    priceSar: plan.priceSar,
    vatIncluded: plan.vatIncluded,
    vatRate: plan.vatRate,
  };
}

export async function ensureSupplierPlans() {
  const { SubscriptionPlan } = await import("@/modules/platform/platform.model");
  const { connectDB } = await import("@/lib/db");
  await connectDB();
  const out = [];
  for (const plan of SUPPLIER_PLANS) {
    const doc = await SubscriptionPlan.findOneAndUpdate(
      { key: plan.key },
      {
        key: plan.key,
        name: plan.name,
        price: plan.chargeSar,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        features: planToDbFeatures(plan),
        status: "active",
      },
      { upsert: true, new: true }
    );
    out.push(doc);
  }
  // Retire legacy seed keys from active catalogue (keep docs if present)
  await SubscriptionPlan.updateMany(
    { key: { $in: ["basic", "professional", "enterprise", "starter", "growth"] } },
    { $set: { status: "inactive" } }
  );
  return out;
}
