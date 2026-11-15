/**
 * Ensure ~10 published products (with images) for each popular homepage category.
 */
import { connectDB } from "../src/lib/db";
import { Category } from "../src/modules/categories/taxonomy.model";
import { Product } from "../src/modules/products/product.model";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { processProductSeoAeo, seedMarketplaceEntities } from "../src/modules/seo/pipeline";
import { demoMediaForProduct } from "../src/lib/product-visuals";
import { MARKETPLACE_CATEGORIES } from "../src/data/marketplace-categories";

const POPULAR = [
  "safety-equipment",
  "construction",
  "building-materials",
  "fmcg",
  "medical-equipment",
  "electrical",
  "hvac",
  "packaging",
  "agriculture",
  "logistics",
  "furniture-fitout",
  "tools-hardware",
];

const TEMPLATES: Record<string, Array<{ suffix: string; nameEn: string; nameAr: string; brand: string; price: number; moq: number; attrs: Record<string, string> }>> = {
  "safety-equipment": [
    { suffix: "HELM", nameEn: "Industrial Safety Helmet", nameAr: "خوذة سلامة صناعية", brand: "NajdSafe", price: 85, moq: 50, attrs: { material: "ABS", standard: "EN 397" } },
    { suffix: "GLV", nameEn: "Nitrile Safety Gloves", nameAr: "قفازات نيتريل", brand: "GulfGuard", price: 28, moq: 200, attrs: { material: "Nitrile", size: "M-XXL" } },
    { suffix: "EYE", nameEn: "Anti-Fog Safety Goggles", nameAr: "نظارات مضادة للضباب", brand: "RSS", price: 36, moq: 100, attrs: { feature: "Anti-fog", standard: "EN 166" } },
    { suffix: "EAR", nameEn: "Industrial Ear Muffs", nameAr: "واقيات أذن", brand: "NajdSafe", price: 55, moq: 80, attrs: { snr: "32" } },
    { suffix: "SHOE", nameEn: "Steel Toe Safety Shoes", nameAr: "أحذية سلامة", brand: "WorkFit", price: 165, moq: 40, attrs: { toe_cap: "Steel" } },
    { suffix: "VEST", nameEn: "Hi-Vis Safety Vest", nameAr: "سترة عالية الرؤية", brand: "GulfGuard", price: 22, moq: 200, attrs: { class: "2" } },
    { suffix: "HARN", nameEn: "Fall Arrest Harness", nameAr: "حزام ضد السقوط", brand: "NajdSafe", price: 280, moq: 20, attrs: { points: "5" } },
    { suffix: "MASK", nameEn: "FFP2 Respirator Pack", nameAr: "كمامات FFP2", brand: "ClinicCare", price: 48, moq: 50, attrs: { rating: "FFP2" } },
    { suffix: "BOOT", nameEn: "PVC Safety Boots", nameAr: "أحذية PVC", brand: "WorkFit", price: 95, moq: 60, attrs: { material: "PVC" } },
    { suffix: "GLOV", nameEn: "Cut Level 5 Gloves", nameAr: "قفازات قطع 5", brand: "RSS", price: 45, moq: 150, attrs: { cut_level: "5" } },
  ],
  construction: [
    { suffix: "SCF", nameEn: "Scaffolding Frame Set", nameAr: "طقم سقالات", brand: "BuildRight", price: 420, moq: 10, attrs: { material: "Steel" } },
    { suffix: "FRM", nameEn: "Formwork Panel Pack", nameAr: "ألواح قوالب", brand: "FormCraft", price: 380, moq: 20, attrs: { material: "Timber" } },
    { suffix: "EXC", nameEn: "Mini Excavator Rental Kit", nameAr: "طقم حفار صغير", brand: "HeavySite", price: 8500, moq: 1, attrs: { type: "Mini" } },
    { suffix: "BAR", nameEn: "Barricade Mesh Roll", nameAr: "لفة شبك حواجز", brand: "BuildRight", price: 65, moq: 50, attrs: { color: "Orange" } },
    { suffix: "CONE", nameEn: "Traffic Safety Cones", nameAr: "أقماع مرورية", brand: "SiteMark", price: 18, moq: 100, attrs: { height: "70cm" } },
    { suffix: "WELD", nameEn: "Site Welding Machine", nameAr: "ماكينة لحام", brand: "ArcGulf", price: 2100, moq: 2, attrs: { amp: "250A" } },
    { suffix: "MIX", nameEn: "Concrete Mixer 350L", nameAr: "خلاطة خرسانة", brand: "BuildRight", price: 3200, moq: 1, attrs: { capacity: "350L" } },
    { suffix: "PROP", nameEn: "Adjustable Steel Prop", nameAr: "دعامة فولاذية", brand: "FormCraft", price: 95, moq: 40, attrs: { material: "Steel" } },
    { suffix: "TARP", nameEn: "Heavy Duty Tarpaulin", nameAr: "غطاء قماش مشمع", brand: "SiteMark", price: 120, moq: 25, attrs: { size: "6x9m" } },
    { suffix: "LADD", nameEn: "Extension Ladder 8m", nameAr: "سلم تمديد 8م", brand: "ClimbSafe", price: 540, moq: 5, attrs: { length: "8m" } },
  ],
};

