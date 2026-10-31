/**
 * Step-by-step: ensure each safety-equipment subcategory has published products
 * so category chips/filters are never empty.
 */
import { connectDB } from "../src/lib/db";
import { Category } from "../src/modules/categories/taxonomy.model";
import { Product } from "../src/modules/products/product.model";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { syncMarketplaceTaxonomy } from "../src/modules/categories/taxonomy-sync";
import { processProductSeoAeo, seedMarketplaceEntities } from "../src/modules/seo/pipeline";
import { demoMediaForProduct } from "../src/lib/product-visuals";
import { copyPublicAssetToProductUpload } from "../src/lib/persist-upload";

type Item = {
  subKey: string;
  sku: string;
  name: { en: string; ar: string };
  brand: string;
  price: number;
  moq: number;
  attrs: Record<string, string>;
};

/** Ordered by chip order — 3 products each. */
const ITEMS: Item[] = [
  // 1. Safety Helmets
  {
    subKey: "safety-helmets",
    sku: "SAF-HELM-SUB-01",
    name: { en: "Industrial Safety Helmet Pro", ar: "خوذة سلامة صناعية برو" },
    brand: "NajdSafe",
    price: 85,
    moq: 50,
    attrs: { material: "ABS", standard: "EN 397" },
  },
  {
    subKey: "safety-helmets",
    sku: "SAF-HELM-SUB-02",
    name: { en: "Vented Site Helmet", ar: "خوذة موقع بتهوية" },
    brand: "GulfGuard",
    price: 72,
    moq: 100,
    attrs: { material: "HDPE", vented: "Yes" },
  },
  {
    subKey: "safety-helmets",
    sku: "SAF-HELM-SUB-03",
    name: { en: "Full-Brim Hard Hat Yellow", ar: "خوذة بحافة كاملة صفراء" },
    brand: "RSS Safety",
    price: 95,
    moq: 40,
    attrs: { brim: "Full", color: "Yellow" },
  },
  // 2. Safety Gloves
  {
    subKey: "safety-gloves",
    sku: "SAF-GLV-SUB-01",
    name: { en: "Nitrile Industrial Gloves", ar: "قفازات نيتريل صناعية" },
    brand: "GulfGuard",
    price: 28,
    moq: 200,
    attrs: { material: "Nitrile", size: "M-XXL" },
  },
  {
    subKey: "safety-gloves",
    sku: "SAF-GLV-SUB-02",
    name: { en: "Cut Level 5 Gloves", ar: "قفازات مقاومة للقطع 5" },
    brand: "RSS Safety",
    price: 45,
    moq: 150,
    attrs: { cut_level: "5", material: "HPPE" },
  },
  {
    subKey: "safety-gloves",
    sku: "SAF-GLV-SUB-03",
    name: { en: "Chemical Resistant Gauntlets", ar: "قفازات كيميائية طويلة" },
    brand: "NajdSafe",
    price: 38,
    moq: 120,
    attrs: { material: "Neoprene", length: "450mm" },
  },
  // 3. Eye & Face Protection
  {
    subKey: "eye-protection",
    sku: "SAF-EYE-SUB-01",
    name: { en: "Anti-Fog Safety Goggles", ar: "نظارات مضادة للضباب" },
    brand: "RSS Safety",
    price: 36,
    moq: 100,
    attrs: { feature: "Anti-fog", standard: "EN 166" },
  },
  {
    subKey: "eye-protection",
    sku: "SAF-EYE-SUB-02",
    name: { en: "Clear Safety Spectacles", ar: "نظارات سلامة شفافة" },
    brand: "NajdSafe",
    price: 18,
    moq: 200,
    attrs: { lens: "Clear polycarbonate" },
  },
  {
    subKey: "eye-protection",
    sku: "SAF-EYE-SUB-03",
    name: { en: "Face Shield Visor Kit", ar: "طقم واقي وجه" },
    brand: "GulfGuard",
    price: 64,
    moq: 60,
    attrs: { type: "Visor", standard: "EN 166" },
  },
  // 4. Fall Protection
  {
    subKey: "fall-protection",
    sku: "SAF-FALL-SUB-01",
    name: { en: "Full Body Fall Arrest Harness", ar: "حزام كامل ضد السقوط" },
    brand: "NajdSafe",
    price: 280,
    moq: 20,
    attrs: { points: "5", standard: "EN 361" },
  },
  {
    subKey: "fall-protection",
    sku: "SAF-FALL-SUB-02",
    name: { en: "Shock Absorbing Lanyard 2m", ar: "حبل امتصاص صدمة 2م" },
    brand: "RSS Safety",
    price: 145,
    moq: 30,
    attrs: { length: "2m", standard: "EN 355" },
  },
  {
    subKey: "fall-protection",
    sku: "SAF-FALL-SUB-03",
    name: { en: "Roof Anchor Temporary Kit", ar: "طقم مرساة سقف مؤقت" },
    brand: "GulfGuard",
    price: 390,
    moq: 10,
    attrs: { capacity: "100kg", type: "Temporary" },
  },
  // 5. Safety Footwear
  {
    subKey: "safety-footwear",
    sku: "SAF-SHOE-SUB-01",
    name: { en: "Steel Toe Safety Shoes", ar: "أحذية سلامة بمقدمة فولاذية" },
    brand: "WorkFit",
    price: 165,
    moq: 40,
    attrs: { toe_cap: "Steel", standard: "ISO 20345" },
  },
  {
    subKey: "safety-footwear",
    sku: "SAF-SHOE-SUB-02",
    name: { en: "Composite Toe Safety Boot", ar: "حذاء سلامة بمقدمة مركبة" },
    brand: "NajdSafe",
    price: 210,
    moq: 30,
    attrs: { toe_cap: "Composite", waterproof: "Yes" },
  },
  {
    subKey: "safety-footwear",
    sku: "SAF-SHOE-SUB-03",
    name: { en: "ESD Safety Trainer", ar: "حذاء سلامة مضاد للكهرباء الساكنة" },
    brand: "GulfGuard",
    price: 188,
    moq: 50,
    attrs: { esd: "Yes", standard: "ISO 20345" },
  },
  // 6. Hi-Vis Vests
  {
    subKey: "hi-vis-vests",
    sku: "SAF-VEST-SUB-01",
    name: { en: "Hi-Vis Reflective Vest", ar: "سترة عاكسة عالية الرؤية" },
    brand: "GulfGuard",
    price: 22,
    moq: 200,
    attrs: { class: "2", color: "Fluorescent Orange" },
  },
  {
    subKey: "hi-vis-vests",
    sku: "SAF-VEST-SUB-02",
    name: { en: "Hi-Vis Executive Vest", ar: "سترة تنفيذية عالية الرؤية" },
    brand: "NajdSafe",
    price: 35,
    moq: 100,
    attrs: { class: "3", pockets: "Yes" },
  },
  {
    subKey: "hi-vis-vests",
    sku: "SAF-VEST-SUB-03",
    name: { en: "Hi-Vis Mesh Traffic Vest", ar: "سترة مرور شبكية عالية الرؤية" },
    brand: "RSS Safety",
    price: 19,
    moq: 250,
    attrs: { class: "2", material: "Mesh" },
  },
  // 7. Hearing Protection
  {
    subKey: "hearing-protection",
    sku: "SAF-EAR-SUB-01",
    name: { en: "Industrial Ear Muffs SNR 32", ar: "واقيات أذن SNR 32" },
    brand: "NajdSafe",
    price: 55,
    moq: 80,
    attrs: { snr: "32", type: "Over-ear" },
  },
  {
    subKey: "hearing-protection",
    sku: "SAF-EAR-SUB-02",
    name: { en: "Disposable Foam Ear Plugs Pack", ar: "سدادات أذن رغوية للاستخدام مرة واحدة" },
    brand: "GulfGuard",
    price: 12,
    moq: 500,
    attrs: { snr: "37", pack_size: "200" },
  },
  {
    subKey: "hearing-protection",
    sku: "SAF-EAR-SUB-03",
    name: { en: "Banded Ear Plugs", ar: "سدادات أذن بشريط" },
    brand: "RSS Safety",
    price: 24,
    moq: 150,
    attrs: { snr: "26", type: "Banded" },
  },
  // 8. Respiratory Protection
  {
    subKey: "respiratory-protection",
    sku: "SAF-MASK-SUB-01",
    name: { en: "FFP2 Dust Respirator Pack", ar: "كمامات غبار FFP2" },
    brand: "ClinicCare",
    price: 48,
    moq: 50,
    attrs: { rating: "FFP2", pack_size: "20" },
  },
  {
    subKey: "respiratory-protection",
    sku: "SAF-MASK-SUB-02",
    name: { en: "Half-Face Respirator Kit", ar: "طقم قناع نصف وجه" },
    brand: "GulfGuard",
    price: 190,
    moq: 25,
    attrs: { type: "Half-face", filters: "A2P3" },
  },
  {
    subKey: "respiratory-protection",
    sku: "SAF-MASK-SUB-03",
    name: { en: "FFP3 Valved Respirator Box", ar: "علبة كمامات FFP3 بصمام" },
    brand: "NajdSafe",
    price: 75,
    moq: 40,
    attrs: { rating: "FFP3", valve: "Yes" },
  },
];

