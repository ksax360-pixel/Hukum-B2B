import "dotenv/config";
import { connectDB } from "../src/lib/db";
import { migrateAllSeoEntities, seedMarketplaceEntities } from "../src/modules/seo/pipeline";
import { MarketplaceEntity, ProductEntity } from "../src/modules/seo/entity.model";
import { Product } from "../src/modules/products/product.model";

async function main() {
  await connectDB();
  await seedMarketplaceEntities();
  const report = await migrateAllSeoEntities(5000);
  const indexable = await MarketplaceEntity.countDocuments({ indexable: true });
  const productEntities = await ProductEntity.countDocuments();
  const linked = await Product.countDocuments({ marketplaceEntityIds: { $exists: true, $ne: [] } });
  console.log(JSON.stringify({ ...report, indexable, productEntities, productsLinked: linked }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
