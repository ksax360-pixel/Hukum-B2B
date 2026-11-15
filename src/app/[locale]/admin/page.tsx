import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, BadgeCheck, Building2, Check, Inbox, LifeBuoy, Package, ShieldAlert, Timer } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { RFQ, RFQVendor, Quotation } from "@/modules/rfqs/rfq.model";
import { SupportTicket } from "@/modules/platform/platform.model";
import { Enquiry } from "@/modules/enquiries/enquiry.model";
import { User } from "@/modules/users/user.model";

const DAY = 86400000;
type Pulse = { label: string; now: number; before: number; href: string };

/** Admin home: the queues that need a person first, then how the marketplace moved this week. */
export default async function AdminTodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const session = await getSession();
  const h = (p: string): string => `/${locale}${p}`;

  const weekAgo = new Date(Date.now() - 7 * DAY);
  const twoWeeksAgo = new Date(Date.now() - 14 * DAY);
  const stale = new Date(Date.now() - 3 * DAY);
  const counts = { verify: 0, listings: 0, storefronts: 0, support: 0, reports: 0, unmatched: 0, noQuotes: 0 };
  let pulse: Pulse[] = [];
  let name = "";

  try {
    await connectDB();
    const between = (a: Date, b?: Date) => ({ createdAt: b ? { $gte: a, $lt: b } : { $gte: a } });
    const openRfqs = (await RFQ.find({ status: { $in: ["open", "matching", "quoted"] } }).select("_id createdAt").lean()) as Array<{ _id: unknown; createdAt?: Date }>;
    const ids = openRfqs.map((r) => r._id);
    const [invited, quoted] = await Promise.all([RFQVendor.distinct("rfqId", { rfqId: { $in: ids } }), Quotation.distinct("rfqId", { rfqId: { $in: ids }, status: { $ne: "draft" } })]);
    const inv = new Set(invited.map(String));
    const quo = new Set(quoted.map(String));
    counts.unmatched = openRfqs.filter((r) => !inv.has(String(r._id))).length;
    counts.noQuotes = openRfqs.filter((r) => inv.has(String(r._id)) && !quo.has(String(r._id)) && r.createdAt && new Date(r.createdAt) < stale).length;

    const acc = { status: { $in: ["accepted", "deal_confirmed", "reviewed"] } };
    const [verify, listings, storefronts, support, reports, user, ...p] = await Promise.all([
      Vendor.countDocuments({ verificationStatus: "pending" }),
      Product.countDocuments({ $or: [{ status: { $in: ["submitted", "under_review"] } }, { moderationStatus: "needs_review" }] }),
      Vendor.countDocuments({ "storefront.status": "pending" }),
      SupportTicket.countDocuments({ status: { $in: ["Open", "In Progress"] } }),
      Enquiry.countDocuments({ status: "new", subject: /^Report:/ }),
      session?.id ? User.findById(session.id).select("name").lean() : null,
      RFQ.countDocuments(between(weekAgo)), RFQ.countDocuments(between(twoWeeksAgo, weekAgo)),
      Quotation.countDocuments({ ...between(weekAgo), status: { $ne: "draft" } }), Quotation.countDocuments({ ...between(twoWeeksAgo, weekAgo), status: { $ne: "draft" } }),
      Quotation.countDocuments({ ...acc, "lifecycle.acceptedAt": { $gte: weekAgo } }), Quotation.countDocuments({ ...acc, "lifecycle.acceptedAt": { $gte: twoWeeksAgo, $lt: weekAgo } }),
      Vendor.countDocuments(between(weekAgo)), Vendor.countDocuments(between(twoWeeksAgo, weekAgo)),
      User.countDocuments({ ...between(weekAgo), roles: "buyer" }), User.countDocuments({ ...between(twoWeeksAgo, weekAgo), roles: "buyer" }),
    ]);
    Object.assign(counts, { verify, listings, storefronts, support, reports });
    name = ((user as { name?: string } | null)?.name || "").split(" ")[0];
    const n = p as number[];
    pulse = [
      { label: "Requests sent", now: n[0], before: n[1], href: "/admin/rfqs" },
      { label: "Quotes sent", now: n[2], before: n[3], href: "/admin/rfqs" },
      { label: "Quotes accepted", now: n[4], before: n[5], href: "/admin/rfqs" },
      { label: "New suppliers", now: n[6], before: n[7], href: "/admin/vendors" },
      { label: "New buyers", now: n[8], before: n[9], href: "/admin/users" },
    ];
  } catch (e) {
    console.error("[admin/today]", e);
  }

  const queues = [
    { k: "verify", icon: BadgeCheck, n: counts.verify, title: "Suppliers to verify", hint: "Check CR with Wathq and VAT with ZATCA", href: "/admin/vendors?status=pending" },
    { k: "storefronts", icon: Building2, n: counts.storefronts, title: "Storefront changes", hint: "Approve before they go live", href: "/admin/storefronts" },
    { k: "listings", icon: Package, n: counts.listings, title: "Listings to review", hint: "New products and edits to live ones", href: "/admin/products" },
    { k: "reports", icon: ShieldAlert, n: counts.reports, title: "Concerns reported", hint: "Suppliers, listings or messages", href: "/admin/inquiries" },
    { k: "support", icon: LifeBuoy, n: counts.support, title: "Support messages", hint: "Open or in progress", href: "/admin/tickets" },
    { k: "unmatched", icon: Inbox, n: counts.unmatched, title: "Requests with no supplier", hint: "Nobody matched yet: find one by hand", href: "/admin/rfqs" },
    { k: "noQuotes", icon: Timer, n: counts.noQuotes, title: "Requests with no quote", hint: "Matched over 3 days ago, still nothing", href: "/admin/rfqs" },
  ];
  const waiting = queues.filter((q) => q.n > 0);
  const total = waiting.reduce((a, q) => a + q.n, 0);
  const clear = queues.filter((q) => q.n === 0);

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <div className="bh at" dir="ltr">
        <section className="vh-hero at-hero" aria-labelledby="at-h">
          <div className="vh-hero__text">
            <p className="vh-hero__hi">{name ? `Hi ${name}` : "Today"}</p>
            <h1 id="at-h">{total ? `${total} thing${total === 1 ? "" : "s"} need${total === 1 ? "s" : ""} a person today` : "Everything is reviewed. Nice."}</h1>
            {waiting[0] ? (
              <div className="vh-hero__act"><Link href={h(waiting[0].href)} className="vh-hero__cta">Start with {waiting[0].title.toLowerCase()}</Link></div>
            ) : null}
          </div>
        </section>

        {waiting.length ? (
          <ul className="at-queues" aria-label="Queues">
            {waiting.map((q) => (
              <li key={q.k}>
                <Link href={h(q.href)} className="at-q">
                  <span className="at-q__icon"><q.icon size={18} aria-hidden /></span>
                  <span className="at-q__text"><b>{q.title}</b><small>{q.hint}</small></span>
                  <span className="at-q__n">{q.n}</span>
                  <ArrowRight size={16} aria-hidden className="at-q__arr" />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {clear.length ? (
          <p className="at-clear"><Check size={15} aria-hidden /> Clear: {clear.map((q) => q.title.toLowerCase()).join(", ")}.</p>
        ) : null}

        <section className="sfe-card" aria-labelledby="at-pulse">
          <div className="at-pulse__head">
            <h2 id="at-pulse" className="van-h">Last 7 days</h2>
            <Link href={h("/admin/analytics")} className="help2__all">Full funnel <ArrowRight size={14} aria-hidden /></Link>
          </div>
          <ol className="van-funnel at-pulse">
            {pulse.map((s) => {
              const diff = s.now - s.before;
              return (
                <li key={s.label}>
                  <Link href={h(s.href)}>
                    <span>{s.label}</span>
                    <b>{s.now.toLocaleString("en-US")}</b>
                    <small className={diff > 0 ? "is-up" : diff < 0 ? "is-down" : ""}>{diff === 0 ? "same as the week before" : `${diff > 0 ? "+" : ""}${diff} vs the week before`}</small>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </DashboardShell>
  );
}
