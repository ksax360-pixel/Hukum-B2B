/**
 * Seeds one RFQ + invite + quotation and walks Journey 4 transitions.
 * Safe to re-run: uses a fixed title marker and cleans prior seed.
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Quotation, RFQ, RFQVendor } from "../src/modules/rfqs/rfq.model";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { User } from "../src/modules/users/user.model";
import { transitionQuotation } from "../src/modules/rfqs/quotation-lifecycle";
import { buildJourney4Reminders } from "../src/modules/rfqs/quotation-reminders";
import { formatQuoteDates } from "../src/lib/saudi-schedule";

const MARKER = "[Journey4 Smoke]";

async function main() {
  await connectDB();

  // Clean prior smoke
  const old = await RFQ.find({ "title.en": MARKER }).select("_id").lean();
  const oldIds = old.map((r) => r._id);
  if (oldIds.length) {
    await Quotation.deleteMany({ rfqId: { $in: oldIds } });
    await RFQVendor.deleteMany({ rfqId: { $in: oldIds } });
    await RFQ.deleteMany({ _id: { $in: oldIds } });
  }

  let buyer = await User.findOne({ email: /buyer|admin/i }).select("_id email").lean();
  if (!buyer) buyer = await User.findOne({}).select("_id email").lean();
  if (!buyer) throw new Error("No user found to act as buyer");

  const vendor = await Vendor.findOne({}).select("_id ownerUserId tradeName").lean();
  if (!vendor) throw new Error("No vendor found");

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 10);
  const validity = new Date();
  validity.setDate(validity.getDate() + 2); // expiring soon → triggers 48h reminder

  const rfq = await RFQ.create({
    buyerId: buyer._id,
    title: { en: MARKER, ar: MARKER },
    description: { en: "Smoke RFQ for quotation lifecycle", ar: "" },
    status: "open",
    deadline,
    currency: "SAR",
    items: [{ name: { en: "Industrial valve" }, quantity: 10, unit: "piece" }],
  });

  // Invite aged 5h → invited_not_viewed reminder
  const invite = await RFQVendor.create({
    rfqId: rfq._id,
    vendorId: vendor._id,
    status: "invited",
    createdAt: new Date(Date.now() - 5 * 3600_000),
  });
  // Force createdAt for age calc (mongoose may ignore on create)
  await RFQVendor.collection.updateOne(
    { _id: invite._id },
    { $set: { createdAt: new Date(Date.now() - 5 * 3600_000) } }
  );

  const sellerRem1 = await buildJourney4Reminders({
    userId: String(vendor.ownerUserId),
    vendorId: String(vendor._id),
    locale: "en",
  });
  console.log(
    "1. invited_not_viewed?",
    sellerRem1.some((r) => r.type === "invited_not_viewed"),
    sellerRem1.map((r) => r.type)
  );

  // Mark viewed (Journey 4 step)
  await transitionQuotation({
    action: "mark_viewed_invite",
    userId: String(vendor.ownerUserId),
    vendorId: String(vendor._id),
    rfqId: String(rfq._id),
  });
  const inviteAfter = await RFQVendor.findById(invite._id).lean();
  console.log("2. invite status after view:", inviteAfter?.status, "viewedAt:", !!inviteAfter?.viewedAt);

  // Aged viewed with no quote
  await RFQVendor.collection.updateOne(
    { _id: invite._id },
    { $set: { viewedAt: new Date(Date.now() - 25 * 3600_000), status: "viewed" } }
  );
  const sellerRem2 = await buildJourney4Reminders({
    userId: String(vendor.ownerUserId),
    vendorId: String(vendor._id),
    locale: "en",
  });
  console.log(
    "3. viewed_no_quote?",
    sellerRem2.some((r) => r.type === "viewed_no_quote"),
    sellerRem2.find((r) => r.type === "viewed_no_quote")?.meta?.smartAction
  );

  const quotation = await Quotation.create({
    rfqId: rfq._id,
    vendorId: vendor._id,
    lines: [{ name: "Industrial valve", quantity: 10, unitPrice: 120, total: 1200 }],
    currency: "SAR",
    subtotal: 1200,
    tax: 180,
    shipping: 0,
    total: 1380,
    leadTime: "14 days",
    validity,
    status: "submitted",
    vatIncluded: true,
    vatRate: 15,
    lifecycle: {
      invitedAt: invite.createdAt,
      viewedAt: new Date(),
      quotedAt: new Date(),
    },
    revision: 1,
  });
  await RFQVendor.findByIdAndUpdate(invite._id, { status: "quoted" });
  await RFQ.findByIdAndUpdate(rfq._id, { status: "quoted" });

  const dates = formatQuoteDates(validity, "en");
  console.log("4. quote created", {
    id: String(quotation._id),
    vatIncluded: true,
    ...dates,
  });

  // Buyer reminders: quote received / expiring
  const buyerRem = await buildJourney4Reminders({
    userId: String(buyer._id),
    locale: "en",
  });
  console.log(
    "5. buyer reminders",
    buyerRem.map((r) => ({ type: r.type, smart: r.meta?.smartAction }))
  );

  // Lifecycle walk: shortlist → accept → confirm_deal → reviewed
  await transitionQuotation({
    quotationId: String(quotation._id),
    action: "shortlist",
    userId: String(buyer._id),
  });
  let q = await Quotation.findById(quotation._id).lean();
  console.log("6. shortlisted:", q?.status);

  // Age shortlist for 3-day reminder
  await Quotation.collection.updateOne(
    { _id: quotation._id },
    {
      $set: {
        "lifecycle.shortlistedAt": new Date(Date.now() - 4 * 24 * 3600_000),
        updatedAt: new Date(Date.now() - 4 * 24 * 3600_000),
      },
    }
  );
  const buyerRem2 = await buildJourney4Reminders({
    userId: String(buyer._id),
    locale: "en",
  });
  console.log(
    "7. shortlisted_no_decision?",
    buyerRem2.some((r) => r.type === "shortlisted_no_decision"),
    buyerRem2.find((r) => r.type === "shortlisted_no_decision")?.meta?.smartAction
  );

  await transitionQuotation({
    quotationId: String(quotation._id),
    action: "accept",
    userId: String(buyer._id),
  });
  q = await Quotation.findById(quotation._id).lean();
  console.log("8. accepted:", q?.status);

  await transitionQuotation({
    quotationId: String(quotation._id),
    action: "confirm_deal",
    userId: String(buyer._id),
  });
  q = await Quotation.findById(quotation._id).lean();
  console.log("9. deal_confirmed:", q?.status);

  await transitionQuotation({
    quotationId: String(quotation._id),
    action: "mark_reviewed",
    userId: String(buyer._id),
  });
  q = await Quotation.findById(quotation._id).lean();
  console.log("10. reviewed:", q?.status);

  // Extend validity path on a fresh quote
  const q2 = await Quotation.create({
    rfqId: rfq._id,
    vendorId: vendor._id,
    lines: [{ name: "Spare", quantity: 1, unitPrice: 50, total: 50 }],
    currency: "SAR",
    subtotal: 50,
    tax: 0,
    total: 50,
    validity: new Date(Date.now() - 86400_000),
    status: "expired",
    vatIncluded: false,
    lifecycle: { quotedAt: new Date() },
  });
  await transitionQuotation({
    quotationId: String(q2._id),
    action: "extend_validity",
    userId: String(vendor.ownerUserId),
    vendorId: String(vendor._id),
    extendDays: 7,
  });
  const extended = await Quotation.findById(q2._id).lean();
  console.log("11. extend_validity:", extended?.status, formatQuoteDates(extended?.validity, "en"));

  console.log("\n✅ Journey 4 smoke OK");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("❌", e);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
