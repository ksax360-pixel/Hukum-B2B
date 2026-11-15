import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VENDOR_NAV } from "@/lib/vendor-nav";
import { formatMoney, localizeDuration } from "@/lib/money";
import { RFQ, Quotation } from "@/modules/rfqs/rfq.model";

type Group = "open" | "won" | "closed";
const GROUP_OF: Record<string, Group> = {
  submitted: "open", clarifying: "open", revised: "open", shortlisted: "open",
  accepted: "won", deal_confirmed: "won", reviewed: "won",
  rejected: "closed", expired: "closed", withdrawn: "closed",
};

type Row = { id: string; rfqId: string; title: string; total?: number; leadTime?: string; validity?: string; status: string; sentAt: string; vatIncluded?: boolean };

/** Every quote the supplier has sent, newest first, with where it stands with the buyer. */
export default async function VendorQuotationsPage({
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
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/vendor/quotations`)}`);

  let rows: Row[] = [];
  try {
    await connectDB();
    if (session.vendorId) {
      const quotes = (await Quotation.find({ vendorId: session.vendorId, status: { $ne: "draft" } })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("rfqId status total leadTime validity createdAt vatIncluded")
        .lean()) as Array<{ _id: unknown; rfqId: unknown; status?: string; total?: number; leadTime?: string; validity?: Date; createdAt?: Date; vatIncluded?: boolean }>;
      const rfqs = (await RFQ.find({ _id: { $in: quotes.map((q) => q.rfqId) } }).select("title items").lean()) as Array<{
        _id: unknown;
        title?: { en?: string; ar?: string };
        items?: Array<{ name?: { en?: string; ar?: string } }>;
      }>;
      const titleById = new Map(
        rfqs.map((r) => {
          const first = r.items?.[0]?.name;
          const name = (isAr ? first?.ar || first?.en : first?.en || first?.ar) || (isAr ? r.title?.ar || r.title?.en : r.title?.en) || "";
          const more = (r.items?.length || 0) > 1 ? L(` + ${(r.items?.length || 1) - 1} more`, ` + ${(r.items?.length || 1) - 1} أخرى`) : "";
          return [String(r._id), name + more];
        }),
      );
      rows = quotes.map((q) => ({
        id: String(q._id),
        rfqId: String(q.rfqId),
        title: titleById.get(String(q.rfqId)) || L("Request", "طلب"),
        total: q.total,
        leadTime: q.leadTime,
        validity: q.validity ? new Date(q.validity).toISOString() : undefined,
        status: q.status || "submitted",
        sentAt: new Date(q.createdAt || Date.now()).toISOString(),
        vatIncluded: q.vatIncluded,
      }));
    }
  } catch (e) {
    console.error("[vendor/quotations]", e);
  }

  const group: Group = sp.tab === "won" || sp.tab === "closed" ? sp.tab : "open";
  const counts: Record<Group, number> = { open: 0, won: 0, closed: 0 };
  for (const r of rows) counts[GROUP_OF[r.status] || "open"]++;
  const shown = rows.filter((r) => (GROUP_OF[r.status] || "open") === group);
  const date = (iso?: string): string => (iso ? new Date(iso).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short" }) : "—");
  const now = Date.now();
  const statusText: Record<string, string> = {
    submitted: L("Buyer is comparing", "المشتري يقارن"), revised: L("Revised, buyer is comparing", "معدّل، المشتري يقارن"),
    clarifying: L("Buyer asked a question", "المشتري سأل"), shortlisted: L("Shortlisted", "في القائمة المختصرة"),
    accepted: L("Accepted", "مقبول"), deal_confirmed: L("Accepted", "مقبول"), reviewed: L("Accepted", "مقبول"),
    rejected: L("Not chosen", "لم يُختر"), expired: L("Expired", "منتهي"), withdrawn: L("Withdrawn", "مسحوب"),
  };
  const chipOf = (s: string): string => (s === "clarifying" ? "question" : GROUP_OF[s] === "won" ? "won" : GROUP_OF[s] === "closed" ? "lost" : "quoted");
  const tabs: Array<{ k: Group; label: string }> = [
    { k: "open", label: L("With buyers", "عند المشترين") },
    { k: "won", label: L("Accepted", "مقبولة") },
    { k: "closed", label: L("Closed", "مغلقة") },
  ];

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <div className="bh vqs" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Quotes sent", "العروض المرسلة")}</h1>
            <p>{L("Every quote you sent and where it stands. Accepted means the buyer chose you; you agree delivery and payment with them directly.", "كل عرض أرسلته ووين وصل. مقبول يعني المشتري اختارك؛ تتفق معه على التوريد والدفع مباشرة.")}</p>
          </div>
        </header>

        <nav className="vrq-tabs" aria-label={L("Quote status", "حالة العرض")}>
          {tabs.map((t) => (
            <Link key={t.k} href={`/${locale}/vendor/quotations?tab=${t.k}`} aria-current={group === t.k ? "page" : undefined} className={group === t.k ? "is-on" : ""}>
              {t.label} <small>{counts[t.k]}</small>
            </Link>
          ))}
        </nav>

        {shown.length ? (
          <ul className="vqs-list">
            {shown.map((r) => {
              const expiring = group === "open" && r.validity && new Date(r.validity).getTime() - now < 3 * 86400000;
              return (
                <li key={r.id}>
                  <Link href={`/${locale}/vendor/rfqs?tab=quoted&id=${r.rfqId}`} className="vqs-row">
                    <span className="vqs-row__main">
                      <b>{r.title}</b>
                      <span className="vqs-row__meta">
                        <span>{L(`Sent ${date(r.sentAt)}`, `أُرسل ${date(r.sentAt)}`)}</span>
                        {r.leadTime ? <span>{L(`Lead time ${localizeDuration(r.leadTime, locale)}`, `التوريد ${localizeDuration(r.leadTime, locale)}`)}</span> : null}
                        {r.validity ? (
                          <span className={expiring ? "vh-due" : ""}>{L(`Valid until ${date(r.validity)}`, `صالح حتى ${date(r.validity)}`)}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="vqs-row__side">
                      {r.total != null ? (
                        <span className="vqs-total">
                          <b>{formatMoney(r.total, locale)}</b>
                          <small>{r.vatIncluded ? L("incl. VAT", "شامل الضريبة") : L("total with VAT", "الإجمالي مع الضريبة")}</small>
                        </span>
                      ) : null}
                      <span className={`vrq-chip is-${chipOf(r.status)}`}>{statusText[r.status] || r.status}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="pdp2-empty vrq-empty">
            {group === "open"
              ? L("No quotes with buyers right now.", "ما فيه عروض عند المشترين حالياً.")
              : L("Nothing here yet.", "ما فيه شي هنا بعد.")}{" "}
            <Link href={`/${locale}/vendor/rfqs`}>{L("See requests waiting for your quote", "شوف الطلبات اللي تنتظر عرضك")}</Link>
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
