import { connectDB } from "../src/lib/db";
import { syncMarketplaceTaxonomy } from "../src/modules/categories/taxonomy-sync";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { seedMarketplaceEntities } from "../src/modules/seo/pipeline";

async function main() {
  await connectDB();
  try {
    console.log(await syncMarketplaceTaxonomy());
  } catch (e) {
    console.warn(String(e));
  }
  await seedMarketplaceEntities().catch(() => undefined);
  await Vendor.updateMany(
    { email: "vendor@kingdomtrade.demo" },
    {
      $set: {
        "location.city": "Riyadh",
        "location.country": "SA",
        "location.region": "Riyadh",
      },
    }
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
