import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ExternalLink, Search } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VerifyActions } from "@/components/admin/VerifyActions";
import { connectDB } from "@/lib/db";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { Vendor } from "@/modules/vendors/vendor.model";

type Loc = { en?: string; ar?: string };
type Row = {
  _id: unknown; legalName?: Loc; tradeName?: string; slug?: { en?: string }; crNumber?: string; vatNumber?: string; location?: { city?: string };
  email?: string; verificationStatus?: string; verificationRejectionReason?: string; updatedAt?: Date; createdAt?: Date;
};
const TABS = [
  { k: "pending", label: "To verify" },
  { k: "verified", label: "Verified" },
  { k: "unverified", label: "Not submitted" },
  { k: "rejected", label: "Sent back" },
  { k: "suspended", label: "Paused" },
] as const;
const esc = (v: string): string => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Supplier verification queue: the CR and VAT numbers to check, side by side with the company name. */
export default async function AdminVerificationPage({
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
  const tab = TABS.find((t) => t.k === sp.status)?.k || "pending";
  const q = (sp.q || "").trim().slice(0, 60);

  let rows: Row[] = [];
  const counts: Record<string, number> = {};
  try {
    await connectDB();
    const filter: Record<string, unknown> = { verificationStatus: tab };
    if (q) filter.$or = [{ "legalName.en": new RegExp(esc(q), "i") }, { "legalName.ar": new RegExp(esc(q), "i") }, { tradeName: new RegExp(esc(q), "i") }, { crNumber: new RegExp(esc(q)) }, { email: new RegExp(esc(q), "i") }];
    const [list, agg] = await Promise.all([
      Vendor.find(filter).sort({ updatedAt: 1 }).limit(200).select("legalName tradeName slug crNumber vatNumber location email verificationStatus verificationRejectionReason updatedAt createdAt").lean(),
      Vendor.aggregate([{ $group: { _id: "$verificationStatus", n: { $sum: 1 } } }]),
    ]);
    rows = list as Row[];
    for (const a of agg as Array<{ _id: string; n: number }>) counts[a._id] = a.n;
  } catch (e) {
    console.error("[admin/vendors]", e);
  }
  const date = (d?: Date): string => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");
  const href = (k: string): string => `/${locale}/admin/vendors?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="bh vpr" dir="ltr">
        <header className="bh-head">
          <div>
            <h1>Supplier verification</h1>
            <p>Check the CR on Wathq and the VAT number on ZATCA, then verify. The company name must match the CR.</p>
          </div>
        </header>
        <div className="vpr-bar">
          <nav className="vrq-tabs" aria-label="Verification status">
            {TABS.map((t) => (
              <Link key={t.k} href={href(t.k)} aria-current={tab === t.k ? "page" : undefined} className={tab === t.k ? "is-on" : ""}>
                {t.label} <small>{counts[t.k] || 0}</small>
              </Link>
            ))}
          </nav>
          <form className="vpr-search" role="search" action={`/${locale}/admin/vendors`}>
            <input type="hidden" name="status" value={tab} />
            <Search size={16} aria-hidden />
            <input type="search" name="q" defaultValue={q} placeholder="Company, CR or email" aria-label="Search suppliers" />
          </form>
        </div>
        {rows.length ? (
          <div className="ci-table-wrap bsp-wrap">
            <table className="van-table bsp-table va-table">
              <thead>
                <tr><th scope="col">Company</th><th scope="col">CR number</th><th scope="col">VAT number</th><th scope="col">City</th><th scope="col">{tab === "pending" ? "Waiting since" : "Updated"}</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const name = v.tradeName || v.legalName?.en || v.legalName?.ar || "Supplier";
                  return (
                    <tr key={String(v._id)}>
                      <td>
                        <span className="bsp-name">
                          <b>{name} {v.slug?.en ? <Link href={`/${locale}/vendors/${v.slug.en}`} target="_blank" aria-label={`Open ${name}'s page`}><ExternalLink size={13} aria-hidden /></Link> : null}</b>
                          <small>{[v.legalName?.en, v.legalName?.ar].filter((x) => x && x !== name).join(" · ") || v.email || ""}</small>
                          {v.verificationRejectionReason && tab !== "verified" ? <small className="vpr-gap is-bad">{v.verificationRejectionReason}</small> : null}
                        </span>
                      </td>
                      <td className="va-num">{v.crNumber || <span className="va-miss">missing</span>}</td>
                      <td className="va-num">{v.vatNumber || <span className="va-miss">—</span>}</td>
                      <td>{v.location?.city || "—"}</td>
                      <td>{date(tab === "pending" ? v.updatedAt : v.updatedAt)}</td>
                      <td><VerifyActions id={String(v._id)} name={name} status={v.verificationStatus || "unverified"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vpr-empty"><h2>{tab === "pending" ? "Nobody waiting" : "Nothing here"}</h2><p>{tab === "pending" ? "Suppliers who send their CR show up here." : q ? "No supplier matches that search." : ""}</p></div>
        )}
      </div>
    </DashboardShell>
  );
}
