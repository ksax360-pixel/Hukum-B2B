import { connectDB } from "../src/lib/db";
import { Product } from "../src/modules/products/product.model";

/** Ensure published products show a clear price + strikethrough list price on cards. */
async function main() {
  await connectDB();
  const products = await Product.find({ status: "published" })
    .select("sku price priceType retailPrice wholesalePrice currency")
    .lean();

  let fixed = 0;
  for (const p of products) {
    const price = typeof p.price === "number" ? p.price : null;
    if (price == null || price <= 0) continue;

    const retail =
      typeof p.retailPrice === "number" && p.retailPrice > price
        ? p.retailPrice
        : Math.round(price * (1.18 + (String(p.sku || "").length % 7) / 100));

    await Product.updateOne(
      { _id: p._id },
      {
        $set: {
          priceType: p.priceType === "price_on_request" ? "fixed" : p.priceType || "fixed",
          currency: p.currency || "SAR",
          retailPrice: retail,
        },
      }
    );
    fixed += 1;
  }

  const sample = await Product.find({ status: "published", sku: /^SAF/ })
    .select("sku price retailPrice priceType currency")
    .limit(6)
    .lean();

  console.log(JSON.stringify({ scanned: products.length, fixed, sample }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
