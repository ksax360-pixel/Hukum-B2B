// scripts/seed-demo-batch.ts
// More demo suppliers and products with real photos from /public. Safe to run again: every record is tagged
// "demo-batch-2026-11" and upserted by slug/SKU. All companies are fictional and marked "(Demo)"; none is
// marked Verified (copy rule: no fake trust signals). Run: MONGODB_URI=... npx tsx scripts/seed-demo-batch.ts

import mongoose from "mongoose";

const TAG = "demo-batch-2026-11";
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

type Theme = {
  img: string; cat: string; unit: string; brand: string;
  items: Array<{ en: string; ar: string; price: number; moq: number; lead: string; specs: Array<[string, string]>; desc: string }>;
};

const THEMES: Theme[] = [
  { img: "helmet", cat: "safety-equipment", unit: "piece", brand: "ShieldLine", items: [
    { en: "Safety helmet, ABS, EN 397, white", ar: "خوذة سلامة ABS بيضاء EN 397", price: 24, moq: 50, lead: "3 days", specs: [["Material", "ABS"], ["Standard", "EN 397"], ["Harness", "4-point"]], desc: "Vented ABS shell with ratchet harness and sweatband. For construction and plant sites." },
    { en: "Safety helmet with visor, yellow", ar: "خوذة سلامة مع واقي وجه صفراء", price: 58, moq: 30, lead: "5 days", specs: [["Material", "HDPE"], ["Visor", "Polycarbonate"], ["Colour", "Yellow"]], desc: "Helmet with flip-up clear visor for grinding and cutting work." },
    { en: "Climbing helmet with chin strap", ar: "خوذة عمل على المرتفعات مع حزام ذقن", price: 96, moq: 20, lead: "7 days", specs: [["Standard", "EN 12492"], ["Chin strap", "4-point"]], desc: "For work at height and rope access. Retains on impact." },
  ] },
  { img: "coverall", cat: "safety-equipment", unit: "piece", brand: "WorkFit", items: [
    { en: "Cotton coverall, navy, reflective tape", ar: "أفرول قطني كحلي مع شريط عاكس", price: 65, moq: 50, lead: "7 days", specs: [["Fabric", "100% cotton, 240 gsm"], ["Sizes", "S to 3XL"]], desc: "Two-way zip, reflective tape on arms and legs. Company logo printing available." },
    { en: "Flame-retardant coverall, NFPA 2112", ar: "أفرول مقاوم للهب NFPA 2112", price: 210, moq: 20, lead: "14 days", specs: [["Standard", "NFPA 2112"], ["Fabric", "FR cotton"]], desc: "For oil and gas and hot-work areas." },
    { en: "Disposable coverall, Type 5/6", ar: "أفرول استخدام واحد نوع 5/6", price: 14, moq: 200, lead: "3 days", specs: [["Type", "5/6"], ["Material", "SMS"]], desc: "Hooded, elasticated cuffs. For cleanrooms, painting and dust." },
  ] },
  { img: "cement", cat: "building-materials", unit: "bag", brand: "Najd Cement", items: [
    { en: "Ordinary Portland cement, 50 kg", ar: "أسمنت بورتلاندي عادي 50 كجم", price: 16, moq: 500, lead: "2 days", specs: [["Type", "OPC 42.5"], ["Bag", "50 kg"]], desc: "SASO-certified OPC for general concrete work. Delivered on pallets." },
    { en: "Sulphate-resisting cement, 50 kg", ar: "أسمنت مقاوم للكبريتات 50 كجم", price: 19, moq: 500, lead: "3 days", specs: [["Type", "SRC"], ["Use", "Foundations"]], desc: "For foundations and coastal projects exposed to sulphates." },
    { en: "White cement, 40 kg", ar: "أسمنت أبيض 40 كجم", price: 42, moq: 100, lead: "4 days", specs: [["Bag", "40 kg"], ["Use", "Finishing"]], desc: "For terrazzo, tile grout and architectural finishes." },
  ] },
  { img: "cable", cat: "electrical", unit: "meter", brand: "VoltArc", items: [
    { en: "Copper power cable 4×16 mm², XLPE", ar: "كابل طاقة نحاسي 4×16 مم² XLPE", price: 38, moq: 500, lead: "5 days", specs: [["Cores", "4"], ["Insulation", "XLPE"], ["Voltage", "0.6/1 kV"]], desc: "Armoured low-voltage cable to IEC 60502-1." },
    { en: "Building wire 2.5 mm², 100 m roll", ar: "سلك كهرباء 2.5 مم² لفة 100 م", price: 145, moq: 20, lead: "2 days", specs: [["Size", "2.5 mm²"], ["Roll", "100 m"]], desc: "PVC insulated single-core copper wire for building installations." },
    { en: "Cat6 network cable, 305 m box", ar: "كابل شبكة Cat6 صندوق 305 م", price: 420, moq: 5, lead: "3 days", specs: [["Category", "Cat6 U/UTP"], ["Length", "305 m"]], desc: "Solid copper conductors, LSZH jacket." },
  ] },
  { img: "carton", cat: "packaging", unit: "piece", brand: "PackRight", items: [
    { en: "Corrugated shipping carton, 5-ply", ar: "كرتون شحن مضلع 5 طبقات", price: 4.5, moq: 1000, lead: "7 days", specs: [["Ply", "5"], ["Size", "60×40×40 cm"]], desc: "Heavy-duty export carton. Custom printing on request." },
    { en: "Stretch film roll, 23 micron", ar: "لفة ستريتش 23 ميكرون", price: 68, moq: 50, lead: "3 days", specs: [["Thickness", "23 µm"], ["Width", "50 cm"]], desc: "Machine-grade pallet wrap." },
    { en: "Printed paper cups, 8 oz", ar: "أكواب ورقية مطبوعة 8 أونصة", price: 0.32, moq: 5000, lead: "10 days", specs: [["Size", "8 oz"], ["Wall", "Single"]], desc: "Food-grade paper with PE lining, up to 4-colour print." },
  ] },
  { img: "hvac", cat: "hvac", unit: "unit", brand: "CoolTech", items: [
    { en: "Split air conditioner, 24,000 BTU, inverter", ar: "مكيف سبليت 24,000 وحدة انفرتر", price: 2650, moq: 5, lead: "5 days", specs: [["Capacity", "24,000 BTU"], ["Refrigerant", "R410A"], ["Rating", "SASO high efficiency"]], desc: "Wall-mounted inverter split unit rated for 52°C ambient." },
    { en: "Ducted unit, 5 ton", ar: "وحدة مخفية 5 طن", price: 11800, moq: 1, lead: "14 days", specs: [["Capacity", "5 TR"], ["Supply", "380V 3-phase"]], desc: "For offices and villas. Installation available in Riyadh and Jeddah." },
  ] },
  { img: "pump", cat: "industrial-machinery", unit: "unit", brand: "AquaForce", items: [
    { en: "Centrifugal water pump, 5.5 kW", ar: "مضخة مياه طاردة مركزية 5.5 كيلوواط", price: 3400, moq: 1, lead: "7 days", specs: [["Power", "5.5 kW"], ["Head", "48 m"], ["Flow", "30 m³/h"]], desc: "Cast-iron end-suction pump for building water systems." },
    { en: "Submersible borehole pump, 4 inch", ar: "مضخة غاطسة للآبار 4 بوصة", price: 2150, moq: 1, lead: "10 days", specs: [["Diameter", "4 in"], ["Stages", "18"]], desc: "Stainless steel for farm and borehole use." },
  ] },
  { img: "solar", cat: "renewable-energy", unit: "piece", brand: "SunPeak", items: [
    { en: "Solar panel 550 W, mono PERC", ar: "لوح شمسي 550 واط أحادي PERC", price: 520, moq: 20, lead: "10 days", specs: [["Power", "550 W"], ["Cells", "144 half-cut"]], desc: "Tier-1 module with 25-year power warranty." },
    { en: "Hybrid solar inverter, 10 kW", ar: "عاكس شمسي هجين 10 كيلوواط", price: 6900, moq: 1, lead: "14 days", specs: [["Power", "10 kW"], ["Battery", "48V"]], desc: "Grid-tie with battery backup and app monitoring." },
  ] },
  { img: "medical", cat: "medical-equipment", unit: "box", brand: "ClinicCare", items: [
    { en: "Nitrile examination gloves, box of 100", ar: "قفازات فحص نتريل علبة 100", price: 22, moq: 100, lead: "3 days", specs: [["Material", "Nitrile"], ["Powder", "Free"]], desc: "SFDA-registered, ambidextrous, sizes S to XL." },
    { en: "Digital blood pressure monitor", ar: "جهاز قياس ضغط رقمي", price: 165, moq: 10, lead: "5 days", specs: [["Cuff", "22–42 cm"], ["Memory", "2×90"]], desc: "Clinically validated upper-arm monitor." },
    { en: "Surgical face mask, 3-ply, box of 50", ar: "كمامات طبية 3 طبقات علبة 50", price: 9, moq: 200, lead: "2 days", specs: [["BFE", "≥98%"], ["Type", "IIR"]], desc: "Fluid-resistant mask with ear loops." },
  ] },
  { img: "coffee", cat: "food-beverage", unit: "kg", brand: "Oasis Roasters", items: [
    { en: "Saudi Khawlani coffee beans, 1 kg", ar: "بن خولاني سعودي 1 كجم", price: 145, moq: 10, lead: "4 days", specs: [["Origin", "Jazan"], ["Roast", "Light"]], desc: "Single-origin Arabica from the Jazan highlands." },
    { en: "Arabic coffee with cardamom, 500 g", ar: "قهوة عربية بالهيل 500 جم", price: 42, moq: 50, lead: "3 days", specs: [["Blend", "With cardamom"], ["Pack", "500 g"]], desc: "Ready-ground for offices, hotels and majlis." },
  ] },
  { img: "fabric", cat: "textiles", unit: "meter", brand: "Najd Textiles", items: [
    { en: "Polyester-cotton uniform fabric", ar: "قماش زي موحد بوليستر قطن", price: 18, moq: 300, lead: "7 days", specs: [["Blend", "65/35"], ["Weight", "220 gsm"]], desc: "Hard-wearing twill for workwear and uniforms." },
    { en: "Blackout curtain fabric", ar: "قماش ستائر بلاك آوت", price: 34, moq: 100, lead: "10 days", specs: [["Width", "280 cm"], ["Blackout", "100%"]], desc: "For hotels and offices." },
  ] },
  { img: "print", cat: "printing-services", unit: "piece", brand: "PrintHub", items: [
    { en: "Business cards, 350 gsm, box of 500", ar: "بطاقات عمل 350 جم علبة 500", price: 85, moq: 1, lead: "3 days", specs: [["Paper", "350 gsm matt"], ["Finish", "Spot UV option"]], desc: "Two-sided full colour, Arabic and English." },
    { en: "Roll-up banner with stand, 85×200 cm", ar: "بنر رول أب مع حامل 85×200 سم", price: 160, moq: 1, lead: "2 days", specs: [["Size", "85×200 cm"], ["Material", "PVC-free"]], desc: "Carry bag included." },
  ] },
  { img: "stationery", cat: "stationery", unit: "box", brand: "OfficePro", items: [
    { en: "A4 copy paper, 80 gsm, box of 5 reams", ar: "ورق تصوير A4 80 جم كرتون 5 رزم", price: 98, moq: 20, lead: "2 days", specs: [["Size", "A4"], ["Weight", "80 gsm"]], desc: "High-white paper for laser and inkjet printers." },
    { en: "Ballpoint pens, blue, box of 50", ar: "أقلام حبر أزرق علبة 50", price: 35, moq: 20, lead: "2 days", specs: [["Tip", "1.0 mm"], ["Colour", "Blue"]], desc: "Office everyday pens." },
  ] },
  { img: "toner", cat: "office-supplies", unit: "piece", brand: "PrintCare", items: [
    { en: "Compatible toner cartridge, 85A", ar: "حبر طابعة متوافق 85A", price: 75, moq: 10, lead: "3 days", specs: [["Yield", "1,600 pages"], ["Colour", "Black"]], desc: "For HP LaserJet P1102 and similar." },
  ] },
  { img: "drip", cat: "agriculture", unit: "roll", brand: "GreenFlow", items: [
    { en: "Drip irrigation pipe, 16 mm, 500 m roll", ar: "خرطوم ري بالتنقيط 16 مم لفة 500 م", price: 240, moq: 10, lead: "5 days", specs: [["Diameter", "16 mm"], ["Spacing", "30 cm"]], desc: "UV-stabilised for farms and landscaping." },
  ] },
  { img: "service", cat: "facility-management", unit: "service", brand: "FacilityOne", items: [
    { en: "Office deep cleaning, per 100 m²", ar: "تنظيف مكاتب عميق لكل 100 م²", price: 450, moq: 1, lead: "2 days", specs: [["Team", "4 cleaners"], ["Includes", "Materials"]], desc: "Weekend scheduling available in Riyadh, Jeddah and Dammam." },
    { en: "HVAC maintenance contract, per unit per year", ar: "عقد صيانة مكيفات سنوي لكل وحدة", price: 380, moq: 10, lead: "5 days", specs: [["Visits", "4 per year"], ["Includes", "Filter cleaning"]], desc: "Preventive maintenance with 24-hour call-out." },
  ] },
];

