/// <reference types="node" />

import { connectDB } from "../src/lib/db";
import { Product } from "../src/modules/products/product.model";
import { Category } from "../src/modules/categories/taxonomy.model";
import { MarketplaceEntity } from "../src/modules/seo/entity.model";

async function main() {
  await connectDB();
  const catalogKey = "safety-equipment";
  const entity = await MarketplaceEntity.findOne({
    $or: [{ catalogKey }, { key: catalogKey }, { slug: catalogKey }],
  }).lean();

  const roots = await Category.find({
    $or: [{ catalogKey }, { icon: catalogKey }, { "slug.en": catalogKey }],
  })
    .select("_id catalogKey parentId")
    .lean();
  const rootIds = roots.map((r) => r._id);
  const tree = await Category.find({
    $or: [{ _id: { $in: rootIds } }, { parentId: { $in: rootIds } }, { path: { $in: rootIds } }],
  })
    .select("_id catalogKey")
    .lean();
  const categoryIds = tree.map((c) => c._id);

  const byEntity = entity
    ? await Product.countDocuments({ marketplaceEntityIds: entity._id, status: "published" })
    : -1;
  const byTree = await Product.countDocuments({
    categoryId: { $in: categoryIds },
    status: "published",
  });

  const perChild: Record<string, number> = {};
  for (const c of tree) {
    const key = c.catalogKey || String(c._id);
    perChild[key] = await Product.countDocuments({ categoryId: c._id, status: "published" });
  }

  console.log(
    JSON.stringify(
      {
        entity: entity
          ? {
              id: String(entity._id),
              slug: entity.slug,
              catalogKey: entity.catalogKey,
              productCount: entity.productCount,
            }
          : null,
        roots: roots.map((r) => ({ id: String(r._id), key: r.catalogKey })),
        treeSize: tree.length,
        byEntity,
        byTree,
        perChild,
      },
      null,
      2
    )
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
