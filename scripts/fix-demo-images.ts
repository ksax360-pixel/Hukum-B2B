// scripts/fix-demo-images.ts
// Local demo data only: the seed gave many products a random photo (a printer on a helmet listing).
// Re-points the primary image to the category image whose keywords match the product name.
// Products whose name matches no rule are left alone.
// Run: MONGODB_URI=... npx tsx scripts/fix-demo-images.ts

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Product } from "../src/modules/products/product.model";

/** First matching rule wins, so specific words come before broad ones. */
const RULES: Array<[RegExp, string]> = [
  [/goggle|glasses|eye|face shield|visor/i, "eye-protection"],
  [/glove/i, "hand-protection"],
  [/boot|shoe|footwear/i, "safety-footwear"],
  [/vest|coverall|uniform|workwear|jacket|overall/i, "workwear-uniforms"],
  [/helmet|hard hat|harness|ppe|safety|fall/i, "safety-equipment"],
  [/extinguisher|fire|sprinkler|smoke/i, "fire-safety"],
  [/cable tray|cable ladder|cable|wire/i, "cables-wires"],
  [/led|lamp|light|flood/i, "lighting"],
  [/breaker|switch|panel|socket|transformer|electrical/i, "electrical"],
  [/cement|concrete|block|brick|gypsum/i, "building-materials"],
  [/rebar|steel|beam|handrail|stainless/i, "steel-rebar"],
  [/pipe|valve|manhole|fitting|sanitary|toilet|tap/i, "plumbing-sanitary"],
  [/paint|coating|primer|epoxy/i, "paints-coatings"],
  [/door|window/i, "doors-windows"],
  [/ac unit|hvac|chiller|duct|air condition/i, "hvac-refrigeration"],
  [/solar|inverter/i, "renewable-energy"],
  [/pump|compressor|generator|motor/i, "industrial-machinery"],
  [/drill|tool|spanner|wrench|hammer/i, "tools-hardware"],
  [/cup|carton|box|film|packaging|bag|pallet/i, "packaging"],
  [/mask|syringe|gauze|bandage/i, "medical-consumables"],
  [/gown|bed|wheelchair|medical/i, "medical-supplies"],
  [/laptop|printer|monitor|computer/i, "it-electronics"],
  [/router|switch port|network|fiber/i, "telecom-networking"],
  [/camera|cctv|access control/i, "security-systems"],
  [/chair|desk|table|furniture|cabinet/i, "furniture-fit-out"],
  [/detergent|sanitizer|cleaning|soap|tissue/i, "cleaning-hygiene"],
  [/coffee|tea|juice|water|beverage/i, "beverages"],
  [/rice|flour|sugar|dates/i, "grains-staples"],
  [/oven|fryer|kitchen|refrigerator/i, "kitchen-equipment"],
  [/sign|barrier|cone/i, "signage-barriers"],
];

async function main(): Promise<void> {
  await connectDB();
  const products = await Product.find({}).select("name media").lean();
  let changed = 0;
  for (const p of products) {
    const name = (p as { name?: { en?: string } }).name?.en || "";
    const hit = RULES.find(([re]) => re.test(name));
    if (!hit) continue;
    const url = `/images/categories/${hit[1]}.webp`;
    const media = ((p as { media?: Array<{ url?: string; isPrimary?: boolean }> }).media || []);
    if (media[0]?.url === url) continue;
    await Product.updateOne(
      { _id: p._id },
      { $set: { media: [{ url, type: "image", isPrimary: true, order: 0, alt: { en: name, ar: name } }] } }
    );
    changed++;
  }
  console.log(`products: ${products.length}, images re-pointed: ${changed}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
