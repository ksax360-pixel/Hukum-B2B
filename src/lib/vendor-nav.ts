/** Supplier workspace nav, grouped by the supplier journey: win requests, catalogue, storefront and trust, account. */
export const VENDOR_NAV = [
  { href: "/vendor/dashboard", label: "Home" },
  { href: "/vendor/rfqs", label: "Requests" },
  { href: "/vendor/quotations", label: "Quotes sent" },
  { href: "/vendor/messages", label: "Messages" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/ai-upload", label: "Catalogue upload" },
  { href: "/vendor/company", label: "Storefront" },
  { href: "/vendor/documents", label: "Verification" },
  { href: "/vendor/analytics", label: "Analytics" },
  { href: "/vendor/subscription", label: "Plan" },
  { href: "/vendor/settings", label: "Settings" },
  { href: "/vendor/tickets", label: "Help" },
] as const;
