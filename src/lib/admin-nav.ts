/** Admin nav grouped by the job: what needs a person, the marketplace, how it's doing, the system.
 *  Pages whose backend lives with X360 (reports, AI oversight, risk, demand, subscriptions, flags, costs)
 *  stay routable but are out of the nav until their APIs exist here. */
export const ADMIN_NAV = [
  { href: "/admin", label: "Today" },
  { href: "/admin/vendors", label: "Verification" },
  { href: "/admin/storefronts", label: "Storefronts" },
  { href: "/admin/products", label: "Listings" },
  { href: "/admin/tickets", label: "Support" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/rfqs", label: "Requests" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/analytics", label: "Funnel" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/health", label: "System health" },
] as const;
