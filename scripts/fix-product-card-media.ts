import { connectDB } from "../src/lib/db";
import { Product } from "../src/modules/products/product.model";
import {
  mediaFromPrimaryUrl,
  preferredVisualUrls,
  allProductVisualUrls,
  diversifiedVisualKey,
} from "../src/lib/product-visuals";

async function main() {
  await connectDB();
  const products = await Product.find({ status: "published" })
    .select("sku name brand media")
    .sort({ sku: 1 })
    .lean();

  const used = new Set<string>();
  const pool = allProductVisualUrls();
  let fixed = 0;
  const sample: Array<{ sku?: string; key: string; img: string }> = [];

  for (let i = 0; i < products.length; i += 1) {
    const p = products[i];
    const visual = {
      sku: p.sku,
      name: p.name as { en?: string; ar?: string },
      brand: p.brand,
    };
    const preferred = preferredVisualUrls(visual);

    let primary: string;
    if (used.size < pool.length) {
      primary =
        preferred.find((url) => !used.has(url)) ||
        pool.find((url) => !used.has(url)) ||
        pool[i % pool.length];
      used.add(primary);
    } else {
      // Pool exhausted — rotate so neighbours still differ.
      primary = pool[i % pool.length];
    }

    const media = mediaFromPrimaryUrl(primary, visual);
    await Product.updateOne({ _id: p._id }, { $set: { media } });
    fixed += 1;

    if (sample.length < 16 && String(p.sku || "").startsWith("SAF")) {
      sample.push({
        sku: p.sku,
        key: diversifiedVisualKey(visual),
        img: media[0].url,
      });
    }
  }

  const saf = await Product.find({ status: "published", sku: /^SAF/ })
    .select("sku media")
    .sort({ sku: 1 })
    .lean();
  const uniqueSafPrimaries = new Set(saf.map((p) => (p.media as { url?: string }[])?.[0]?.url));

  console.log(
    JSON.stringify(
      {
        scanned: products.length,
        fixed,
        uniqueSafPrimaries: uniqueSafPrimaries.size,
        safProducts: saf.length,
        sample,
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