/** Move generic parent-level SKUs onto the right subcategory. */
const REASSIGN: Array<{ sku: string; subKey: string }> = [
  { sku: "SAF-HELM-GEN", subKey: "safety-helmets" },
  { sku: "SAF-HELM-PRO-10", subKey: "safety-helmets" },
  { sku: "SAF-HELM-VNT-11", subKey: "safety-helmets" },
  { sku: "HELM-IND-001", subKey: "safety-helmets" },
  { sku: "HELM-NAJD-01", subKey: "safety-helmets" },
  { sku: "HELM-EAST-01", subKey: "safety-helmets" },
  { sku: "SAF-HELM-01", subKey: "safety-helmets" },
  { sku: "SAF-GLV-GEN", subKey: "safety-gloves" },
  { sku: "SAF-GLV-NIT-12", subKey: "safety-gloves" },
  { sku: "SAF-GLV-CUT-13", subKey: "safety-gloves" },
  { sku: "SAF-EYE-GEN", subKey: "eye-protection" },
  { sku: "SAF-EYE-AFG-14", subKey: "eye-protection" },
  { sku: "SAF-HARN-GEN", subKey: "fall-protection" },
  { sku: "SAF-HARN-FB-18", subKey: "fall-protection" },
  { sku: "SAF-SHOE-GEN", subKey: "safety-footwear" },
  { sku: "SAF-SHOE-STL-16", subKey: "safety-footwear" },
  { sku: "SAF-VEST-GEN", subKey: "hi-vis-vests" },
  { sku: "SAF-VEST-HV-17", subKey: "hi-vis-vests" },
  { sku: "SAF-EAR-GEN", subKey: "hearing-protection" },
  { sku: "SAF-EAR-MUF-15", subKey: "hearing-protection" },
  { sku: "SAF-MASK-GEN", subKey: "respiratory-protection" },
  { sku: "SAF-MASK-FFP-19", subKey: "respiratory-protection" },
];

