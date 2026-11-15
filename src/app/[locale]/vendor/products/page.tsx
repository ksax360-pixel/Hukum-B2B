import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Plus, Search, Upload } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductRowActions } from "@/components/vendor/ProductRowActions";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatMoney, unitLabel } from "@/lib/money";
import { GAP_LABEL, listingGaps } from "@/lib/product-edit";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { Product } from "@/modules/products/product.model";

type Tab = "all" | "live" | "review" | "draft" | "fix" | "hidden";
const TAB_OF: Record<string, Tab> = {
  published: "live", approved: "live", vendor_approved: "live",
  submitted: "review", under_review: "review", ai_processing: "review",
  draft: "draft", changes_requested: "fix", rejected: "fix", archived: "hidden",
};
type Row = {
  _id: unknown; name?: { en?: string; ar?: string }; brand?: string; sku?: string; status?: string; price?: number; unit?: string; moq?: number;
  media?: Array<{ url?: string; isPrimary?: boolean }>; description?: { en?: string }; shortDescription?: { en?: string }; categoryId?: unknown;
  rejectionReason?: string; updatedAt?: Date;
};

/** Supplier catalogue: find a product fast, see what each one is missing, act on it in one click. */
export default async function VendorProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/products`)}`);

  let rows: Row[] = [];
  try {
    await connectDB();
    if (session.vendorId) {
      rows = (await Product.find({ vendorId: session.vendorId })
        .sort({ updatedAt: -1 })
        .limit(500)
        .select("name brand sku status price unit moq media description.en shortDescription.en categoryId rejectionReason updatedAt")
        .lean()) as Row[];
    }
  } catch (e) {
    console.error("[vendor/products]", e);
  }

  const tab: Tab = (["live", "review", "draft", "fix", "hidden"] as const).find((t) => t === sp.tab) || "all";
  const q = (sp.q || "").trim().toLowerCase().slice(0, 80);
  const counts: Record<Tab, number> = { all: rows.length, live: 0, review: 0, draft: 0, fix: 0, hidden: 0 };
  for (const r of rows) counts[TAB_OF[r.status || "draft"] || "draft"]++;
  const shown = rows.filter(
    (r) =>
      (tab === "all" || (TAB_OF[r.status || "draft"] || "draft") === tab) &&
      (!q || `${r.name?.en || ""} ${r.name?.ar || ""} ${r.brand || ""} ${r.sku || ""}`.toLowerCase().includes(q))
  );
  const needWork = rows.filter((r) => TAB_OF[r.status || "draft"] !== "hidden" && listingGaps(r).length > 0).length;
  const tabs: Array<{ k: Tab; label: string }> = [
    { k: "all", label: L("All", "الكل") },
    { k: "live", label: L("Live", "منشورة") },
    { k: "review", label: L("In review", "قيد المراجعة") },
    { k: "draft", label: L("Drafts", "مسودات") },
    { k: "fix", label: L("Needs changes", "تحتاج تعديل") },
    { k: "hidden", label: L("Hidden", "مخفية") },
  ];
  const statusText: Record<Tab, string> = {
    all: "", live: L("Live", "منشور"), review: L("In review", "قيد المراجعة"), draft: L("Draft", "مسودة"), fix: L("Needs changes", "يحتاج تعديل"), hidden: L("Hidden", "مخفي"),
  };
  const href = (t: Tab): string => `/${locale}/vendor/products?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <div className="bh vpr" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Products", "المنتجات")}</h1>
            <p>
              {needWork
                ? L(`${needWork} listing${needWork === 1 ? "" : "s"} could match more requests with a few details.`, `${needWork} منتجات تقدر تطابق طلبات أكثر ببعض التفاصيل.`)
                : L("Complete listings match more buyer requests.", "المنتجات المكتملة تطابق طلبات أكثر.")}
            </p>
          </div>
          <div className="vpr-head-act">
            <Link href={`/${locale}/vendor/ai-upload`} className="bh-btn"><Upload size={15} aria-hidden /> {L("Upload a catalogue", "ارفع كتالوج")}</Link>
            <Link href={`/${locale}/vendor/products/new`} className="bh-btn bh-btn--primary"><Plus size={16} aria-hidden /> {L("Add product", "أضف منتج")}</Link>
          </div>
        </header>

        <div className="vpr-bar">
          <nav className="vrq-tabs" aria-label={L("Product status", "حالة المنتج")}>
            {tabs.filter((t) => t.k === "all" || counts[t.k] > 0 || t.k === tab).map((t) => (
              <Link key={t.k} href={href(t.k)} aria-current={tab === t.k ? "page" : undefined} className={tab === t.k ? "is-on" : ""}>
                {t.label} <small>{counts[t.k]}</small>
              </Link>
            ))}
          </nav>
          <form className="vpr-search" role="search" action={`/${locale}/vendor/products`}>
            <input type="hidden" name="tab" value={tab} />
            <Search size={16} aria-hidden />
            <input type="search" name="q" defaultValue={sp.q || ""} placeholder={L("Search name, brand or SKU", "ابحث بالاسم أو العلامة أو الرمز")} aria-label={L("Search products", "ابحث في المنتجات")} />
          </form>
        </div>

        {shown.length ? (
          <ul className="vpr-list">
            {shown.map((p) => {
              const id = String(p._id);
              const t = TAB_OF[p.status || "draft"] || "draft";
              const gaps = t === "hidden" ? [] : listingGaps(p);
              const cover = (p.media?.find((m) => m.isPrimary) || p.media?.[0])?.url;
              const name = (isAr ? p.name?.ar || p.name?.en : p.name?.en || p.name?.ar) || L("Untitled product", "منتج بدون اسم");
              return (
                <li key={id} className="vpr-row">
                  <Link href={`/${locale}/vendor/products/${id}`} className="vpr-row__main">
                    {cover ? <img src={cover} alt="" className="vpr-thumb" loading="lazy" /> : <span className="vpr-thumb is-empty" aria-hidden />}
                    <span className="vpr-row__text">
                      <b>{name}</b>
                      <span className="vpr-row__meta">
                        {[p.brand, p.sku].filter(Boolean).join(" · ") || L("No brand or SKU", "بدون علامة أو رمز")}
                      </span>
                      {t === "fix" && p.rejectionReason ? (
                        <span className="vpr-gap is-bad">{p.rejectionReason}</span>
                      ) : gaps.length ? (
                        <span className="vpr-gap">{isAr ? GAP_LABEL[gaps[0]].ar : GAP_LABEL[gaps[0]].en}{gaps.length > 1 ? L(` +${gaps.length - 1} more`, ` +${gaps.length - 1}`) : ""}</span>
                      ) : null}
                    </span>
                  </Link>
                  <span className="vpr-price">
                    {p.price ? <>{formatMoney(p.price, locale)}<small> / {unitLabel(p.unit, locale) || L("piece", "قطعة")}</small></> : <small>{L("Price on request", "السعر عند الطلب")}</small>}
                  </span>
                  <span className={`vrq-chip vpr-chip is-${t}`}>{statusText[t]}</span>
                  <ProductRowActions locale={locale} id={id} status={p.status || "draft"} ready={gaps.length === 0} />
                </li>
              );
            })}
          </ul>
        ) : rows.length ? (
          <p className="pdp2-empty vrq-empty">{L("No products match.", "ما فيه منتجات مطابقة.")} <Link href={`/${locale}/vendor/products`}>{L("Clear search", "امسح البحث")}</Link></p>
        ) : (
          <div className="vpr-empty">
            <h2>{L("Add your first products", "أضف أول منتجاتك")}</h2>
            <p>{L("Requests are matched to suppliers by what they list. Start with the items you sell most.", "الطلبات تُطابق مع الموردين حسب منتجاتهم. ابدأ بأكثر شي تبيعه.")}</p>
            <div className="bh-empty__ways">
              <Link href={`/${locale}/vendor/products/new`}><Plus size={16} aria-hidden /> {L("Add one product", "أضف منتج واحد")}</Link>
              <Link href={`/${locale}/vendor/ai-upload`}><Upload size={16} aria-hidden /> {L("Upload a price list or catalogue", "ارفع قائمة أسعار أو كتالوج")}</Link>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
