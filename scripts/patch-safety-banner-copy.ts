import { connectDB } from "../src/lib/db";
import { MarketplaceEntity } from "../src/modules/seo/entity.model";
import { Category } from "../src/modules/categories/taxonomy.model";

async function main() {
  await connectDB();
  const intro = {
    en: "Industrial PPE and safety gear from verified Saudi suppliers — helmets, gloves, eye protection, footwear, harnesses, and more for construction and plant sites.",
    ar: "معدات وقاية شخصية وسلامة صناعية من موردين موثّقين في السعودية — خوذ وقفازات وحماية العين والأحذية وأحزمة الأمان لمواقع الإنشاء والمصانع.",
  };

  const entity = await MarketplaceEntity.findOneAndUpdate(
    {
      $or: [
        { key: "safety-equipment" },
        { catalogKey: "safety-equipment" },
        { "slug.en": "safety-equipment" },
      ],
    },
    {
      $set: {
        intro,
        "name.en": "Safety Equipment",
        "name.ar": "معدات السلامة",
      },
    },
    { new: true }
  ).select("name intro slug catalogKey productCount vendorCount key image");

  const category = await Category.findOneAndUpdate(
    {
      $or: [{ catalogKey: "safety-equipment" }, { "slug.en": "safety-equipment" }],
      parentId: null,
    },
    {
      $set: {
        "name.en": "Safety Equipment",
        "name.ar": "معدات السلامة",
        image: "/categories/safety-equipment.jpg",
      },
    },
    { new: true }
  ).select("name image catalogKey");

  console.log(
    JSON.stringify(
      {
        entity: entity
          ? {
              key: entity.key,
              name: entity.name,
              intro: entity.intro,
              productCount: entity.productCount,
              vendorCount: entity.vendorCount,
            }
          : null,
        category: category
          ? { name: category.name, image: category.image, catalogKey: category.catalogKey }
          : null,
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
