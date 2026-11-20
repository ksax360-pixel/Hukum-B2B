import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductEditor, type EditorProduct, type CategoryGroup } from "@/components/vendor/ProductEditor";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";

type Loc = { en?: string; ar?: string };
type Doc = {
  _id: unknown; vendorId?: unknown; name?: Loc; description?: Loc; shortDescription?: Loc; brand?: string; sku?: string; modelNumber?: string;
  categoryId?: unknown; price?: number; unit?: string; moq?: number; leadTime?: string; availability?: string; priceType?: string;
  media?: Array<{ url?: string }>; customSpecifications?: Array<{ key?: string; value?: string }>; status?: string; rejectionReason?: string; slug?: { en?: string };
};

export default async function VendorProductEditPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/products/${id}`)}`);
  if (id !== "new" && !/^[a-f\d]{24}$/i.test(id)) notFound();

  await connectDB();
  let product: EditorProduct | null = null;
  if (id !== "new") {
    const p = (await Product.findById(id).lean()) as Doc | null;
    if (!p || String(p.vendorId) !== session.vendorId) notFound();
    const L = (x?: Loc): Loc => ({ en: x?.en || "", ar: x?.ar || "" });
    product = {
      id: String(p._id),
      name: L(p.name),
      description: L(p.description?.en || p.description?.ar ? p.description : p.shortDescription),
      brand: p.brand || "",
      sku: p.sku || p.modelNumber || "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      price: p.price ? String(p.price) : "",
      unit: p.unit || "piece",
      moq: p.moq ? String(p.moq) : "",
      leadTime: p.leadTime || "",
      availability: p.availability || "in_stock",
      photos: (p.media || []).map((m) => m.url || "").filter(Boolean),
      specs: (p.customSpecifications || []).map((s) => ({ key: s.key || "", value: s.value || "" })),
      status: p.status || "draft",
      rejectionReason: p.rejectionReason || "",
      publicHref: p.status === "published" && p.slug?.en ? `/${locale}/products/${p.slug.en}` : null,
    };
  }

  const cats = (await Category.find({ status: { $ne: "archived" } }).select("name parentId level").sort({ "name.en": 1 }).lean()) as Array<{
    _id: unknown; name?: Loc; parentId?: unknown; level?: number;
  }>;
  const nm = (x?: Loc): string => (isAr ? x?.ar || x?.en : x?.en || x?.ar) || "";
  const groups: CategoryGroup[] = cats
    .filter((c) => !c.parentId)
    .map((top) => ({
      label: nm(top.name),
      options: [{ id: String(top._id), label: nm(top.name) }, ...cats.filter((c) => String(c.parentId) === String(top._id)).map((c) => ({ id: String(c._id), label: nm(c.name) }))],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <ProductEditor locale={locale} product={product} categories={groups} />
    </DashboardShell>
  );
}
