"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { listTickets, type SupportTicket } from "@/lib/tickets";
import { dashT } from "@/i18n/dash-copy";

function statusIcon(status: SupportTicket["status"]) {
  if (status === "Resolved") return <CheckCircle className="text-green-400" size={16} />;
  if (status === "In Progress") return <Clock className="text-yellow-400" size={16} />;
  if (status === "Closed") return <XCircle className="text-gray-400" size={16} />;
  return <AlertCircle className="text-blue-400" size={16} />;
}

function urgencyColor(urgency: SupportTicket["urgency"]) {
  if (urgency === "High") return "bg-[#F79E1B]";
  if (urgency === "Medium") return "bg-[#E01E5A]";
  return "bg-[#36C5F0]";
}

export function TicketOverview({ locale, role }: { locale: string; role: "admin" | "vendor" | "buyer" }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const href = `/${locale}/${role}/tickets`;

  useEffect(() => {
    listTickets()
      .then((all) => setTickets(all.slice(0, 6)))
      .catch(() => setTickets([]));
  }, []);

  return (
    <div id="cardColor" className="dash-panel flex h-full min-h-[18rem] w-full flex-col p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold">{locale === "ar" ? "نظرة على التذاكر" : "Ticket Overview"}</h3>
          <p className="mt-1 text-[10px] font-normal opacity-60">
            {locale === "ar" ? "آخر التذاكر المرفوعة في النظام" : "Latest tickets raised in the system"}
          </p>
        </div>
        <Link href={href} className="text-sm text-[#D21F1F] hover:underline">
          {locale === "ar" ? "عرض الكل" : "View All"}
        </Link>
      </div>
      <div className="space-y-1">
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={href} className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:border-[#071D27]/10">
            <div className={`mt-1 h-4 w-4 rounded ${urgencyColor(ticket.urgency)}`} />
            <div className="min-w-0 flex-1">
              <h4 className="mb-1 truncate text-[10px] font-medium">{ticket.topic}</h4>
              <p className="flex items-center gap-1 text-[10px] opacity-55">
                {statusIcon(ticket.status)}
                {dashT(locale, ticket.status)} · {ticket.id}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
