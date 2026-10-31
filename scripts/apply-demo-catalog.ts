import { Product } from "../src/modules/products/product.model";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { filledProductFields, vendorLogoSrc } from "../src/lib/product-visuals";
import { productCompleteness } from "../src/modules/products/completeness";

function emptyText(value?: { en?: string; ar?: string } | null) {
  return !value?.en && !value?.ar;
}

export async function applyDemoCatalog() {
  const products = await Product.find();
  let productCount = 0;
  for (const product of products) {
    const fill = filledProductFields({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      shortDescription: product.shortDescription,
      categoryKey: Array.isArray(product.tags)
        ? product.tags.find((t: string) => t.includes("-") && !["ppe", "b2b", "demo", "fr"].includes(t))
        : undefined,
    });
    product.media = fill.media;
    if (emptyText(product.description)) product.description = fill.description;
    if (emptyText(product.shortDescription)) product.shortDescription = fill.shortDescription;
    if (!product.manufacturer) product.manufacturer = fill.manufacturer;
    if (!product.countryOfOrigin) product.countryOfOrigin = fill.countryOfOrigin;
    if (!product.hsCode) product.hsCode = fill.hsCode;
    if (!product.leadTime) product.leadTime = fill.leadTime;
    if (!product.paymentTerms) product.paymentTerms = fill.paymentTerms;
    if (!product.certifications?.length) product.certifications = fill.certifications;
    if (!product.tags?.length) product.tags = fill.tags;
    if (emptyText(product.applications)) product.applications = fill.applications;
    if (!product.condition) product.condition = "new";
    if (!product.availability) product.availability = "in_stock";
    product.requestQuote = true;
    if (!product.seo?.title?.en) product.seo = fill.seo;
    if (!product.shipping?.available) {
      product.shipping = {
        available: true,
        method: "Road freight",
        estimatedDelivery: product.leadTime || fill.leadTime,
        deliveryAreas: ["Riyadh", "Jeddah", "Dammam"],
        warehouseLocation: "Riyadh",
        pickupAvailable: true,
      };
    }
    try {
      const completeness = productCompleteness(product.toObject());
      product.completenessScore = completeness.score;
      product.seoReadinessScore = completeness.seoScore;
    } catch {
      product.completenessScore = Math.max(product.completenessScore || 0, 80);
    }
    await product.save();
    productCount += 1;
  }

  const vendors = await Vendor.find();
  let vendorCount = 0;
  for (const vendor of vendors) {
    const logo = vendorLogoSrc(vendor as { legalName?: { en?: string }; tradeName?: string; slug?: { en?: string }; logo?: string });
    vendor.logo = logo;
    if (!vendor.coverImage) vendor.coverImage = logo;
    if (!vendor.website) vendor.website = `https://kingdomtrade.demo/${vendor.slug?.en || "vendor"}`;
    await vendor.save();
    vendorCount += 1;
  }

  return { productCount, vendorCount };
}
