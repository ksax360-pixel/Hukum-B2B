// scripts/seed-quotes.ts
// Local demo data: adds quotes from two more demo suppliers to every buyer request that has exactly one,
// so the side-by-side comparison has something to compare. Add-only: skips a supplier that already quoted.
// Run: MONGODB_URI=... npx tsx scripts/seed-quotes.ts

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { RFQ, RFQVendor, Quotation } from "../src/modules/rfqs/rfq.model";
import { Vendor } from "../src/modules/vendors/vendor.model";

const OFFERS = [
  { slug: "red-sea-safety-demo", factor: 0.92, lead: "5 days", pay: "30% advance, balance on delivery" },
  { slug: "jeddah-industrial-supply-demo", factor: 1.04, lead: "3 days", pay: "Net 30" },
];

async function main(): Promise<void> {
  await connectDB();
  const singles = await Quotation.aggregate([{ $group: { _id: "$rfqId", n: { $sum: 1 }, first: { $first: "$$ROOT" } } }, { $match: { n: 1 } }]);
  let added = 0;
  for (const g of singles) {
    const rfq = await RFQ.findById(g._id).lean<{ _id: mongoose.Types.ObjectId; items?: Array<{ name?: { en?: string }; quantity?: number }> }>();
    if (!rfq) continue;
    const base = g.first as { total?: number; tax?: number; lines?: Array<{ name?: string; quantity?: number; unitPrice?: number }> };
    for (const o of OFFERS) {
      const v = await Vendor.findOne({ "slug.en": o.slug }).select("_id").lean<{ _id: mongoose.Types.ObjectId }>();
      if (!v || (await Quotation.exists({ rfqId: rfq._id, vendorId: v._id }))) continue;
      const lines = (base.lines?.length ? base.lines : [{ name: rfq.items?.[0]?.name?.en || "Item", quantity: rfq.items?.[0]?.quantity || 1, unitPrice: 50 }]).map((l) => {
        const unitPrice = Math.round((l.unitPrice || 50) * o.factor * 100) / 100;
        return { name: l.name, quantity: l.quantity, unitPrice, total: Math.round(unitPrice * (l.quantity || 1) * 100) / 100 };
      });
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const tax = Math.round(subtotal * 0.15 * 100) / 100;
      await RFQVendor.updateOne({ rfqId: rfq._id, vendorId: v._id }, { $setOnInsert: { rfqId: rfq._id, vendorId: v._id, status: "quoted" } }, { upsert: true });
      await Quotation.create({
        rfqId: rfq._id, vendorId: v._id, lines, currency: "SAR", subtotal, tax, shipping: 0, total: subtotal + tax,
        leadTime: o.lead, deliveryTime: o.lead, paymentTerms: o.pay, validity: new Date(Date.now() + 14 * 864e5),
        warranty: "12 months", notes: "Demo quotation for design testing.", status: "submitted",
      });
      added++;
    }
  }
  console.log(`requests with one quote: ${singles.length}, quotes added: ${added}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
