/**
 * Seeds ~10 published safety-equipment products with images,
 * ensures vendor is verified, links marketplace entities, sample inquiry path ready.
 */
import { connectDB } from "../src/lib/db";
import { Category, Industry } from "../src/modules/categories/taxonomy.model";
import { Product } from "../src/modules/products/product.model";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { User } from "../src/modules/users/user.model";
import { syncMarketplaceTaxonomy } from "../src/modules/categories/taxonomy-sync";
import { processProductSeoAeo, seedMarketplaceEntities } from "../src/modules/seo/pipeline";
import { demoMediaForProduct } from "../src/lib/product-visuals";
import { copyPublicAssetToProductUpload } from "../src/lib/persist-upload";
import { hashPassword } from "../src/lib/auth";

const SAFETY_SKUS = [
  {
    sku: "SAF-HELM-PRO-10",
    name: { en: "Industrial Safety Helmet Pro", ar: "خوذة سلامة صناعية برو" },
    brand: "NajdSafe",
    price: 85,
    moq: 50,
    short: { en: "ABS shell, ratchet suspension, SASO ready.", ar: "هيكل ABS وتعليق سقاطة جاهز لـ SASO." },
    attrs: { material: "ABS", color: "Yellow", standard: "SASO / EN 397" },
  },
  {
    sku: "SAF-HELM-VNT-11",
    name: { en: "Vented Safety Helmet", ar: "خوذة سلامة بفتحات تهوية" },
    brand: "GulfGuard",
    price: 72,
    moq: 100,
    short: { en: "Lightweight vented shell for hot sites.", ar: "هيكل خفيف بتهوية لمواقع حارة." },
    attrs: { material: "HDPE", color: "White", standard: "EN 397" },
  },
  {
    sku: "SAF-GLV-NIT-12",
    name: { en: "Nitrile Industrial Gloves", ar: "قفازات نيتريل صناعية" },
    brand: "GulfGuard",
    price: 28,
    moq: 200,
    short: { en: "Oil-resistant nitrile, sizes M–XXL.", ar: "نيتريل مقاوم للزيوت مقاسات M–XXL." },
    attrs: { material: "Nitrile", color: "Blue", size_range: "M-XXL" },
  },
  {
    sku: "SAF-GLV-CUT-13",
    name: { en: "Cut-Resistant Gloves Level 5", ar: "قفازات مقاومة للقطع مستوى 5" },
    brand: "RSS Safety",
    price: 45,
    moq: 150,
    short: { en: "HPPE liner, Level 5 cut protection.", ar: "بطانة HPPE حماية قطع مستوى 5." },
    attrs: { material: "HPPE", cut_level: "5", color: "Grey" },
  },
  {
    sku: "SAF-EYE-AFG-14",
    name: { en: "Anti-Fog Safety Goggles", ar: "نظارات سلامة مضادة للضباب" },
    brand: "RSS Safety",
    price: 36,
    moq: 100,
    short: { en: "Indirect vent, anti-fog polycarbonate.", ar: "تهوية غير مباشرة وبولي كربونات مضاد للضباب." },
    attrs: { material: "Polycarbonate", feature: "Anti-fog", standard: "EN 166" },
  },
  {
    sku: "SAF-EAR-MUF-15",
    name: { en: "Industrial Ear Muffs SNR 32", ar: "واقيات أذن صناعية SNR 32" },
    brand: "NajdSafe",
    price: 55,
    moq: 80,
    short: { en: "Over-ear protection for high noise zones.", ar: "حماية فوق الأذن لمناطق الضوضاء العالية." },
    attrs: { snr: "32", type: "Over-ear" },
  },
  {
    sku: "SAF-SHOE-STL-16",
    name: { en: "Steel Toe Safety Shoes", ar: "أحذية سلامة بمقدمة فولاذية" },
    brand: "WorkFit",
    price: 165,
    moq: 40,
    short: { en: "Composite midsole, oil-resistant outsole.", ar: "نعل وسط مركب ونعل مقاوم للزيوت." },
    attrs: { toe_cap: "Steel", sizes: "39-46", standard: "ISO 20345" },
  },
  {
    sku: "SAF-VEST-HV-17",
    name: { en: "Hi-Vis Reflective Safety Vest", ar: "سترة سلامة عاكسة عالية الرؤية" },
    brand: "GulfGuard",
    price: 22,
    moq: 200,
    short: { en: "Class 2 hi-vis mesh vest, one size.", ar: "سترة شبكية عالية الرؤية فئة 2." },
    attrs: { class: "2", color: "Fluorescent Orange", material: "Polyester mesh" },
  },
  {
    sku: "SAF-HARN-FB-18",
    name: { en: "Full Body Fall Arrest Harness", ar: "حزام كامل للجسم ضد السقوط" },
    brand: "NajdSafe",
    price: 280,
    moq: 20,
    short: { en: "5-point harness with dorsal D-ring.", ar: "حزام 5 نقاط مع حلقة ظهرية." },
    attrs: { points: "5", standard: "EN 361", color: "Yellow/Black" },
  },
  {
    sku: "SAF-MASK-FFP-19",
    name: { en: "FFP2 Dust Respirator Pack", ar: "باقة كمامات غبار FFP2" },
    brand: "ClinicCare",
    price: 48,
    moq: 50,
    short: { en: "Box of 20 FFP2 respirators for dusty sites.", ar: "علبة 20 كمامة FFP2 للمواقع المتربة." },
    attrs: { rating: "FFP2", pack_size: "20", valve: "No" },
  },
];

