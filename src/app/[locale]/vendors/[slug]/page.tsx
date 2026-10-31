export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { t as loc } from "@/lib/utils";
import { stripVendorContacts } from "@/lib/public-vendor";
import { composeMetadata, generateFromEntity, absUrl, localePath } from "@/modules/seo/engine";
import { breadcrumbLd, webPageLd } from "@/modules/seo/jsonld";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { toPlain, vendorLogoUrl, type ProductLike, type VendorLike } from "@/components/products/product-helpers";
import { VendorStorefront } from "@/components/vendors/VendorStorefront";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  try {
    await connectDB();
    const vendor = await Vendor.findOne({ $or: [{ "slug.en": slug }, { "slug.ar": slug }] })
      .select("legalName tradeName seo slug location companyType description logo verificationStatus")
      .lean();
    if (!vendor) {
      return composeMetadata({ locale, path: `/vendors/${slug}`, title: "Vendor", description: "", indexable: false });
    }
    const name = loc(locale, vendor.legalName) || vendor.tradeName || "Vendor";
    const typePhrase = vendor.companyType ? vendor.companyType.replace(/_/g, " ") : "supplier";
    const gen = generateFromEntity("vendor", locale, {
      name,
      typePhrase,
      locationPhrase: vendor.location?.city
        ? locale === "ar"
          ? ` في ${vendor.location.city}`
          : ` in ${vendor.location.city}`
        : "",
    });
    const indexable = vendor.verificationStatus === "verified" && vendor.seo?.indexable !== false;
    return composeMetadata({
      locale,
      path: `/vendors/${vendor.slug?.en || slug}`,
      title: gen.title,
      description: loc(locale, vendor.description) || gen.description,
      image: vendor.logo,
      seo: vendor.seo,
      indexable,
    });
  } catch {
    return composeMetadata({ locale, path: `/vendors/${slug}`, title: "Vendor", description: "Hukum vendor" });
  }
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  await connectDB();

  const rawVendor = await Vendor.findOne({
    $or: [{ "slug.en": slug }, { "slug.ar": slug }],
  }).lean();
  if (!rawVendor) notFound();

  const session = await getSession();
  const plainVendor = toPlain(rawVendor) as VendorLike & {
    yearEstablished?: number;
    whatsapp?: string;
    coverImage?: string;
    certifications?: string[];
    companyType?: string;
    description?: { en?: string; ar?: string };
    manufacturerProfile?: { factoryImages?: string[] };
    hasContact?: boolean;
  };
  // Always strip contacts from HTML — even signed-in users must use ContactRevealGate
  // (caps + PDPL + audit). Risk Register Critical #1.
  const vendor = stripVendorContacts(plainVendor as Record<string, unknown>) as typeof plainVendor;

  const vendorId = String(vendor._id);
  const products = toPlain(
    await Product.find({ vendorId: vendor._id, status: "published" })
      .sort({ featured: -1, createdAt: -1 })
      .limit(48)
      .lean()
  ) as ProductLike[];

  const name = loc(locale, vendor.legalName) || vendor.tradeName || "Vendor";
  const nameSecondary = isAr
    ? vendor.legalName?.en || vendor.tradeName || ""
    : vendor.legalName?.ar || "";
  const desc = loc(locale, vendor.description);
  const city = vendor.location?.city;
  const country =
    vendor.location?.country === "SA"
      ? isAr
        ? "السعودية"
        : "Saudi Arabia"
      : vendor.location?.country;
  const place = [city, country].filter(Boolean).join(", ");
  const verified = vendor.verificationStatus === "verified";
  const logo = vendorLogoUrl(vendor);

  try {
    await recordAnalyticsEvent({ type: "vendor_page_view", vendorId });
    await recordAnalyticsEvent({ type: "vendor_landing_view", vendorId });
  } catch {
    /* ignore */
  }

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: absUrl(localePath(locale, `/vendors/${vendor.slug?.en || slug}`)),
    logo: logo || undefined,
    description: desc || undefined,
    telephone: session ? vendor.phone || undefined : undefined,
    email: session ? vendor.email || undefined : undefined,
    address: city
      ? {
          "@type": "PostalAddress",
          addressLocality: city,
          addressCountry: vendor.location?.country || "SA",
          streetAddress: vendor.location?.address || undefined,
        }
      : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbLd(locale, [
              { name: isAr ? "الرئيسية" : "Home", path: "/" },
              { name: isAr ? "الموردون" : "Vendors", path: "/vendors" },
              { name },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageLd({
              name,
              description: desc,
              path: `/vendors/${vendor.slug?.en || slug}`,
              locale,
            })
          ),
        }}
      />
      <VendorStorefront
        locale={locale}
        vendor={vendor}
        products={products}
        name={name}
        nameSecondary={nameSecondary}
        description={desc}
        place={place}
        verified={verified}
      />
    </>
  );
}
