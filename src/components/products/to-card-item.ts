// Maps a product (vendor populated) to the homepage card shape so every listing uses one card:
// MOQ · price · lead time · supplier + city · Request quote (D9: Haraj-speed cards).

import type { Locale } from "@/i18n/config";
import type { PopularProductItem } from "@/components/home/PopularProductCard";
import { localizeDuration, unitLabel } from "@/lib/money";
import { cityName } from "@/lib/cities";
import { formatPrice, mediaList, type ProductLike, type VendorLike } from "./product-helpers";

type CardProduct = ProductLike & { vendorId?: VendorLike | unknown; tags?: string[]; certifications?: string[] };

export function toCardItem(p: CardProduct, locale: Locale): PopularProductItem {
  const isAr = locale === "ar";
  const id = String(p._id);
  const slug = p.slug?.en || id;
  const vendor = (p.vendorId && typeof p.vendorId === "object" ? p.vendorId : null) as VendorLike | null;
  const vendorId = vendor?._id ? String(vendor._id) : "";
  const vendorName =
    vendor?.tradeName || (isAr ? vendor?.legalName?.ar || vendor?.legalName?.en : vendor?.legalName?.en || vendor?.legalName?.ar) || "";
  const verified = vendor?.verificationStatus === "verified";
  const price = formatPrice(p, locale);
  const tags = [...new Set([...(p.tags || []), ...(p.certifications || [])].map((t) => String(t).trim()).filter(Boolean))].slice(0, 3);

  return {
    id,
    href: `/${locale}/products/${slug}`,
    cover: mediaList(p)[0]?.url,
    brand: p.brand || "",
    sku: p.sku || p.productCode || "",
    title: (isAr ? p.name?.ar || p.name?.en : p.name?.en || p.name?.ar) || p.brand || "Product",
    tags,
    moqLabel: p.moq != null ? `${p.moq.toLocaleString("en-US")}${p.unit ? ` ${unitLabel(p.unit, locale)}` : ""}` : isAr ? "حسب الاتفاق" : "Negotiable",
    priceLabel: price.public ? price.label : isAr ? "اطلب السعر" : "Request price",
    leadTimeLabel: localizeDuration(p.leadTime, locale) || (isAr ? "حسب الاتفاق" : "On request"),
    verified,
    verifiedLabel: verified ? (isAr ? "مورد موثّق" : "Verified supplier") : "",
    vendorName,
    city: cityName(vendor?.location?.city, locale) || undefined,
    slug,
    rfqHref: `/${locale}/rfq?productId=${encodeURIComponent(id)}${vendorId ? `&vendorId=${encodeURIComponent(vendorId)}` : ""}`,
  };
}
