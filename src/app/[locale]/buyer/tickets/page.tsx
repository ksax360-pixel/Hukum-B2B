"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { TicketDesk } from "@/components/dashboard/TicketDesk";

export default function BuyerTicketsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <TicketDesk role="buyer" />
    </DashboardShell>
  );
}