const SUPPLIERS = [
  { name: "Najd Industrial Safety (Demo)", ar: "نجد للسلامة الصناعية (تجريبي)", city: "Riyadh", type: "distributor", color: "#17634B", themes: ["helmet", "coverall"], banner: "safety-equipment", status: "unverified" },
  { name: "Coastal Building Supply (Demo)", ar: "الساحل لمواد البناء (تجريبي)", city: "Jeddah", type: "wholesaler", color: "#8A5A00", themes: ["cement"], banner: "building-materials", status: "pending" },
  { name: "Eastern Power Cables (Demo)", ar: "الشرقية لكابلات الطاقة (تجريبي)", city: "Dammam", type: "manufacturer", color: "#0F4C81", themes: ["cable", "solar"], banner: "electrical", status: "unverified" },
  { name: "Gulf Pack Solutions (Demo)", ar: "الخليج لحلول التغليف (تجريبي)", city: "Jubail", type: "manufacturer", color: "#7A2E2E", themes: ["carton", "print"], banner: "packaging", status: "pending" },
  { name: "Riyadh Cooling Systems (Demo)", ar: "الرياض لأنظمة التبريد (تجريبي)", city: "Riyadh", type: "distributor", color: "#1F2937", themes: ["hvac", "pump", "service"], banner: "hvac", status: "unverified" },
  { name: "Hijaz Medical Supplies (Demo)", ar: "الحجاز للمستلزمات الطبية (تجريبي)", city: "Medina", type: "distributor", color: "#0F766E", themes: ["medical"], banner: "medical-equipment", status: "pending" },
  { name: "Jazan Coffee House (Demo)", ar: "بيت قهوة جازان (تجريبي)", city: "Jazan", type: "manufacturer", color: "#5B3A1E", themes: ["coffee", "fabric"], banner: "food-beverage", status: "unverified" },
  { name: "Qassim Office & Farm (Demo)", ar: "القصيم للمكاتب والمزارع (تجريبي)", city: "Buraidah", type: "trading_company", color: "#3F3D56", themes: ["stationery", "toner", "drip"], banner: "office-supplies", status: "unverified" },
];