async function main() {
  await connectDB();
  try {
    await syncMarketplaceTaxonomy();
  } catch (e) {
    console.warn(String(e));
  }
  await seedMarketplaceEntities().catch(() => undefined);

  const parent = await Category.findOne({
    $or: [{ catalogKey: "safety-equipment" }, { icon: "safety-equipment" }],
  });
  if (!parent) throw new Error("safety-equipment category missing");

  const vendor =
    (await Vendor.findOne({ email: "vendor@kingdomtrade.demo" })) ||
    (await Vendor.findOne({ verificationStatus: "verified" }));
  if (!vendor) throw new Error("vendor missing — run seed-safety-journey first");

  if (!parent.image) {
    parent.image = "/categories/safety-equipment.jpg";
    await parent.save();
  }

  const subByKey = new Map<string, { _id: unknown }>();
  const children = await Category.find({ parentId: parent._id }).lean();
  for (const c of children) {
    const key = String(c.catalogKey || c.icon || "");
    if (key) subByKey.set(key, c);
  }

  let created = 0;
  let updated = 0;
  const perSub: Record<string, number> = {};

  for (const item of ITEMS) {
    let sub = subByKey.get(item.subKey) as { _id: unknown } | undefined;
    if (!sub) {
      const found = await Category.findOne({
        $or: [{ catalogKey: item.subKey }, { icon: item.subKey }],
      });
      if (found) {
        sub = found;
        subByKey.set(item.subKey, found);
      }
    }
    if (!sub) {
      console.warn(`[skip] missing subcategory ${item.subKey}`);
      continue;
    }

    const categoryId = sub._id;
    const path = [parent._id, categoryId];
    const slugEn = item.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const companyName =
      String((vendor as { tradeName?: string }).tradeName || "") ||
      String((vendor as { legalName?: { en?: string } }).legalName?.en || "vendor");

    const existing = await Product.findOne({ sku: item.sku });
    const productIdHint = existing ? String(existing._id) : slugEn;

    // Copy static demo JPGs into multer uploads/ so Mongo stores /api/media URLs only.
    const staticMedia = demoMediaForProduct({
      sku: item.sku,
      name: item.name,
      brand: item.brand,
      categoryKey: item.subKey,
    });
    const media = [];
    for (let i = 0; i < staticMedia.length; i += 1) {
      const m = staticMedia[i];
      try {
        media.push(
          await copyPublicAssetToProductUpload({
            publicUrl: m.url,
            vendorId: String(vendor._id),
            companyName,
            productId: productIdHint,
            alt: m.alt,
            isPrimary: Boolean(m.isPrimary),
            order: m.order ?? i,
          })
        );
      } catch (err) {
        console.warn(`[media] skip ${m.url}: ${String(err)}`);
      }
    }

    const body = {
      vendorId: vendor._id,
      industryId: parent.industryId,
      categoryId,
      categoryPath: path,
      name: item.name,
      title: item.name,
      slug: { en: slugEn, ar: slugEn },
      sku: item.sku,
      brand: item.brand,
      manufacturer: item.brand,
      shortDescription: {
        en: `${item.name.en} for B2B procurement in Saudi Arabia.`,
        ar: `${item.name.ar} للتوريد في السعودية.`,
      },
      description: {
        en: `${item.name.en}. Listed under ${item.subKey.replace(/-/g, " ")} on Kingdom Trade.`,
        ar: item.name.ar,
      },
      attributes: item.attrs,
      certifications: ["SASO", "ISO"],
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
      featured: created < 3,
      seo: {
        title: { en: `${item.name.en} | Kingdom Trade`, ar: item.name.ar },
        description: { en: item.name.en, ar: item.name.ar },
        indexable: true,
      },
    };

    const product = existing
      ? await Product.findByIdAndUpdate(existing._id, body, { new: true })
      : await Product.create(body);
    if (existing) updated += 1;
    else created += 1;
    perSub[item.subKey] = (perSub[item.subKey] || 0) + 1;
    if (product) await processProductSeoAeo(String(product._id)).catch(() => undefined);
  }

  let reassigned = 0;
  for (const row of REASSIGN) {
    const sub = subByKey.get(row.subKey);
    if (!sub) continue;
    const res = await Product.updateOne(
      { sku: row.sku },
      {
        $set: {
          categoryId: sub._id,
          categoryPath: [parent._id, sub._id],
          status: "published",
          verificationStatus: "verified",
        },
      }
    );
    if (res.modifiedCount) reassigned += 1;
  }

  // Final counts per L2 chip
  const counts: Record<string, number> = {};
  for (const [key, sub] of subByKey) {
    if (
      ![
        "safety-helmets",
        "safety-gloves",
        "eye-protection",
        "fall-protection",
        "safety-footwear",
        "hi-vis-vests",
        "hearing-protection",
        "respiratory-protection",
      ].includes(key)
    ) {
      continue;
    }
    counts[key] = await Product.countDocuments({ categoryId: sub._id, status: "published" });
  }

  console.log(
    JSON.stringify(
      {
        step: "safety subcategories seeded",
        created,
        updated,
        reassigned,
        seededThisRun: perSub,
        publishedPerChip: counts,
        url: "http://localhost:3000/en/c/safety-equipment",
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
