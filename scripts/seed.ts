import "dotenv/config";
import { connectDB } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { User } from "../src/modules/users/user.model";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { Buyer } from "../src/modules/organizations/organization.model";
import { Industry, Category, Attribute } from "../src/modules/categories/taxonomy.model";
import { Product } from "../src/modules/products/product.model";
import { Location, SubscriptionPlan, PromptTemplate, CMSPage } from "../src/modules/platform/platform.model";
import { RFQ, RFQVendor, Quotation } from "../src/modules/rfqs/rfq.model";
import { MARKETPLACE_CATEGORIES } from "../src/data/marketplace-categories";
import { applyDemoCatalog } from "./apply-demo-catalog";
import { FULL_DEMO_CATALOG } from "./full-demo-catalog";
import { filledProductFields } from "../src/lib/product-visuals";
import { slugifyText } from "../src/lib/utils";

const cities = [
  ["Riyadh", "الرياض"],
  ["Jeddah", "جدة"],
  ["Dammam", "الدمام"],
  ["Khobar", "الخبر"],
  ["Dhahran", "الظهران"],
  ["Mecca", "مكة"],
  ["Medina", "المدينة"],
  ["Tabuk", "تبوك"],
  ["Abha", "أبها"],
  ["Taif", "الطائف"],
  ["Jubail", "الجبيل"],
  ["Yanbu", "ينبع"],
  ["Qassim", "القصيم"],
  ["Hail", "حائل"],
  ["Jazan", "جازان"],
  ["Najran", "نجران"],
  ["AlUla", "العلا"],
];

