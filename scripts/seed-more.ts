// scripts/seed-more.ts
// Adds demo suppliers and products on top of scripts/seed.ts WITHOUT deleting anything (upsert by slug/sku).
// Several suppliers sell the same items, so compare, "also offered by" and matching have real content.
// All names end in "(Demo)". Run: npx tsx scripts/seed-more.ts

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { Product } from "../src/modules/products/product.model";
import { Category } from "../src/modules/categories/taxonomy.model";
import { User } from "../src/modules/users/user.model";

type V = { slug: string; en: string; ar: string; type: string; city: string; cities: string[]; years: number; certs: string[] };
const VENDORS: V[] = [
  { slug: "jeddah-industrial-supply-demo", en: "Jeddah Industrial Supply (Demo)", ar: "جدة للتوريدات الصناعية (تجريبي)", type: "distributor", city: "Jeddah", cities: ["Jeddah", "Mecca", "Medina"], years: 2009, certs: ["ISO 9001"] },
  { slug: "al-khobar-steel-works-demo", en: "Al Khobar Steel Works (Demo)", ar: "أعمال الخبر للحديد (تجريبي)", type: "manufacturer", city: "Khobar", cities: ["Khobar", "Dammam", "Jubail"], years: 2004, certs: ["ISO 9001", "ISO 45001"] },
  { slug: "sulay-fabrication-demo", en: "Sulay Fabrication Co. (Demo)", ar: "السلي للتصنيع المعدني (تجريبي)", type: "manufacturer", city: "Riyadh", cities: ["Riyadh", "Qassim", "Hail"], years: 2016, certs: ["ISO 9001", "Saudi Aramco approved (demo)"] },
  { slug: "red-sea-safety-demo", en: "Red Sea Safety Trading (Demo)", ar: "البحر الأحمر لتجارة السلامة (تجريبي)", type: "wholesaler", city: "Jeddah", cities: ["Jeddah", "Yanbu", "Tabuk"], years: 2012, certs: ["SASO"] },
  { slug: "qassim-cement-traders-demo", en: "Qassim Cement Traders (Demo)", ar: "القصيم لتجارة الأسمنت (تجريبي)", type: "trading_company", city: "Qassim", cities: ["Qassim", "Riyadh", "Hail"], years: 1998, certs: [] },
  { slug: "eastern-electrical-demo", en: "Eastern Electrical Supplies (Demo)", ar: "الشرقية للمستلزمات الكهربائية (تجريبي)", type: "distributor", city: "Dammam", cities: ["Dammam", "Khobar", "Riyadh"], years: 2010, certs: ["SASO", "IEC (demo)"] },
  { slug: "riyadh-packaging-demo", en: "Riyadh Packaging Solutions (Demo)", ar: "الرياض لحلول التغليف (تجريبي)", type: "manufacturer", city: "Riyadh", cities: ["Riyadh", "Jeddah", "Dammam"], years: 2014, certs: ["ISO 22000"] },
  { slug: "makkah-hospitality-supply-demo", en: "Makkah Hospitality Supply (Demo)", ar: "مكة لتوريدات الضيافة (تجريبي)", type: "wholesaler", city: "Mecca", cities: ["Mecca", "Jeddah", "Medina"], years: 2007, certs: [] },
  { slug: "abha-medical-trading-demo", en: "Abha Medical Trading (Demo)", ar: "أبها للتجارة الطبية (تجريبي)", type: "distributor", city: "Abha", cities: ["Abha", "Jazan", "Najran"], years: 2018, certs: ["SFDA listed (demo)"] },
];

