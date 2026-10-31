"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { QuotationInbox } from "@/components/inbox/QuotationInbox";
import { dashT } from "@/i18n/dash-copy";

export default function BuyerMessagesPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Messages")}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "صندوق الوارد، تذكيرات دورة عروض الأسعار، ووكيل ذكاء للمتطلبات."
            : "In-app inbox, quotation lifecycle reminders, and an AI agent for requirements."}
        </p>
      </div>
      <QuotationInbox locale={locale} role="buyer" linkBase={`/${locale}`} />
    </DashboardShell>
  );
}