function templatesFor(key: string) {
  if (TEMPLATES[key]) return TEMPLATES[key];
  const cat = MARKETPLACE_CATEGORIES.find((c) => c.key === key);
  const base = cat?.name.en || key;
  const baseAr = cat?.name.ar || base;
  return Array.from({ length: 10 }, (_, i) => ({
    suffix: String(i + 1).padStart(2, "0"),
    nameEn: `${base} Supply Pack ${i + 1}`,
    nameAr: `${baseAr} باقة توريد ${i + 1}`,
    brand: "Kingdom Trade Demo",
    price: 100 + i * 35,
    moq: 10 + i * 5,
    attrs: { grade: "Industrial", pack: String(i + 1) },
  }));
}

async function main() {
  await connectDB();
  await seedMarketplaceEntities().catch(() => undefined);
  const vendor = await Vendor.findOne({ verificationStatus: "verified" }) || (await Vendor.findOne({}));
  if (!vendor) throw new Error("No vendor found — run seed-safety-journey first");

  const summary: Record<string, number> = {};

  for (const key of POPULAR) {
    const category = await Category.findOne({
      $or: [{ catalogKey: key }, { icon: key }, { "slug.en": key }],
    });
    if (!category) {
      summary[key] = 0;
      continue;
    }
    const items = templatesFor(key);
    let n = 0;
    for (const item of items) {
      const sku = `${key.slice(0, 3).toUpperCase()}-${item.suffix}-GEN`;
      const slugEn = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const name = { en: item.nameEn, ar: item.nameAr };
      const media = demoMediaForProduct({ sku, name, brand: item.brand, categoryKey: key });
      const body = {
        vendorId: vendor._id,
        industryId: category.industryId,
        categoryId: category._id,
        categoryPath: [category._id],
        name,
        title: name,
        slug: { en: slugEn, ar: slugEn },
        sku,
        brand: item.brand,
        manufacturer: item.brand,
        shortDescription: {
          en: `${item.nameEn} for B2B procurement on Kingdom Trade.`,
          ar: `${item.nameAr} للتوريد على Kingdom Trade.`,
        },
        description: {
          en: `${item.nameEn}. Wholesale supply listing with MOQ ${item.moq}.`,
          ar: `${item.nameAr}. توريد بالجملة بحد أدنى ${item.moq}.`,
        },
        attributes: item.attrs,
        media,
        priceType: "fixed",
        price: item.price,
        currency: "SAR",
        unit: "piece",
        moq: item.moq,
        availability: "in_stock",
        condition: "new",
        status: "published",
        verificationStatus: "verified",
        countryOfOrigin: "SA",
        featured: n < 2,
        seo: {
          title: { en: `${item.nameEn} | Kingdom Trade`, ar: item.nameAr },
          description: { en: item.nameEn, ar: item.nameAr },
          indexable: true,
        },
      };
      const existing = await Product.findOne({ sku });
      const product = existing
        ? await Product.findByIdAndUpdate(existing._id, body, { new: true })
        : await Product.create(body);
      if (product) {
        await processProductSeoAeo(String(product._id)).catch(() => undefined);
        n += 1;
      }
    }
    summary[key] = n;
  }

  console.log(JSON.stringify({ vendor: vendor.email || String(vendor._id), summary }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
