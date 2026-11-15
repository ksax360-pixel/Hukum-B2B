/** Buyer workspace nav: the jobs a buyer actually comes back for. Dropped pages redirect to where that job lives now
 *  (approvals/spend → quotes and suppliers, projects/reorders → requests, profile/team/privacy → settings). */
export const BUYER_NAV = [
  { href: "/buyer/dashboard", label: "Home" },
  { href: "/buyer/rfqs", label: "Requests" },
  { href: "/buyer/quotations", label: "Quotes" },
  { href: "/buyer/messages", label: "Messages" },
  { href: "/buyer/saved", label: "Saved" },
  { href: "/buyer/suppliers", label: "Suppliers" },
  { href: "/buyer/boq", label: "BOQ upload" },
  { href: "/buyer/settings", label: "Settings" },
  { href: "/buyer/tickets", label: "Help" },
] as const;