/** item → offers by vendor slug with price, MOQ, lead time. */
type Item = { key: string; en: string; ar: string; cat: string[]; unit: string; img: string; tags: string[]; offers: Array<[string, number, number, string]> };
const ITEMS: Item[] = [
  { key: "helmet-white", en: "Safety Helmet EN 397 White", ar: "خوذة سلامة بيضاء EN 397", cat: ["safety-equipment"], unit: "piece", img: "safety-equipment", tags: ["helmet", "hard hat", "ppe"],
    offers: [["red-sea-safety-demo", 38, 100, "5 days"], ["jeddah-industrial-supply-demo", 41.5, 200, "7 days"], ["sulay-fabrication-demo", 44, 50, "4 days"]] },
  { key: "gloves-nitrile", en: "Nitrile Coated Work Gloves", ar: "قفازات عمل مغلفة بالنتريل", cat: ["safety-equipment"], unit: "pair", img: "hand-protection", tags: ["gloves", "ppe"],
    offers: [["red-sea-safety-demo", 6.5, 500, "3 days"], ["jeddah-industrial-supply-demo", 7.2, 300, "5 days"]] },
  { key: "hivis-vest", en: "Hi-Vis Reflective Vest Class 2", ar: "سترة عاكسة عالية الوضوح فئة 2", cat: ["safety-equipment"], unit: "piece", img: "workwear-uniforms", tags: ["vest", "hi-vis", "ppe"],
    offers: [["red-sea-safety-demo", 14, 200, "4 days"], ["makkah-hospitality-supply-demo", 16, 100, "6 days"], ["jeddah-industrial-supply-demo", 15.5, 150, "5 days"]] },
  { key: "cable-tray-300", en: "Perforated Cable Tray 300 mm HDG", ar: "صينية كابلات مثقبة 300 مم مجلفنة", cat: ["electrical-electronics", "electrical"], unit: "length", img: "cables-wires", tags: ["cable tray", "hdg"],
    offers: [["sulay-fabrication-demo", 132.5, 50, "10 days"], ["al-khobar-steel-works-demo", 128, 100, "14 days"], ["eastern-electrical-demo", 139, 30, "7 days"]] },
  { key: "cable-ladder-600", en: "Cable Ladder Tray 600 mm Heavy Duty", ar: "سلم كابلات 600 مم للأحمال الثقيلة", cat: ["electrical-electronics", "electrical"], unit: "length", img: "cables-wires", tags: ["cable ladder"],
    offers: [["sulay-fabrication-demo", 289, 20, "14 days"], ["al-khobar-steel-works-demo", 275, 40, "18 days"]] },
  { key: "lv-cable-4c16", en: "LV Power Cable 4C x 16 mm² Cu/XLPE", ar: "كابل جهد منخفض 4×16 مم² نحاس", cat: ["electrical-electronics", "electrical"], unit: "meter", img: "cables-wires", tags: ["cable", "lv"],
    offers: [["eastern-electrical-demo", 46, 500, "3 days"], ["jeddah-industrial-supply-demo", 48.5, 300, "6 days"]] },
  { key: "handrail-ss304", en: "Stainless Steel Handrail SS304 42.4 mm", ar: "درابزين ستانلس ستيل 304 قطر 42.4 مم", cat: ["building-materials", "construction"], unit: "meter", img: "steel-rebar", tags: ["handrail", "stainless"],
    offers: [["sulay-fabrication-demo", 410, 30, "12 days"], ["al-khobar-steel-works-demo", 395, 50, "15 days"]] },
  { key: "manhole-600", en: "Manhole Cover & Frame 600 x 600 D400", ar: "غطاء غرفة تفتيش مع إطار 600×600 D400", cat: ["building-materials", "construction"], unit: "set", img: "plumbing-sanitary", tags: ["manhole", "cover"],
    offers: [["sulay-fabrication-demo", 1150, 5, "10 days"], ["al-khobar-steel-works-demo", 1095, 10, "14 days"], ["qassim-cement-traders-demo", 1210, 2, "7 days"]] },
  { key: "cement-opc-50", en: "Ordinary Portland Cement 50 kg Bag", ar: "أسمنت بورتلاندي عادي كيس 50 كجم", cat: ["building-materials", "construction"], unit: "bag", img: "building-materials", tags: ["cement", "opc"],
    offers: [["qassim-cement-traders-demo", 16.5, 400, "2 days"], ["jeddah-industrial-supply-demo", 17.8, 200, "3 days"]] },
  { key: "paper-cup-8oz", en: "Paper Cups 8 oz Double Wall (1,000)", ar: "أكواب ورقية 8 أونصة مزدوجة (1000)", cat: ["packaging-materials", "packaging"], unit: "carton", img: "packaging", tags: ["cups", "paper"],
    offers: [["riyadh-packaging-demo", 145, 10, "5 days"], ["makkah-hospitality-supply-demo", 158, 5, "4 days"]] },
  { key: "stretch-film", en: "Stretch Film 23 micron 500 mm", ar: "فيلم تغليف مطاطي 23 ميكرون 500 مم", cat: ["packaging-materials", "packaging"], unit: "roll", img: "packaging", tags: ["stretch film"],
    offers: [["riyadh-packaging-demo", 39, 50, "3 days"], ["jeddah-industrial-supply-demo", 42, 30, "5 days"]] },
  { key: "surgical-mask", en: "3-Ply Surgical Face Mask (Box of 50)", ar: "كمامة جراحية ثلاثية الطبقات (علبة 50)", cat: ["medical-equipment", "medical"], unit: "box", img: "medical-consumables", tags: ["mask", "medical"],
    offers: [["abha-medical-trading-demo", 9.5, 100, "4 days"], ["makkah-hospitality-supply-demo", 11, 50, "3 days"]] },
];

