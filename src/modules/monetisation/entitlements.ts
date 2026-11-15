import { connectDB } from "@/lib/db";
import { Vendor } from "@/modules/vendors/vendor.model";
import { SubscriptionPlan } from "@/modules/platform/platform.model";
import { getPlan, type PlanDefinition, type PlanEntitlements, type PlanKey } from "./plans";

export type VendorPlanContext = {
  vendorId: string;
  planKey: PlanKey;
  plan: PlanDefinition;
  entitlements: PlanEntitlements;
  subscriptionPlanId?: string;
  renewsAt?: string;
  status: "active" | "trialing" | "past_due" | "none";
};

function keyFromVendor(vendor: {
  subscriptionPlanKey?: string;
  plan?: string;
  subscriptionPlan?: string;
  subscriptionPlanId?: { key?: string } | unknown;
}): PlanKey {
  const direct = String(
    vendor.subscriptionPlanKey || vendor.plan || vendor.subscriptionPlan || ""
  ).toLowerCase();
  if (direct === "gold" || direct === "premium" || direct === "free") return direct;
  const populated = vendor.subscriptionPlanId as { key?: string } | null;
  if (populated && typeof populated === "object" && populated.key) {
    const k = String(populated.key).toLowerCase();
    if (k === "gold" || k === "premium" || k === "free") return k;
    if (k === "professional" || k === "enterprise") return "premium";
    if (k === "basic" || k === "starter" || k === "growth") return "gold";
  }
  return "free";
}

export async function resolveVendorPlan(vendorId: string | null | undefined): Promise<VendorPlanContext | null> {
  if (!vendorId) return null;
  await connectDB();
  const vendor = await Vendor.findById(vendorId)
    .select("subscriptionPlanId subscriptionPlanKey plan subscription")
    .populate("subscriptionPlanId", "key")
    .lean();
  if (!vendor) return null;
  const planKey = keyFromVendor(vendor as never);
  const plan = getPlan(planKey);
  const sub = (vendor as { subscription?: { renewsAt?: Date; status?: string } }).subscription;
  return {
    vendorId: String(vendorId),
    planKey,
    plan,
    entitlements: plan.entitlements,
    subscriptionPlanId: vendor.subscriptionPlanId
      ? String((vendor.subscriptionPlanId as { _id?: unknown })._id || vendor.subscriptionPlanId)
      : undefined,
    renewsAt: sub?.renewsAt ? new Date(sub.renewsAt).toISOString() : undefined,
    status: (sub?.status as VendorPlanContext["status"]) || (planKey === "free" ? "none" : "active"),
  };
}

export function canUse(entitlements: PlanEntitlements, feature: keyof PlanEntitlements | string): boolean {
  switch (feature) {
    case "aiCatalogue":
    case "ai_catalogue":
      return entitlements.aiCatalogue;
    case "customDomain":
    case "custom_domain":
      return entitlements.customDomain;
    case "demandRadar":
    case "demand_radar":
      return entitlements.demandRadar;
    case "viewersConsent":
    case "viewers":
      return entitlements.viewersConsent;
    case "erpIntegration":
    case "erp":
      return entitlements.erpIntegration;
    case "fullCrm":
    case "crm":
      return entitlements.crm === "full" || entitlements.crm === "full_team";
    case "analyticsBenchmarks":
      return entitlements.analytics === "benchmarks" || entitlements.analytics === "full";
    case "analyticsFull":
      return entitlements.analytics === "full";
    case "priorityLeads":
      return entitlements.priorityLabelled;
    default:
      return Boolean((entitlements as Record<string, unknown>)[feature]);
  }
}

export async function assertEntitlement(
  vendorId: string | null | undefined,
  feature: string
): Promise<VendorPlanContext> {
  const ctx = await resolveVendorPlan(vendorId);
  if (!ctx) {
    throw Object.assign(new Error("Vendor required"), { status: 403 });
  }
  if (!canUse(ctx.entitlements, feature)) {
    throw Object.assign(
      new Error(`Upgrade required: ${feature} is available on a higher plan (current: ${ctx.planKey})`),
      { status: 402, planKey: ctx.planKey, feature }
    );
  }
  return ctx;
}

/** Block product create when vendor is at plan productLimit. Admins bypass. */
export async function assertProductQuota(vendorId: string | null | undefined) {
  const ctx = await resolveVendorPlan(vendorId);
  if (!ctx) {
    throw Object.assign(new Error("Vendor required"), { status: 403 });
  }
  const { Product } = await import("@/modules/products/product.model");
  const used = await Product.countDocuments({
    vendorId: ctx.vendorId,
    status: { $nin: ["archived", "deleted"] },
  });
  const limit = ctx.entitlements.productLimit;
  if (used >= limit) {
    throw Object.assign(
      new Error(
        `Product limit reached (${used}/${limit} on ${ctx.planKey}). Upgrade to Free/Gold/Premium for a higher catalogue cap.`
      ),
      { status: 402, planKey: ctx.planKey, feature: "productLimit", used, limit }
    );
  }
  return { ...ctx, used, limit, remaining: Math.max(0, limit - used) };
}

/** Whether this vendor can receive another matched RFQ invite this calendar month. */
export async function canAcceptMatchedLead(vendorId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  planKey: PlanKey;
}> {
  const ctx = await resolveVendorPlan(vendorId);
  if (!ctx) return { allowed: false, used: 0, limit: 0, planKey: "free" };
  const { RFQVendor } = await import("@/modules/rfqs/rfq.model");
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const used = await RFQVendor.countDocuments({
    vendorId,
    createdAt: { $gte: start },
  });
  const limit = ctx.entitlements.matchedLeadsPerMonth;
  return {
    allowed: used < limit,
    used,
    limit,
    planKey: ctx.planKey,
  };
}

/** Activate / change plan on vendor + return plan doc. */
export async function assignVendorPlan(opts: {
  vendorId: string;
  planKey: PlanKey;
  paymentId?: string;
  months?: number;
}) {
  await connectDB();
  const { ensureSupplierPlans, getPlan: gp } = await import("./plans");
  await ensureSupplierPlans();
  const planDef = gp(opts.planKey);
  const planDoc = await SubscriptionPlan.findOne({ key: opts.planKey });
  const months = Math.max(1, opts.months || 1);
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + months);

  const vendor = await Vendor.findByIdAndUpdate(
    opts.vendorId,
    {
      $set: {
        subscriptionPlanId: planDoc?._id,
        subscriptionPlanKey: opts.planKey,
        plan: opts.planKey,
        subscription: {
          planKey: opts.planKey,
          status: opts.planKey === "free" ? "none" : "active",
          renewsAt,
          amount: planDef.chargeSar,
          currency: "SAR",
          invoiceId: opts.paymentId ? `INV-${opts.paymentId.slice(-8)}` : undefined,
          vatIncluded: planDef.vatIncluded,
        },
      },
    },
    { new: true }
  );
  return { vendor, planDef, planDoc, renewsAt };
}
