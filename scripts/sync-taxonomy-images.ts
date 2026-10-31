import { connectDB } from "../src/lib/db";
import { MARKETPLACE_CATEGORIES } from "../src/data/marketplace-categories";
import {
  defaultCategoryImagePath,
  syncMarketplaceTaxonomy,
} from "../src/modules/categories/taxonomy-sync";
import { Category, Industry } from "../src/modules/categories/taxonomy.model";

async function backfillImagesOnly() {
  let updated = 0;

  for (const cat of MARKETPLACE_CATEGORIES) {
    const image = defaultCategoryImagePath(cat.key)!;
    const result = await Category.updateMany(
      {
        $and: [
          {
            $or: [{ catalogKey: cat.key }, { icon: cat.key }, { "slug.en": cat.slug.en }],
          },
          {
            $or: [
              { image: { $exists: false } },
              { image: null },
              { image: "" },
              { image: { $regex: "^/categories/" } },
            ],
          },
        ],
      },
      { $set: { image, catalogKey: cat.key, icon: cat.key } }
    );
    updated += result.modifiedCount || 0;

    if (cat.children?.length) {
      for (const child of cat.children) {
        const childImage = defaultCategoryImagePath(child.key) || image;
        const childRes = await Category.updateMany(
          {
            $and: [
              {
                $or: [
                  { catalogKey: child.key },
                  { icon: child.key },
                  { "slug.en": child.slug.en },
                ],
              },
              {
                $or: [
                  { image: { $exists: false } },
                  { image: null },
                  { image: "" },
                  { image: { $regex: "^/categories/" } },
                ],
              },
            ],
          },
          { $set: { image: childImage, catalogKey: child.key, icon: child.key } }
        );
        updated += childRes.modifiedCount || 0;
      }
    }
  }

  const industryNames = new Map<string, string>();
  for (const cat of MARKETPLACE_CATEGORIES) {
    if (!industryNames.has(cat.industry.en)) industryNames.set(cat.industry.en, cat.key);
  }
  for (const [name, key] of industryNames) {
    await Industry.updateMany(
      {
        "name.en": name,
        $or: [
          { image: { $exists: false } },
          { image: null },
          { image: "" },
          { image: { $regex: "^/categories/" } },
        ],
      },
      { $set: { image: defaultCategoryImagePath(key) } }
    );
  }

  return updated;
}

async function main() {
  await connectDB();
  let syncResult: unknown = null;
  try {
    syncResult = await syncMarketplaceTaxonomy();
  } catch (e) {
    console.warn("[sync] full catalog sync failed, continuing with image backfill:", (e as Error).message);
  }
  const imageUpdates = await backfillImagesOnly();
  const total = await Category.countDocuments({});
  const withImg = await Category.countDocuments({ image: { $exists: true, $nin: [null, ""] } });
  const industries = await Industry.countDocuments({});
  console.log(
    JSON.stringify(
      { syncResult, imageUpdates, categoriesTotal: total, categoriesWithImage: withImg, industries },
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
