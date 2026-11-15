import "dotenv/config";
import { connectDB } from "../src/lib/db";
import { MarketplaceEntity } from "../src/modules/seo/entity.model";
import { refreshOneMarketplaceEntity, seedMarketplaceEntities } from "../src/modules/seo/pipeline";

async function main() {
  await connectDB();
  await seedMarketplaceEntities();
  const all = await MarketplaceEntity.find().select("_id").lean();
  let n = 0;
  for (const e of all) {
    await refreshOneMarketplaceEntity(String(e._id));
    n += 1;
  }
  const sample = await MarketplaceEntity.findOne({ key: "safety-equipment" }).lean();
  console.log(
    JSON.stringify(
      {
        refreshed: n,
        titleAr: sample?.seo?.title?.ar,
        titleEn: sample?.seo?.title?.en,
        geoClaims: sample?.geo?.claims?.length ?? 0,
        discovery: sample?.discoveryScore,
        seoAr: sample?.seoScoreAr,
        seoEn: sample?.seoScoreEn,
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
