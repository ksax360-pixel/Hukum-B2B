/**
 * Smoke: risk-register controls.
 * Run: npx tsx scripts/smoke-risk-register.ts
 */
import { evaluateContactGate, bumpRevealCount, hashPhone } from "../src/modules/risk/contact-gate";
import { assertPublishableProduct, scanRestrictedText } from "../src/modules/risk/restricted-goods";
import { checkOtpRateLimit, shouldExposeDemoOtp } from "../src/modules/risk/otp-limiter";
import { estimateWaCostUsd, checkWaCostCap } from "../src/modules/risk/wa-cost";
import { RISK_REGISTER } from "../src/lib/risk-register";
import { assertGroundedProducts, rotateFeatured } from "../src/modules/ai/hukum/guardrails";
import { isVendorVerifiedBadge } from "../src/modules/risk/live-counts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("=== Risk register smoke ===");

  assert(RISK_REGISTER.length >= 12, "register rows");
  assert(RISK_REGISTER.filter((f) => f.severity === "critical").every((f) => f.status !== "planned"), "critical addressed");
  console.log("OK register", RISK_REGISTER.length, "findings");

  // C1: PDPL alone must NOT unlock
  const blocked = evaluateContactGate({ pdplConsent: true, phoneVerified: false });
  assert(!blocked.allowed, "PDPL alone blocked");
  const okSession = evaluateContactGate({ userId: "u1", pdplConsent: true });
  assert(okSession.allowed, "signed-in allowed");
  const okOtp = evaluateContactGate({ phoneVerified: true, pdplConsent: true });
  assert(okOtp.allowed, "OTP+PDPL allowed");
  const sess: { revealDayKey?: string; revealCountToday?: number } = {};
  bumpRevealCount(sess, okOtp.dayKey, 3);
  bumpRevealCount(sess, okOtp.dayKey, 2);
  assert(sess.revealCountToday === 5, "reveal counter accumulates");
  assert(hashPhone("+966500000000")?.length === 16, "phone hash");
  console.log("OK contact gate");

  // H3 regulated
  assert(scanRestrictedText("chemical weapon kit").hit, "weapons hit");
  assert(!assertPublishableProduct({ name: "firearm ammo" }).ok, "block weapons");
  assert(
    !assertPublishableProduct({ name: "prescription drug pack" }).ok,
    "pharma needs license"
  );
  assert(
    assertPublishableProduct({ name: "prescription drug pack", licenseNumber: "SFDA-1" }).ok,
    "pharma with license"
  );
  console.log("OK restricted goods");

  // H2 featured rotation
  const items = assertGroundedProducts([
    {
      productId: "1",
      name: "A",
      slug: "a",
      href: "/p/a",
      priceLabel: "SAR 10",
      score: 5,
      paidPriority: true,
    },
    {
      productId: "2",
      name: "B",
      slug: "b",
      href: "/p/b",
      priceLabel: "invented xyz",
      score: 4,
      paidPriority: false,
    },
  ]);
  assert(items[1].priceLabel === "Price on request", "ungrounded price stripped");
  const rot = rotateFeatured([
    { paidPriority: true, score: 1 },
    { paidPriority: true, score: 1 },
    { paidPriority: false, score: 1 },
  ]);
  assert(rot.length === 3, "rotate length");
  console.log("OK AI grounding + featured");

  // C3 badges
  assert(!isVendorVerifiedBadge({ verificationStatus: "pending" }), "no fake verified");
  assert(isVendorVerifiedBadge({ verificationStatus: "verified" }), "real verified");
  console.log("OK verified badge rule");

  // M2 OTP limiter
  const r1 = checkOtpRateLimit({ phone: "966511122233", purpose: "smoke", ip: "1.2.3.4" });
  assert(r1.ok, "otp first ok");
  console.log("OK otp limiter · demoOtp expose=", shouldExposeDemoOtp());

  // H5 WA cost
  assert(estimateWaCostUsd("template") > estimateWaCostUsd("freeform"), "template costlier");
  assert(checkWaCostCap(0).ok, "wa cap open");
  console.log("OK WA cost estimates");

  console.log("=== Risk register smoke passed ===");
  console.log("Admin UI: /admin/risk");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
