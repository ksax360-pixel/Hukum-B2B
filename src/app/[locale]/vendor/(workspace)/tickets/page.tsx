"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TicketDesk } from "@/components/dashboard/TicketDesk";
import { VENDOR_NAV } from "@/lib/vendor-nav";


export default function VendorTicketsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <TicketDesk role="vendor" />
    </DashboardShell>
  );
}
