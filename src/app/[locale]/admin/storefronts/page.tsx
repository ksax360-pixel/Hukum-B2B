import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StorefrontReviewActions } from "@/components/admin/StorefrontReviewActions";
import { connectDB } from "@/lib/db";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { Vendor } from "@/modules/vendors/vendor.model";

type Loc = { en?: string; ar?: string };
type Design = { headline?: Loc; tagline?: Loc; bannerText?: Loc; primaryColor?: string; logo?: string; bannerImages?: string[] };
type Row = { _id: unknown; legalName?: Loc; tradeName?: string; slug?: { en?: string }; logo?: string; storefront?: { published?: Design; pending?: Design; submittedAt?: Date } };

function Mini({ d, name, fallbackLogo }: { d?: Design; name: string; fallbackLogo?: string }) {
  const banner = d?.bannerImages?.find(Boolean);
  const logo = d?.logo || fallbackLogo;
  const title = d?.headline?.en || d?.headline?.ar || name;
  return (
    <div className="ar-mini" style={{ ["--vms-brand" as string]: d?.primaryColor || "#17634B" }}>
      <div className="sfe-mini__hero" style={banner ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.6), rgba(0,0,0,.15)), url(${banner})` } : undefined}>
        {logo ? <img src={logo} alt="" className="ar-mini__logo" /> : null}
        {d?.tagline?.en || d?.tagline?.ar ? <p>{d?.tagline?.en || d?.tagline?.ar}</p> : null}
        <h3>{title}</h3>
      </div>
      {d?.bannerText?.en || d?.bannerText?.ar ? <p className="sfe-mini__notice">{d?.bannerText?.en || d?.bannerText?.ar}</p> : null}
    </div>
  );
}

/** Storefront changes waiting for a person: current live look beside the proposed one. */
export default async function AdminStorefrontsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  let rows: Row[] = [];
  try {
    await connectDB();
    rows = (await Vendor.find({ "storefront.status": "pending" }).sort({ "storefront.submittedAt": 1 }).limit(50).select("legalName tradeName slug logo storefront").lean()) as Row[];
  } catch (e) {
    console.error("[admin/storefronts]", e);
  }
  const ago = (d?: Date): string => {
    if (!d) return "";
    const h = Math.round((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? "just now" : h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
  };

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="bh ar" dir="ltr">
        <header className="bh-head">
          <div>
            <h1>Storefront changes</h1>
            <p>Supplier pages only change after a person approves. Oldest first.</p>
          </div>
        </header>
        {rows.length ? (
          <ul className="ar-list">
            {rows.map((v) => {
              const name = v.tradeName || v.legalName?.en || v.legalName?.ar || "Supplier";
              return (
                <li key={String(v._id)} className="sfe-card ar-item">
                  <div className="ar-item__head">
                    <div>
                      <h2>{name}</h2>
                      <p>Sent {ago(v.storefront?.submittedAt)}</p>
                    </div>
                    {v.slug?.en ? <Link href={`/${locale}/vendors/${v.slug.en}`} target="_blank" className="bh-btn bh-btn--sm"><ExternalLink size={14} aria-hidden /> Live page</Link> : null}
                  </div>
                  <div className="ar-compare">
                    <figure><figcaption>Live now</figcaption><Mini d={v.storefront?.published} name={name} fallbackLogo={v.logo} /></figure>
                    <figure><figcaption>Proposed</figcaption><Mini d={v.storefront?.pending} name={name} fallbackLogo={v.logo} /></figure>
                  </div>
                  <StorefrontReviewActions id={String(v._id)} name={name} />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="vpr-empty"><h2>Nothing to review</h2><p>Storefront changes from suppliers land here.</p></div>
        )}
      </div>
    </DashboardShell>
  );
}