const slugify = (s: string): string => s.toLowerCase().replace(/\(demo\)/g, "demo").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main(): Promise<void> {
  await mongoose.connect(uri as string);
  const db = mongoose.connection.db!;
  const cats = await db.collection("categories").find({ level: 1 }).project({ catalogKey: 1, "slug.en": 1 }).toArray();
  const catId = (key: string): unknown => cats.find((c) => c.catalogKey === key || c.slug?.en === key)?._id;
  const byTheme = new Map(THEMES.map((t) => [t.img, t]));
  const now = new Date();
  let vendors = 0;
  let products = 0;

  for (const [si, s] of SUPPLIERS.entries()) {
    const slug = slugify(s.name);
    const banner = `/categories/${s.banner}.jpg`;
    const design = {
      headline: { en: "", ar: "" },
      tagline: { en: `${s.themes.map((t) => byTheme.get(t)?.brand).filter(Boolean).join(", ")} · ${s.city}`, ar: "" },
      about: { en: "", ar: "" }, bannerText: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" },
      primaryColor: s.color, logo: "", bannerImages: [banner], showProducts: true, showCertifications: true, showContactCta: true,
    };
    const v = await db.collection("vendors").findOneAndUpdate(
      { "slug.en": slug },
      {
        $set: {
          legalName: { en: s.name, ar: s.ar }, tradeName: s.name, companyType: s.type,
          location: { country: "SA", city: s.city }, citiesServed: [s.city, "Riyadh", "Jeddah", "Dammam"].filter((c, i, a) => a.indexOf(c) === i),
          description: { en: `Fictional demo supplier in ${s.city} for ${s.themes.map((t) => byTheme.get(t)?.cat.replace(/-/g, " ")).join(" and ")}.`, ar: `مورد تجريبي في ${s.city}.` },
          email: `${slug}@demo.hukum.test`, phone: "+966500000000",
          crNumber: s.status === "pending" ? `10${String(1000000 + si * 7919).slice(0, 8)}` : "",
          verificationStatus: s.status, status: s.status === "pending" ? "submitted" : "draft",
          yearEstablished: 2008 + si, coverImage: banner,
          storefront: { published: design, status: "approved" },
          demoTag: TAG, updatedAt: now,
        },
        $setOnInsert: { slug: { en: slug, ar: slug }, createdAt: now, ownerUserId: new mongoose.Types.ObjectId() },
      },
      { upsert: true, returnDocument: "after" }
    );
    const vendorId = v?._id;
    vendors++;

    for (const theme of s.themes) {
      const t = byTheme.get(theme);
      if (!t) continue;
      for (const [ii, it] of t.items.entries()) {
        const sku = `${theme.toUpperCase().slice(0, 3)}-${si}${ii}-${slugify(t.brand).slice(0, 4).toUpperCase()}`;
        const pslug = `${slugify(it.en)}-${slug.slice(0, 12)}-${si}${ii}`;
        const order = [0, 1, 2].map((k) => (k + ii) % 3);
        const media = order.map((k, i) => ({ url: `/products/${theme}${k === 0 ? "" : `-${k + 1}`}.jpg`, type: "image", isPrimary: i === 0, order: i, alt: { en: it.en, ar: it.ar } }));
        await db.collection("products").updateOne(
          { sku, vendorId },
          {
            $set: {
              name: { en: it.en, ar: it.ar }, description: { en: it.desc, ar: "" }, shortDescription: { en: it.desc.split(".")[0], ar: "" },
              brand: t.brand, categoryId: catId(t.cat), price: it.price, currency: "SAR", priceType: "starting_from", unit: t.unit,
              moq: it.moq, leadTime: it.lead, availability: "in_stock", media,
              customSpecifications: it.specs.map(([key, value]) => ({ key, value })), countryOfOrigin: "SA",
              status: "published", moderationStatus: "cleared", completenessScore: 78, tags: [t.cat, theme],
              slug: { en: pslug, ar: pslug }, demoTag: TAG, updatedAt: now,
            },
            $setOnInsert: { vendorId, sku, createdAt: now },
          },
          { upsert: true }
        );
        products++;
      }
    }
  }
  console.log(`demo batch: ${vendors} suppliers, ${products} products (tag ${TAG})`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
