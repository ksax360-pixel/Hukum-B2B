"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TicketDesk } from "@/components/dashboard/TicketDesk";

const nav = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/company", label: "Company" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/ai-upload", label: "AI Upload" },
  { href: "/vendor/rfqs", label: "RFQs" },
  { href: "/vendor/quotations", label: "Quotations" },
  { href: "/vendor/analytics", label: "Analytics" },
  { href: "/vendor/documents", label: "Documents" },
  { href: "/vendor/subscription", label: "Subscription" },
  { href: "/vendor/settings", label: "Settings" },
];

export default function VendorTicketsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <TicketDesk role="vendor" />
    </DashboardShell>
  );
}
