export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { Document } from "@/modules/documents/document.model";
import { t as loc } from "@/lib/utils";
import { stripVendorContacts } from "@/lib/public-vendor";
import { composeMetadata, generateFromEntity } from "@/modules/seo/engine";
import { ProductDetailMarketplace } from "@/components/products/ProductDetailMarketplace";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import {
  buildSpecGroups,
  pickHighlights,
  mediaList,
  productSlug,
  toPlain,
  type ProductLike,
  type VendorLike,
} from "@/components/products/product-helpers";

type DocRow = {
  _id?: string;
  name?: string;
  type?: string;
  fileUrl?: string;
  size?: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  try {
    await connectDB();
    const product = await Product.findOne({
      $or: [{ "slug.en": slug }, { "slug.ar": slug }],
    })
      .select("name brand seo slug shortDescription description media")
      .lean();
    if (!product) {
      return composeMetadata({
        locale,
        path: `/products/${slug}`,
        title: "Product",
        description: "Product listing on Hukum",
        indexable: false,
      });
    }
    const gen = generateFromEntity("product", locale, {
      name: loc(locale, product.name),
      brand: product.brand,
      brandPhrase: product.brand ? (locale === "ar" ? ` من ${product.brand}` : ` from ${product.brand}`) : "",
    });
    const image = Array.isArray(product.media)
      ? (product.media[0] as { url?: string } | undefined)?.url
      : undefined;
    return composeMetadata({
      locale,
      path: `/products/${product.slug?.en || slug}`,
      title: gen.title,
      description: loc(locale, product.shortDescription) || loc(locale, product.description) || gen.description,
      image,
      seo: product.seo,
      indexable: product.seo?.indexable !== false,
    });
  } catch {
    return composeMetadata({
      locale,
      path: `/products/${slug}`,
      title: "Hukum",
      description: "B2B product on Hukum",
    });
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  await connectDB();
  const session = await getSession();
  // Never select contact fields into RSC HTML — even for signed-in buyers (Risk C1 / PDF p.18).
  // Reveal only via /api/contact-reveal.
  const vendorSelect =
    "legalName tradeName verificationStatus location logo slug companyType yearEstablished certifications legal coverImage description";

  const rawProduct = await Product.findOne({
    $or: [
      { "slug.en": slug },
      { "slug.ar": slug },
      ...(slug.match(/^[a-f\d]{24}$/i) ? [{ _id: slug }] : []),
    ],
  })
    .populate({ path: "vendorId", select: vendorSelect })
    .populate("categoryId")
    .lean()
    .catch(() => null);

  if (!rawProduct) notFound();

  const product = toPlain(rawProduct) as ProductLike & {
    vendorId?: VendorLike & {
      yearEstablished?: number;
      whatsapp?: string;
      legal?: { authorizedRepresentative?: string };
    };
    categoryId?: {
      _id?: string;
      name?: { en?: string; ar?: string };
      parentId?: string;
      slug?: { en?: string };
    };
    featured?: boolean;
  };

  const rawVendor = (product.vendorId || null) as
    | (VendorLike & {
        yearEstablished?: number;
        whatsapp?: string;
        legal?: { authorizedRepresentative?: string };
      })
    | null;
  // Contacts never in page source — even for signed-in buyers (Risk C1).
  // Reveal only via /api/contact-reveal (PDPL + caps + audit).
  let vendor = stripVendorContacts(rawVendor as Record<string, unknown> | null) as
    | (VendorLike & {
        yearEstablished?: number;
        whatsapp?: string;
        legal?: { authorizedRepresentative?: string };
        hasContact?: boolean;
      })
    | null;
  if (vendor && rawVendor?._id) {
    const { Vendor } = await import("@/modules/vendors/vendor.model");
    const flags = await Vendor.findById(rawVendor._id)
      .select("phone email whatsapp website")
      .lean()
      .catch(() => null);
    vendor = {
      ...vendor,
      hasContact: Boolean(flags?.phone || flags?.email || flags?.whatsapp || flags?.website),
    };
  }
  // Public product must not embed contact fields in RSC/HTML (PDF p.18).
  // Keep vendorId as id string on product; pass stripped vendor separately.
  const publicProduct = {
    ...product,
    vendorId: vendor?._id ? String(vendor._id) : product.vendorId && typeof product.vendorId === "object" && "_id" in (product.vendorId as object)
      ? String((product.vendorId as { _id?: unknown })._id)
      : product.vendorId
        ? String(product.vendorId)
        : undefined,
  } as typeof product;
  const category = product.categoryId || null;

  type ParentCategory = { _id?: string; name?: { en?: string; ar?: string }; slug?: { en?: string } };
  let parentCategory: ParentCategory | null = null;
  if (category?.parentId) {
    parentCategory = toPlain(
      (await Category.findById(category.parentId).select("name slug").lean().catch(() => null)) as ParentCategory | null
    );
  }

  const productId = String(product._id);
  const vendorId = vendor?._id ? String(vendor._id) : undefined;
  const titleEn = product.name?.en || loc("en", product.name) || "Product";
  const titleAr = product.name?.ar || titleEn;
  const title = loc(locale, product.name);
  const shortDescription = loc(locale, product.shortDescription);
  const description = loc(locale, product.description) || shortDescription;
  const applicationsText = loc(locale, product.applications);
  const media = mediaList(product).map((m) => ({
    url: m.url,
    type: m.type,
    alt: loc(locale, m.alt) || title,
  }));

  const productDocs = toPlain(
    await Document.find({
      ownerType: "product",
      ownerId: productId,
      visibility: { $in: ["public", "admin"] },
      status: "active",
    })
      .limit(24)
      .lean()
      .catch(() => [])
  ) as DocRow[];

  const vendorDocs = vendorId
    ? (toPlain(
        await Document.find({
          ownerType: "vendor",
          ownerId: vendorId,
          visibility: { $in: ["public", "admin"] },
          status: "active",
        })
          .limit(12)
          .lean()
          .catch(() => [])
      ) as DocRow[])
    : [];

  const allDocs = [...productDocs, ...vendorDocs].filter((d) => d.fileUrl);

  const relatedCategoryId =
    typeof product.categoryId === "object" && product.categoryId && "_id" in product.categoryId
      ? String((product.categoryId as { _id?: string })._id)
      : product.categoryId
        ? String(product.categoryId)
        : undefined;

  const relatedVendorSelect = "legalName tradeName verificationStatus location logo slug";
  let relatedProducts: Array<ProductLike & { vendorId?: VendorLike }> = [];
  if (relatedCategoryId) {
    relatedProducts = toPlain(
      await Product.find({
        status: "published",
        categoryId: relatedCategoryId,
        _id: { $ne: productId },
      })
        .sort({ featured: -1, createdAt: -1 })
        .limit(16)
        .populate({ path: "vendorId", select: relatedVendorSelect })
        .lean()
        .catch(() => [])
    ) as Array<ProductLike & { vendorId?: VendorLike }>;
  }

  if (relatedProducts.length < 8 && vendorId) {
    const more = toPlain(
      await Product.find({
        status: "published",
        vendorId,
        _id: { $ne: productId },
      })
        .sort({ featured: -1, createdAt: -1 })
        .limit(16)
        .populate({ path: "vendorId", select: relatedVendorSelect })
        .lean()
        .catch(() => [])
    ) as Array<ProductLike & { vendorId?: VendorLike }>;
    const seen = new Set(relatedProducts.map((p) => String(p._id)));
    for (const row of more) {
      if (seen.has(String(row._id))) continue;
      relatedProducts.push(row);
      if (relatedProducts.length >= 16) break;
    }
  }

  // Hard-strip any contact fields that mongoose identity-map may have reattached.
  relatedProducts = relatedProducts.map((row) => {
    if (row.vendorId && typeof row.vendorId === "object") {
      return {
        ...row,
        vendorId: stripVendorContacts(row.vendorId as Record<string, unknown>) as VendorLike,
      };
    }
    return row;
  });

  const vendorProductCount = vendorId
    ? await Product.countDocuments({ vendorId, status: "published" }).catch(() => 0)
    : 0;

  const highlights = pickHighlights(product, locale);
  const specGroups = buildSpecGroups(product, locale);
  const specRows = [
    ...specGroups.flatMap((g) => g.rows),
    ...(product.moq != null
      ? [{ label: isAr ? "الحد الأدنى" : "Minimum Order", value: `${product.moq}${product.unit ? ` ${product.unit}` : ""}` }]
      : []),
    ...(product.leadTime ? [{ label: isAr ? "مدة التوريد" : "Lead Time", value: product.leadTime }] : []),
    ...(product.paymentTerms
      ? [{ label: isAr ? "شروط الدفع" : "Payment Terms", value: product.paymentTerms }]
      : []),
  ].filter((row, i, arr) => arr.findIndex((r) => r.label === row.label) === i);

  const keyFeatures = [
    ...highlights.map((h) => `${h.label}: ${h.value}`),
    ...(product.certifications || []).slice(0, 2).map((c) => (isAr ? `شهادة ${c}` : `${c} certified`)),
    ...(applicationsText ? [applicationsText] : []),
  ].slice(0, 8);

  const categoryTrail: Array<{ name: string; href: string }> = [];
  if (parentCategory) {
    categoryTrail.push({
      name: loc(locale, parentCategory.name),
      href: `/${locale}/c/${parentCategory.slug?.en || ""}`,
    });
  }
  if (category) {
    categoryTrail.push({
      name: loc(locale, category.name),
      href: `/${locale}/c/${category.slug?.en || category._id || ""}`,
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: shortDescription || description || undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: media.filter((m) => m.url).map((m) => m.url),
    category: category ? loc(locale, category.name) : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "SAR",
      availability:
        product.availability === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      seller: vendor
        ? {
            "@type": "Organization",
            name: loc(locale, vendor.legalName) || vendor.tradeName,
          }
        : undefined,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductViewTracker
        productId={productId}
        vendorId={vendorId}
        slug={productSlug(product)}
        name={title}
        brand={product.brand}
        image={media[0]?.url}
        locale={locale}
        category={categoryTrail.map((c) => c.name).join(" > ")}
      />
      <ProductDetailMarketplace
        locale={locale}
        product={publicProduct}
        vendor={vendor}
        titleEn={titleEn}
        titleAr={titleAr}
        description={description}
        shortDescription={shortDescription}
        applicationsText={applicationsText}
        categoryTrail={categoryTrail}
        highlights={highlights}
        specRows={specRows.slice(0, 12)}
        keyFeatures={keyFeatures}
        docs={allDocs}
        relatedProducts={relatedProducts}
        vendorProductCount={vendorProductCount}
      />
    </>
  );
}
