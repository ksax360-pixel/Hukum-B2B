"use client";

// The old page posted to /api/procurement/boq, which this app doesn't have. The workspace now uses the
// same in-browser BOQ reader as the public page, which hands the lines to the request form.

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";
import { BoqUploader } from "@/components/boq/BoqUploader";

export default function BuyerBoqPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]} allowDark={false}>
      <div className="boq bh" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{isAr ? "رفع جدول الكميات" : "Upload a BOQ"}</h1>
            <p>{isAr ? "ارفع ملف Excel أو CSV، راجع البنود، وأرسلها طلباً واحداً." : "Drop an Excel or CSV file, check the lines, and send them as one request."}</p>
          </div>
        </header>
        <section className="boq-card">
          <BoqUploader locale={locale} />
        </section>
      </div>
    </DashboardShell>
  );
}
