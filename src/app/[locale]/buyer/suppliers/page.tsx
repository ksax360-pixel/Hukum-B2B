import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BadgeCheck, Search } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { cityName } from "@/lib/cities";
import { RFQ, Quotation } from "@/modules/rfqs/rfq.model";
import { Vendor } from "@/modules/vendors/vendor.model";

type Loc = { en?: string; ar?: string };
type Row = { id: string; name: string; slug: string; verified: boolean; city: string; quotes: number; accepted: number; last: string };
const ACCEPTED = ["accepted", "deal_confirmed", "reviewed"];

/** Suppliers who have quoted this buyer: how often, how many were accepted, and a one-tap way back to them. */
export default async function BuyerSuppliersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const session = await getSession();
  if (!session?.id) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/buyer/suppliers`)}`);

  let rows: Row[] = [];
  try {
    await connectDB();
    const rfqIds = (await RFQ.find({ buyerId: session.id }).select("_id").lean()).map((r) => (r as { _id: unknown })._id);
    const agg = (await Quotation.aggregate([
      { $match: { rfqId: { $in: rfqIds }, status: { $nin: ["draft", "withdrawn"] } } },
      { $group: { _id: "$vendorId", quotes: { $sum: 1 }, accepted: { $sum: { $cond: [{ $in: ["$status", ACCEPTED] }, 1, 0] } }, last: { $max: "$createdAt" } } },
      { $sort: { last: -1 } },
    ])) as Array<{ _id: unknown; quotes: number; accepted: number; last: Date }>;
    const vs = (await Vendor.find({ _id: { $in: agg.map((a) => a._id) } }).select("legalName tradeName slug verificationStatus location").lean()) as Array<{
      _id: unknown; legalName?: Loc; tradeName?: string; slug?: { en?: string }; verificationStatus?: string; location?: { city?: string };
    }>;
    const byId = new Map(vs.map((v) => [String(v._id), v]));
    rows = agg.flatMap((a) => {
      const v = byId.get(String(a._id));
      if (!v) return [];
      return [{
        id: String(v._id),
        name: v.tradeName || (isAr ? v.legalName?.ar || v.legalName?.en : v.legalName?.en || v.legalName?.ar) || "",
        slug: v.slug?.en || String(v._id),
        verified: v.verificationStatus === "verified",
        city: v.location?.city || "",
        quotes: a.quotes,
        accepted: a.accepted,
        last: new Date(a.last).toISOString(),
      }];
    });
  } catch (e) {
    console.error("[buyer/suppliers]", e);
  }
  const date = (iso: string): string => new Date(iso).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="bh sv" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Suppliers", "الموردون")}</h1>
            <p>{L("Everyone who has quoted you. Go back to the ones that worked.", "كل من أرسل لك عرض. ارجع للي ناسبوك.")}</p>
          </div>
          <Link href={`/${locale}/vendors`} className="bh-btn"><Search size={15} aria-hidden /> {L("Find suppliers", "ابحث عن موردين")}</Link>
        </header>
        {rows.length ? (
          <div className="ci-table-wrap bsp-wrap">
            <table className="van-table bsp-table">
              <thead>
                <tr>
                  <th scope="col">{L("Supplier", "المورد")}</th>
                  <th scope="col">{L("Quotes", "العروض")}</th>
                  <th scope="col">{L("Accepted", "المقبولة")}</th>
                  <th scope="col">{L("Last quote", "آخر عرض")}</th>
                  <th scope="col"><span className="sr-only">{L("Actions", "إجراءات")}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/${locale}/vendors/${r.slug}`} className="bsp-name">
                        <b>{r.name} {r.verified ? <BadgeCheck size={15} aria-label={L("Verified", "موثّق")} className="sv-tick" /> : null}</b>
                        {r.city ? <small>{cityName(r.city, locale)}</small> : null}
                      </Link>
                    </td>
                    <td>{r.quotes}</td>
                    <td>{r.accepted}</td>
                    <td>{date(r.last)}</td>
                    <td><Link href={`/${locale}/rfq?vendorId=${r.id}`} className="vpr-act">{L("Request again", "اطلب مرة ثانية")}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vpr-empty">
            <h2>{L("No quotes yet", "ما وصلتك عروض بعد")}</h2>
            <p>{L("Suppliers appear here once they quote one of your requests.", "الموردون يظهرون هنا أول ما يسعّرون أحد طلباتك.")}</p>
            <div className="bh-empty__ways"><Link href={`/${locale}/rfq`}>{L("Ask suppliers for a price", "اطلب سعر من الموردين")}</Link></div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