async function ensureVendor() {
  let user = await User.findOne({ email: "vendor@kingdomtrade.demo" });
  if (!user) {
    user = await User.create({
      email: "vendor@kingdomtrade.demo",
      passwordHash: await hashPassword("Vendor123!"),
      name: "Demo Vendor",
      roles: ["vendor_owner"],
      preferredLanguage: "en",
      status: "active",
    });
  } else {
    user.passwordHash = await hashPassword("Vendor123!");
    user.roles = Array.from(new Set([...(user.roles || []), "vendor_owner"]));
    user.status = "active";
    await user.save();
  }

  let vendor = await Vendor.findOne({
    $or: [{ ownerUserId: user._id }, { email: "vendor@kingdomtrade.demo" }],
  });
  const safety = await Category.findOne({
    $or: [{ catalogKey: "safety-equipment" }, { icon: "safety-equipment" }],
  });
  const industry =
    (safety?.industryId && (await Industry.findById(safety.industryId))) ||
    (await Industry.findOne({ "name.en": /safety/i }));

  const payload = {
    ownerUserId: user._id,
    legalName: { en: "Najd Safety Supplies LLC", ar: "نجد لمستلزمات السلامة" },
    tradeName: "NajdSafe Demo",
    slug: { en: "najdsafe-demo", ar: "najdsafe-demo" },
    email: "vendor@kingdomtrade.demo",
    phone: "+966501234567",
    whatsapp: "+966501234567",
    verificationStatus: "verified",
    status: "verified",
    verificationArchived: false,
    verificationRejectionReason: "",
    companyType: "manufacturer",
    location: { city: "Riyadh", region: "Riyadh", country: "SA" },
    logo: "/vendors/najd.jpg",
    industries: industry ? [industry._id] : [],
    categories: safety ? [safety._id] : [],
  };

  if (vendor) {
    Object.assign(vendor, payload);
    await vendor.save();
  } else {
    vendor = await Vendor.create(payload);
  }
  user.vendorId = vendor._id;
  await user.save();
  return { user, vendor, safety, industry };
}

async function main() {
  await connectDB();
  try {
    await syncMarketplaceTaxonomy();
  } catch (e) {
    console.warn("[sync]", (e as Error).message);
  }
  await seedMarketplaceEntities().catch((e) => console.warn("[entities]", e.message));

  const { vendor, safety, industry } = await ensureVendor();
  if (!safety) throw new Error("safety-equipment category missing — run taxonomy sync first");

  let created = 0;
  let updated = 0;
  const companyName =
    String((vendor as { tradeName?: string }).tradeName || "") ||
    String((vendor as { legalName?: { en?: string } }).legalName?.en || "vendor");

  for (const item of SAFETY_SKUS) {
    const slugEn = item.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await Product.findOne({ sku: item.sku });
    const productIdHint = existing ? String(existing._id) : slugEn;

    const staticMedia = demoMediaForProduct({
      sku: item.sku,
      name: item.name,
      brand: item.brand,
      categoryKey: "safety-equipment",
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
      industryId: industry?._id || safety.industryId,
      categoryId: safety._id,
      categoryPath: [safety._id],
      name: item.name,
      title: item.name,
      slug: { en: slugEn, ar: slugEn },
      sku: item.sku,
      brand: item.brand,
      manufacturer: item.brand,
      shortDescription: item.short,
      description: {
        en: `${item.name.en}. ${item.short.en} Supplied by verified Saudi vendor on Kingdom Trade.`,
        ar: `${item.name.ar}. ${item.short.ar}`,
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
      origin: { countryOfOrigin: "SA" },
      featured: created < 3,
      seo: {
        title: { en: `${item.name.en} | Kingdom Trade`, ar: item.name.ar },
        description: item.short,
        indexable: true,
      },
    };

    let product;
    if (existing) {
      product = await Product.findByIdAndUpdate(existing._id, body, { new: true });
      updated += 1;
    } else {
      product = await Product.create(body);
      created += 1;
    }
    if (product) {
      await processProductSeoAeo(String(product._id)).catch(() => undefined);
    }
  }

  // Also publish any other safety-linked drafts from earlier demos
  const childIds = await Category.find({
    $or: [
      { catalogKey: /safety/i },
      { icon: /safety/i },
      { parentId: safety._id },
      { _id: safety._id },
    ],
  }).select("_id");
  const ids = childIds.map((c) => c._id);
  await Product.updateMany(
    { categoryId: { $in: ids }, vendorId: vendor._id, status: { $ne: "published" } },
    { $set: { status: "published", verificationStatus: "verified" } }
  );

  const published = await Product.countDocuments({
    categoryId: { $in: ids },
    status: "published",
  });
  const linked = await Product.countDocuments({
    categoryId: safety._id,
    status: "published",
    marketplaceEntityIds: { $exists: true, $ne: [] },
  });

  console.log(
    JSON.stringify(
      {
        vendor: {
          email: "vendor@kingdomtrade.demo",
          password: "Vendor123!",
          phone: vendor.phone,
          verificationStatus: vendor.verificationStatus,
          id: String(vendor._id),
        },
        buyerHint: { email: "buyer@kingdomtrade.demo", password: "Buyer123!" },
        safetyCategoryId: String(safety._id),
        productsCreated: created,
        productsUpdated: updated,
        publishedOnSafetyTree: published,
        withMarketplaceEntities: linked,
        urls: {
          category: "http://localhost:3000/en/c/safety-equipment",
          sellerLogin: "http://localhost:3002/login",
          sellerProducts: "http://localhost:3002/dashboard/products",
          sellerInquiries: "http://localhost:3002/dashboard/inquiries",
        },
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
