/**
 * Smoke: Free / Gold / Premium matrix + partner services.
 * Run: npx tsx scripts/smoke-monetisation.ts
 */
import { SUPPLIER_PLANS, getPlan, planChargeSar } from "../src/modules/monetisation/plans";
import { PARTNER_SERVICES } from "../src/modules/monetisation/partner-services";
import { canUse } from "../src/modules/monetisation/entitlements";
import { getPaymentProvider } from "../src/modules/payments/provider";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("=== Monetisation smoke ===");

  assert(SUPPLIER_PLANS.length === 3, "3 plans");
  assert(planChargeSar("free") === 0, "free 0");
  assert(planChargeSar("gold") === 368, "gold 368");
  assert(planChargeSar("premium") === 4000, "premium 4000");
  assert(getPlan("gold").vatIncluded === false, "gold +VAT");
  assert(getPlan("premium").vatIncluded === true, "premium incl VAT");
  console.log("OK prices Free=0 Gold=368 Premium=4000");

  const free = getPlan("free").entitlements;
  const gold = getPlan("gold").entitlements;
  const premium = getPlan("premium").entitlements;
  assert(!canUse(free, "aiCatalogue") && canUse(gold, "aiCatalogue"), "AI catalogue Gold+");
  assert(!canUse(gold, "customDomain") && canUse(premium, "customDomain"), "domain Premium");
  assert(!canUse(gold, "demandRadar") && canUse(premium, "demandRadar"), "radar Premium");
  assert(gold.matchedLeadsPerMonth === 40 && premium.matchedLeadsPerMonth === 200, "lead quotas");
  console.log("OK entitlements matrix");

  assert(PARTNER_SERVICES.length === 6, "6 partner services");
  assert(PARTNER_SERVICES.every((s) => s.horizon === "2029+"), "2029+");
  console.log("OK partner services", PARTNER_SERVICES.map((s) => s.key).join(", "));

  const provider = getPaymentProvider();
  assert(provider.isConfigured(), "demo payment configured");
  const co = await provider.createCheckout({
    amount: 368,
    currency: "SAR",
    customerId: "smoke",
    meta: { plan: "gold" },
  });
  assert(co.status === "paid" && co.providerRef, "demo checkout paid");
  console.log("OK payment provider", provider.name, co.providerRef);

  console.log("=== Monetisation smoke passed ===");
  console.log("UI: /dashboard/pricing · /dashboard/billing · /dashboard/partner-services");
  console.log("API: GET/POST /api/monetisation");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
