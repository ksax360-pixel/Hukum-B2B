"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { TicketDesk } from "@/components/dashboard/TicketDesk";

export default function AdminTicketsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      <TicketDesk role="admin" />
    </DashboardShell>
  );
}
