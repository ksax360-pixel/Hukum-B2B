import "dotenv/config";
import { connectDB } from "../src/lib/db";
import { applyDemoCatalog } from "./apply-demo-catalog";

async function main() {
  await connectDB();
  const result = await applyDemoCatalog();
  console.log(`Filled demo catalog: ${result.productCount} products, ${result.vendorCount} vendors.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