async function main(): Promise<void> {
  await connectDB();
  const owner = await User.findOne({ email: "vendor@kingdomtrade.demo" }).select("_id");
  if (!owner) throw new Error("Run scripts/seed.ts first (vendor@kingdomtrade.demo missing)");

  const vendorIds = new Map<string, mongoose.Types.ObjectId>();
  for (const v of VENDORS) {
    const doc = await Vendor.findOneAndUpdate(
      { "slug.en": v.slug },
      {
        $setOnInsert: { ownerUserId: owner._id },
        $set: {
          legalName: { en: v.en, ar: v.ar }, tradeName: v.en.replace(" (Demo)", ""), companyType: v.type,
          description: { en: `${v.en}: fictional demo supplier based in ${v.city}.`, ar: `${v.ar}: مورد تجريبي في ${v.city}.` },
          location: { country: "SA", city: v.city, region: v.city }, citiesServed: v.cities, yearEstablished: v.years,
          certifications: v.certs, status: "verified", verificationStatus: "verified", completenessScore: 80,
          crNumber: "1010000000", vatNumber: "300000000000003", slug: { en: v.slug, ar: v.slug },
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    vendorIds.set(v.slug, doc._id as mongoose.Types.ObjectId);
  }

  let created = 0;
  for (const it of ITEMS) {
    const cat = await Category.findOne({ $or: it.cat.flatMap((c) => [{ "slug.en": c }, { catalogKey: c }]) }).select("_id");
    for (const [vslug, price, moq, lead] of it.offers) {
      const vid = vendorIds.get(vslug);
      if (!vid) continue;
      const sku = `DEMO-${it.key}-${vslug.split("-")[0]}`.toUpperCase();
      const res = await Product.updateOne(
        { sku },
        {
          $set: {
            vendorId: vid, sku, name: { en: it.en, ar: it.ar },
            shortDescription: { en: `${it.en}, supplied from ${VENDORS.find((x) => x.slug === vslug)?.city}. Demo listing.`, ar: `${it.ar}. عرض تجريبي.` },
            description: { en: "Fictional demo listing for Hukum design and testing.", ar: "عرض تجريبي لتصميم واختبار حكم." },
            categoryId: cat?._id, price, currency: "SAR", priceType: "starting_from", moq, unit: it.unit, leadTime: lead,
            tags: it.tags, status: "published", completenessScore: 82, requestQuote: true,
            media: [{ url: `/images/categories/${it.img}.webp`, type: "image", isPrimary: true, order: 0, alt: { en: it.en, ar: it.ar } }],
            slug: { en: `${it.key}-${vslug}`, ar: `${it.key}-${vslug}` },
          },
        },
        { upsert: true }
      );
      created += res.upsertedCount || 0;
    }
  }
  console.log(`vendors: ${VENDORS.length} upserted, products created: ${created}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
