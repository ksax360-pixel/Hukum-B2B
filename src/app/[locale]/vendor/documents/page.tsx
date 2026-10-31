"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashT } from "@/i18n/dash-copy";

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

export default function VendorDocumentsPage() {
  const params = useParams();
  const locale = String(params.locale || "en");

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Documents")}</h1>
        <p className="text-[var(--muted)]">Certificates, CR copies, and compliance files for verification.</p>
      </div>
      <div className="surface-card empty-state">
        <p className="label-caps mb-2">Document vault</p>
        <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">No documents uploaded</h2>
        <p className="text-sm max-w-md mx-auto">
          Upload trade licences and certifications when document management is enabled for your account.
        </p>
      </div>
    </DashboardShell>
  );
}
