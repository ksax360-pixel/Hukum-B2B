import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { QuoteBuilder } from "@/components/vendor/QuoteBuilder";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { loadSupplierRequests, type SupplierRequestRow, type SupplierStage } from "@/lib/vendor-requests";
import { unitLabel } from "@/lib/money";
import { cityName } from "@/lib/cities";

type Tab = "waiting" | "quoted" | "closed";
const TAB_OF: Record<SupplierStage, Tab> = { new: "waiting", opened: "waiting", quoted: "quoted", question: "quoted", won: "quoted", lost: "closed", closed: "closed" };

/** Supplier requests: list grouped by what needs doing, with the selected request and its quote form beside it. */
export default async function VendorRfqsPage({
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
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/rfqs`)}`);

  let rows: SupplierRequestRow[] = [];
  try {
    await connectDB();
    if (session.vendorId) rows = await loadSupplierRequests(session.vendorId, locale, 60);
  } catch (e) {
    console.error("[vendor/rfqs]", e);
  }

  const tab: Tab = sp.tab === "quoted" || sp.tab === "closed" ? sp.tab : "waiting";
  const counts = { waiting: 0, quoted: 0, closed: 0 } as Record<Tab, number>;
  for (const r of rows) counts[TAB_OF[r.stage]]++;
  const shown = rows.filter((r) => TAB_OF[r.stage] === tab);
  const selected = sp.id && /^[a-f\d]{24}$/i.test(sp.id) ? sp.id : "";
  const date = (iso?: string): string => (iso ? new Date(iso).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short" }) : "");
  const stageText: Record<SupplierStage, string> = {
    new: L("New", "جديد"), opened: L("Opened", "تم فتحه"), quoted: L("Quote sent", "تم إرسال العرض"),
    question: L("Buyer asked a question", "المشتري سأل"), won: L("Accepted", "مقبول"), lost: L("Not chosen", "لم يُختر"), closed: L("Closed", "مغلق"),
  };
  const tabs: Array<{ k: Tab; label: string }> = [
    { k: "waiting", label: L("Waiting for your quote", "بانتظار عرضك") },
    { k: "quoted", label: L("Quoted", "تم التسعير") },
    { k: "closed", label: L("Closed", "مغلقة") },
  ];

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <div className={`bh vrq${selected ? " has-detail" : ""}`} dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Requests", "الطلبات")}</h1>
            <p>{L("Buyers who asked for what you sell. Quote fast: buyers compare lead time and terms, not only price.", "مشترون طلبوا اللي تبيعه. سعّر بسرعة: المشتري يقارن مدة التوريد والشروط، مو السعر بس.")}</p>
          </div>
        </header>

        <nav className="vrq-tabs" aria-label={L("Request status", "حالة الطلب")}>
          {tabs.map((t) => (
            <Link key={t.k} href={`/${locale}/vendor/rfqs?tab=${t.k}`} aria-current={tab === t.k ? "page" : undefined} className={tab === t.k ? "is-on" : ""}>
              {t.label} <small>{counts[t.k]}</small>
            </Link>
          ))}
        </nav>

        <div className="vrq-body">
          <section className="vrq-list" aria-label={L("Requests", "الطلبات")}>
            {shown.length ? (
              <ul>
                {shown.map((r) => (
                  <li key={r.id}>
                    <Link href={`/${locale}/vendor/rfqs?tab=${tab}&id=${r.id}`} className={`vrq-item${selected === r.id ? " is-on" : ""}`} aria-current={selected === r.id ? "true" : undefined}>
                      <span className="vrq-item__top">
                        <b>{r.items.length > 1 ? L(`${r.title} + ${r.items.length - 1} more`, `${r.title} + ${r.items.length - 1} أخرى`) : r.title}</b>
                        <span className={`vrq-chip is-${r.stage}`}>{stageText[r.stage]}</span>
                      </span>
                      <span className="vrq-item__meta">
                        {r.items[0]?.quantity ? <span>{r.items[0].quantity.toLocaleString("en-US")} {unitLabel(r.items[0].unit, locale)}</span> : null}
                        {r.city ? <span>{cityName(r.city, locale)}</span> : null}
                        <span>{date(r.receivedAt)}</span>
                        {r.deadline && tab === "waiting" ? <span className="vh-due">{L(`due ${date(r.deadline)}`, `قبل ${date(r.deadline)}`)}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pdp2-empty vrq-empty">
                {tab === "waiting"
                  ? L("Nothing waiting. New requests land here as soon as buyers ask for what you sell.", "ما فيه شي بانتظارك. الطلبات الجديدة توصل هنا أول ما يطلب المشترون منتجاتك.")
                  : L("Nothing here yet.", "ما فيه شي هنا بعد.")}{" "}
                {tab === "waiting" ? <Link href={`/${locale}/vendor/products`}>{L("Add more products to match more requests", "أضف منتجات أكثر لتطابق طلبات أكثر")}</Link> : null}
              </p>
            )}
          </section>

          <section className="vrq-detail" aria-label={L("Request details", "تفاصيل الطلب")}>
            {selected ? (
              <QuoteBuilder
                locale={locale}
                rfqId={selected}
                nextHref={(() => {
                  const waiting = rows.filter((r) => TAB_OF[r.stage] === "waiting" && r.id !== selected);
                  return waiting[0] ? `/${locale}/vendor/rfqs?tab=waiting&id=${waiting[0].id}` : undefined;
                })()}
              />
            ) : (
              <p className="vrq-pick">{shown.length ? L("Pick a request to see what the buyer needs and send your quote.", "اختر طلباً لتشوف احتياج المشتري وترسل عرضك.") : ""}</p>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
