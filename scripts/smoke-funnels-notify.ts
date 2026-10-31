/**
 * Smoke: funnel constants + notification matrix + dispatch stub.
 * Run: npx tsx scripts/smoke-funnels-notify.ts
 */
import { BUYER_FUNNEL_STEPS, SUPPLIER_FUNNEL_STEPS, FUNNEL_EVENTS } from "../src/lib/funnel-events";
import { NOTIFICATION_MATRIX, fillTemplate, getMatrixRow } from "../src/modules/notifications/matrix";
import { sendEmail } from "../src/lib/email";
import { sendSms } from "../src/lib/sms";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("=== Funnels & notifications smoke ===");

  assert(BUYER_FUNNEL_STEPS.length === 7, "buyer funnel 7 steps");
  assert(SUPPLIER_FUNNEL_STEPS.length === 7, "supplier funnel 7 steps");
  assert(FUNNEL_EVENTS.landing_view === "landing_view", "landing_view");
  assert(FUNNEL_EVENTS.deal_confirmed === "deal_confirmed", "deal_confirmed");
  assert(FUNNEL_EVENTS.subscription_activated === "subscription_activated", "subscription");
  console.log("OK funnel constants", Object.keys(FUNNEL_EVENTS).length, "events");

  assert(NOTIFICATION_MATRIX.length >= 12, "matrix rows");
  const welcome = getMatrixRow("buyer_signup_welcome");
  assert(welcome.channels.includes("email") && welcome.channels.includes("whatsapp"), "welcome channels");
  const otp = getMatrixRow("otp");
  assert(otp.channels.includes("sms"), "otp sms");
  const filled = fillTemplate(welcome.bodyTemplate.en, { name: " Ali" });
  assert(filled.includes("Ali"), "template fill");
  console.log("OK notification matrix", NOTIFICATION_MATRIX.length, "triggers");

  const email = await sendEmail({
    to: "smoke@hukum.local",
    subject: "Smoke",
    text: "Hello from Hukum notify smoke",
  });
  assert(email.id, "email stub id");
  const sms = await sendSms({ to: "+966500000000", body: "Your Hukum code is 123456.", purpose: "otp" });
  assert(sms.id, "sms stub id");
  console.log("OK email mode=", email.mode, "sms mode=", sms.mode);

  console.log("=== All funnels/notify smoke checks passed ===");
  console.log("UI: /buyer/notifications · /admin/measurement");
  console.log("Cron: GET /api/quotations?resource=process_automations&key=$REMINDER_CRON_KEY");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