async function main() {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || "seed-secret-change-me-32chars!!";
  await connectDB();
  console.log("Seeding Kingdom Trade (fictional demo data)…");

  await Promise.all([
    User.deleteMany({}),
    Vendor.deleteMany({}),
    Buyer.deleteMany({}),
    Industry.deleteMany({}),
    Category.deleteMany({}),
    Attribute.deleteMany({}),
    Product.deleteMany({}),
    Location.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
    PromptTemplate.deleteMany({}),
    CMSPage.deleteMany({}),
    RFQ.deleteMany({}),
    RFQVendor.deleteMany({}),
    Quotation.deleteMany({}),
  ]);

  for (const [en, ar] of cities) {
    await Location.create({ country: "SA", city: { en, ar }, status: "active" });
  }

  const admin = await User.create({
    email: "admin@kingdomtrade.demo",
    passwordHash: await hashPassword("Admin123!"),
    name: "Platform Admin",
    roles: ["super_admin", "admin"],
    preferredLanguage: "en",
    emailVerified: true,
  });

  const buyerUser = await User.create({
    email: "buyer@kingdomtrade.demo",
    passwordHash: await hashPassword("Buyer123!"),
    name: "Sara Procurement",
    roles: ["buyer", "buyer_org_admin"],
    preferredLanguage: "en",
  });
  await Buyer.create({ userId: buyerUser._id, type: "procurement", company: "Najd Industrial Co (Demo)", city: "Riyadh" });

  const vendorUser = await User.create({
    email: "vendor@kingdomtrade.demo",
    passwordHash: await hashPassword("Vendor123!"),
    name: "Ahmed Supplier",
    roles: ["vendor_owner"],
    preferredLanguage: "ar",
  });

  // Industries + full marketplace category catalog (mock data)
  const industryByName = new Map<string, { _id: unknown }>();
  for (const cat of MARKETPLACE_CATEGORIES) {
    const key = cat.industry.en;
    if (!industryByName.has(key)) {
      const slugEn = key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const ind = await Industry.create({
        name: cat.industry,
        slug: { en: slugEn, ar: slugEn },
        description: {
          en: `${cat.industry.en} suppliers and procurement on Kingdom Trade.`,
          ar: `موردو ومشتريات ${cat.industry.ar} على كينغدوم تريد.`,
        },
        icon: cat.key,
        order: industryByName.size + 1,
        status: "active",
      });
      industryByName.set(key, ind);
    }
  }

  const categoryByKey = new Map<string, { _id: unknown }>();
  for (const cat of MARKETPLACE_CATEGORIES) {
    const industry = industryByName.get(cat.industry.en)!;
    const created = await Category.create({
      industryId: industry._id,
      parentId: null,
      level: 1,
      name: cat.name,
      description: cat.description,
      slug: cat.slug,
      icon: cat.key,
      catalogKey: cat.key,
      image: `/categories/${cat.key}.jpg`,
      order: cat.order,
      status: "active",
    });
    categoryByKey.set(cat.key, created);

    if (cat.children?.length) {
      for (let i = 0; i < cat.children.length; i++) {
        const child = cat.children[i];
        const level2 = await Category.create({
          industryId: industry._id,
          parentId: created._id,
          level: 2,
          name: child.name,
          slug: child.slug,
          icon: child.key,
          order: i + 1,
          status: "active",
        });
        categoryByKey.set(child.key, level2);
      }
    }
  }

  const helmets = categoryByKey.get("safety-helmets") || categoryByKey.get("safety-equipment")!;
  const cement = categoryByKey.get("cement") || categoryByKey.get("building-materials")!;
  const frUniforms = categoryByKey.get("fr-uniforms") || categoryByKey.get("apparel")!;
  const safety = industryByName.get("Safety & PPE")!;
  const construction = industryByName.get("Construction")!;
  const textiles = industryByName.get("Apparel & Textiles")!;
  const ppe = categoryByKey.get("safety-equipment")!;
  const head = categoryByKey.get("safety-helmets") || ppe;
  const building = categoryByKey.get("building-materials")!;
  const cementCat = categoryByKey.get("cement") || building;
  const uniforms = categoryByKey.get("apparel")!;
  const industrialUniforms = categoryByKey.get("workwear") || uniforms;

  const materialAttr = await Attribute.create({
    key: "material",
    label: { en: "Material", ar: "المادة" },
    type: "dropdown",
    filterable: true,
    searchable: true,
    required: true,
    options: [
      { label: { en: "ABS", ar: "ABS" }, value: "abs" },
      { label: { en: "HDPE", ar: "HDPE" }, value: "hdpe" },
    ],
    categoryIds: [helmets._id],
  });
  await Attribute.create({
    key: "size",
    label: { en: "Size", ar: "المقاس" },
    type: "dropdown",
    filterable: true,
    required: true,
    options: [
      { label: { en: "M", ar: "M" }, value: "m" },
      { label: { en: "L", ar: "L" }, value: "l" },
    ],
    categoryIds: [helmets._id],
  });
  await Attribute.create({
    key: "certification",
    label: { en: "Certification", ar: "الشهادة" },
    type: "text",
    filterable: true,
    searchable: true,
    required: true,
    categoryIds: [helmets._id],
  });
  await Attribute.create({
    key: "cement_type",
    label: { en: "Cement Type", ar: "نوع الأسمنت" },
    type: "dropdown",
    filterable: true,
    options: [
      { label: { en: "Portland", ar: "بورتلاند" }, value: "portland" },
    ],
    categoryIds: [cement._id],
  });

  await Category.findByIdAndUpdate(helmets._id, { attributeIds: [materialAttr._id], filterKeys: ["material", "size", "certification"] });

  const vendor = await Vendor.create({
    ownerUserId: vendorUser._id,
    legalName: { en: "Riyadh Safety Supplies (Demo)", ar: "مستلزمات السلامة بالرياض (تجريبي)" },
    tradeName: "RSS Demo",
    companyType: "distributor",
    description: {
      en: "Fictional demo distributor of industrial PPE in Riyadh. Not a real verified company.",
      ar: "موزع تجريبي لمعدات الحماية في الرياض. ليست شركة حقيقية موثقة.",
    },
    email: "vendor@kingdomtrade.demo",
    phone: "+966500000000",
    industries: [safety._id, textiles._id],
    categories: [helmets._id, frUniforms._id],
    citiesServed: ["Riyadh", "Jeddah", "Dammam"],
    location: { country: "SA", city: "Riyadh", region: "Riyadh" },
    moq: "50",
    leadTime: "7-14 days",
    certifications: ["ISO 9001 (demo)"],
    status: "verified",
    verificationStatus: "verified",
    completenessScore: 88,
    featured: true,
    slug: { en: "riyadh-safety-supplies-demo", ar: "riyadh-safety-demo" },
  });
  vendorUser.vendorId = vendor._id;
  await vendorUser.save();

  const vendor2 = await Vendor.create({
    ownerUserId: vendorUser._id,
    legalName: { en: "Najd Building Materials (Demo)", ar: "مواد بناء نجد (تجريبي)" },
    companyType: "wholesaler",
    description: { en: "Fictional cement and building materials wholesaler.", ar: "تاجر جملة تجريبي لمواد البناء." },
    email: "najd@kingdomtrade.demo",
    phone: "+966511111111",
    industries: [construction._id, safety._id],
    categories: [cement._id, helmets._id],
    citiesServed: ["Riyadh", "Qassim"],
    location: { country: "SA", city: "Riyadh" },
    status: "verified",
    verificationStatus: "verified",
    slug: { en: "najd-building-materials-demo", ar: "najd-building-demo" },
  });

  const vendor3 = await Vendor.create({
    ownerUserId: vendorUser._id,
    legalName: { en: "Eastern Gulf PPE (Demo)", ar: "معدات الحماية الشرقية (تجريبي)" },
    companyType: "manufacturer",
    description: { en: "Fictional Eastern Province PPE manufacturer.", ar: "مصنّع تجريبي لمعدات الحماية في المنطقة الشرقية." },
    email: "eastern@kingdomtrade.demo",
    phone: "+966522222222",
    industries: [safety._id],
    categories: [helmets._id],
    citiesServed: ["Dammam", "Khobar", "Riyadh"],
    location: { country: "SA", city: "Dammam" },
    status: "verified",
    verificationStatus: "verified",
    slug: { en: "eastern-gulf-ppe-demo", ar: "eastern-gulf-ppe-demo" },
  });

  const helmet = await Product.create({
    vendorId: vendor._id,
    sku: "HELM-IND-001",
    name: { en: "Industrial Safety Helmet", ar: "خوذة سلامة صناعية" },
    shortDescription: {
      en: "ABS industrial helmet for construction sites.",
      ar: "خوذة صناعية من ABS لمواقع الإنشاء.",
    },
    description: {
      en: "Demo product for Kingdom Trade seed data. Not a real certified listing.",
      ar: "منتج تجريبي لبيانات العرض. ليست قائمة شهادات حقيقية.",
    },
    brand: "SafeHead Demo",
    industryId: safety._id,
    categoryId: helmets._id,
    categoryPath: [ppe._id, head._id, helmets._id],
    price: 85,
    currency: "SAR",
    priceType: "starting_from",
    moq: 50,
    unit: "piece",
    condition: "new",
    leadTime: "5-10 days",
    availability: "in_stock",
    attributes: { material: "abs", size: "l", certification: "EN 397 (demo)" },
    status: "published",
    verificationStatus: "verified",
    completenessScore: 90,
    featured: true,
    slug: { en: "industrial-safety-helmet", ar: "industrial-safety-helmet" },
    requestQuote: true,
    shipping: { available: true, deliveryAreas: ["Riyadh", "Jeddah"] },
  });

  await Product.create({
    vendorId: vendor2._id,
    sku: "CEM-OPC-42",
    name: { en: "Portland Cement", ar: "أسمنت بورتلاند" },
    shortDescription: { en: "OPC bag cement — demo listing.", ar: "أسمنت بورتلاند — قائمة تجريبية." },
    brand: "Najd Cement Demo",
    industryId: construction._id,
    categoryId: cement._id,
    categoryPath: [building._id, cementCat._id, cement._id],
    price: 18,
    currency: "SAR",
    priceType: "fixed",
    moq: 100,
    unit: "carton",
    status: "published",
    verificationStatus: "verified",
    slug: { en: "portland-cement", ar: "portland-cement" },
    attributes: { cement_type: "portland", grade: "42.5" },
  });

  await Product.create({
    vendorId: vendor2._id,
    sku: "HELM-NAJD-01",
    name: { en: "Site Safety Helmet Pro", ar: "خوذة سلامة مواقع برو" },
    shortDescription: {
      en: "Comparable industrial helmet from Najd Building Materials.",
      ar: "خوذة صناعية مشابهة من مواد بناء نجد.",
    },
    brand: "NajdSafe Demo",
    industryId: safety._id,
    categoryId: helmets._id,
    categoryPath: [ppe._id, head._id, helmets._id],
    price: 79,
    currency: "SAR",
    priceType: "starting_from",
    moq: 40,
    unit: "piece",
    leadTime: "4-8 days",
    availability: "in_stock",
    status: "published",
    verificationStatus: "verified",
    featured: true,
    slug: { en: "site-safety-helmet-pro", ar: "site-safety-helmet-pro" },
    shipping: { available: true, deliveryAreas: ["Riyadh", "Qassim"], estimatedDelivery: "4-8 days" },
  });

  await Product.create({
    vendorId: vendor3._id,
    sku: "HELM-EAST-01",
    name: { en: "Eastern Vent Safety Helmet", ar: "خوذة سلامة شرقية بتهوية" },
    shortDescription: {
      en: "Vented safety helmet — alternate vendor listing.",
      ar: "خوذة سلامة بتهوية — قائمة من مورد بديل.",
    },
    brand: "GulfGuard Demo",
    industryId: safety._id,
    categoryId: helmets._id,
    categoryPath: [ppe._id, head._id, helmets._id],
    price: 92,
    currency: "SAR",
    priceType: "starting_from",
    moq: 30,
    unit: "piece",
    leadTime: "3-7 days",
    availability: "in_stock",
    status: "published",
    verificationStatus: "verified",
    featured: true,
    slug: { en: "eastern-vent-safety-helmet", ar: "eastern-vent-safety-helmet" },
    shipping: { available: true, deliveryAreas: ["Dammam", "Khobar", "Riyadh"], estimatedDelivery: "3-7 days" },
  });

  await Product.create({
    vendorId: vendor._id,
    sku: "UNI-FR-500",
    name: { en: "FR Coverall", ar: "بدلة مقاومة للحريق" },
    shortDescription: { en: "Fire resistant coverall — demo.", ar: "بدلة مقاومة للحريق — تجريبي." },
    industryId: textiles._id,
    categoryId: frUniforms._id,
    categoryPath: [uniforms._id, industrialUniforms._id, frUniforms._id],
    priceType: "price_on_request",
    moq: 500,
    status: "published",
    slug: { en: "fr-coverall", ar: "fr-coverall" },
  });

  // Full mock catalog across every marketplace category (+ extras)
  for (const item of FULL_DEMO_CATALOG) {
    const cat = categoryByKey.get(item.categoryKey);
    const indName = MARKETPLACE_CATEGORIES.find((c) => c.key === item.categoryKey)?.industry.en;
    const ind = indName ? industryByName.get(indName) : undefined;
    if (!cat || !ind) continue;

    const fill = filledProductFields({
      sku: item.sku,
      name: item.name,
      brand: item.brand,
      categoryKey: item.categoryKey,
      shortDescription: {
        en: `Demo B2B listing for ${item.name.en} — realistic catalogue mockup for Kingdom Trade.`,
        ar: `قائمة B2B تجريبية لـ ${item.name.ar} — عرض كتالوج واقعي لمنصة Kingdom Trade.`,
      },
    });

    await Product.create({
      vendorId: vendor._id,
      sku: item.sku,
      name: item.name,
      shortDescription: fill.shortDescription,
      description: fill.description,
      brand: item.brand,
      manufacturer: fill.manufacturer,
      countryOfOrigin: fill.countryOfOrigin,
      hsCode: fill.hsCode,
      industryId: ind._id,
      categoryId: cat._id,
      categoryPath: [cat._id],
      price: item.price,
      currency: "SAR",
      priceType: item.price ? "starting_from" : "price_on_request",
      moq: item.moq ?? 10,
      unit: item.unit || "piece",
      leadTime: fill.leadTime,
      paymentTerms: fill.paymentTerms,
      certifications: fill.certifications,
      tags: [...fill.tags, item.categoryKey],
      applications: fill.applications,
      condition: "new",
      availability: "in_stock",
      media: fill.media,
      seo: fill.seo,
      shipping: {
        available: true,
        method: "Road freight",
        estimatedDelivery: fill.leadTime,
        deliveryAreas: ["Riyadh", "Jeddah", "Dammam", "Khobar"],
        warehouseLocation: "Riyadh",
        pickupAvailable: true,
      },
      status: "published",
      verificationStatus: "verified",
      featured: true,
      requestQuote: true,
      completenessScore: 92,
      seoReadinessScore: 88,
      slug: {
        en: slugifyText(item.name.en) || item.sku.toLowerCase().replace(/_/g, "-"),
        ar: slugifyText(item.name.ar) || item.sku.toLowerCase().replace(/_/g, "-"),
      },
    });
  }

  const rfq = await RFQ.create({
    buyerId: buyerUser._id,
    title: { en: "Safety helmets for Riyadh site", ar: "خوذ سلامة لموقع الرياض" },
    description: { en: "Need 500 industrial safety helmets delivered to Riyadh.", ar: "نحتاج 500 خوذة سلامة للرياض." },
    items: [
      {
        productId: helmet._id,
        categoryId: helmets._id,
        name: { en: "Industrial Safety Helmet", ar: "خوذة سلامة" },
        quantity: 500,
        unit: "piece",
        specifications: "ABS, EN 397",
      },
    ],
    deliveryLocation: { country: "SA", city: "Riyadh" },
    budget: 50000,
    currency: "SAR",
    status: "open",
    deadline: new Date(Date.now() + 14 * 86400000),
  });

  await RFQVendor.create({
    rfqId: rfq._id,
    vendorId: vendor._id,
    status: "invited",
    matchReasons: ["Supports requested category", "Serves Riyadh", "Verified vendor"],
    matchScore: 85,
  });

  await Quotation.create({
    rfqId: rfq._id,
    vendorId: vendor._id,
    lines: [{ name: "Industrial Safety Helmet", quantity: 500, unitPrice: 75, total: 37500 }],
    currency: "SAR",
    subtotal: 37500,
    tax: 5625,
    shipping: 500,
    total: 43625,
    leadTime: "10 days",
    deliveryTime: "12 days",
    paymentTerms: "Net 30",
    warranty: "12 months",
    status: "submitted",
  });

  await SubscriptionPlan.insertMany([
    { key: "free", name: { en: "Free", ar: "مجاني" }, price: 0, currency: "SAR", features: { productLimit: 10, aiUploads: 2, rfqs: 5, analytics: false, microsite: false, teamMembers: 1 } },
    { key: "basic", name: { en: "Basic", ar: "أساسي" }, price: 299, currency: "SAR", features: { productLimit: 100, aiUploads: 20, rfqs: 50, analytics: true, microsite: true, teamMembers: 3 } },
    { key: "professional", name: { en: "Professional", ar: "احترافي" }, price: 799, currency: "SAR", features: { productLimit: 1000, aiUploads: 100, rfqs: 200, analytics: true, featuredListings: true, microsite: true, verification: true, teamMembers: 10 } },
    { key: "enterprise", name: { en: "Enterprise", ar: "مؤسسي" }, price: 0, currency: "SAR", features: { productLimit: -1, aiUploads: -1, rfqs: -1, analytics: true, featuredListings: true, microsite: true, verification: true, teamMembers: -1 } },
  ]);

  await PromptTemplate.insertMany([
    { key: "product_extraction", name: "Product Extraction", prompt: "Extract B2B products as JSON array…", active: true, version: 1 },
    { key: "translation", name: "Translation", prompt: "Translate commercial B2B text accurately.", active: true, version: 1 },
    { key: "seo_generation", name: "SEO Generation", prompt: "Generate SEO JSON {title, description, keywords}.", active: true, version: 1 },
    { key: "rfq_extraction", name: "RFQ Extraction", prompt: "Extract RFQ intent as JSON.", active: true, version: 1 },
    { key: "moderation", name: "Moderation", prompt: "Flag spam/misleading/restricted content as JSON {flags}.", active: true, version: 1 },
  ]);

  await CMSPage.insertMany([
    {
      type: "faq",
      title: { en: "How does vendor verification work?", ar: "كيف يعمل توثيق المورد؟" },
      body: { en: "Vendors submit documents for AI-assisted review followed by human approval.", ar: "يقدم الموردون المستندات لمراجعة بمساعدة الذكاء الاصطناعي ثم موافقة بشرية." },
      status: "published",
      slug: { en: "vendor-verification", ar: "vendor-verification" },
    },
    {
      type: "blog",
      title: { en: "Sourcing PPE in Saudi Arabia", ar: "توريد معدات الحماية في السعودية" },
      excerpt: { en: "A practical overview for procurement teams.", ar: "نظرة عملية لفرق المشتريات." },
      body: { en: "Demo article — fictional content for Kingdom Trade.", ar: "مقال تجريبي." },
      status: "published",
      slug: { en: "sourcing-ppe-saudi", ar: "sourcing-ppe-saudi" },
    },
  ]);

  await applyDemoCatalog();

  console.log("Seed complete.");
  console.log("Admin: admin@kingdomtrade.demo / Admin123!");
  console.log("Buyer: buyer@kingdomtrade.demo / Buyer123!");
  console.log("Vendor: vendor@kingdomtrade.demo / Vendor123!");
  console.log("NOTE: All companies/certifications are fictional demo data.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
