"use client";

import { useState } from "react";
import Link from "next/link";
import { dashT } from "@/i18n/dash-copy";
import { t } from "@/lib/utils";

export function VendorWebsiteCard({
  locale,
  vendor,
  completeness,
  views,
  contacts,
}: {
  locale: string;
  vendor: Record<string, unknown>;
  completeness: number;
  views: number;
  contacts: number;
}) {
  const slug =
    (vendor.slug as { en?: string } | undefined)?.en || String(vendor._id || "");
  const name =
    t(locale, vendor.legalName as { en?: string; ar?: string } | undefined) ||
    (vendor.tradeName as string) ||
    dashT(locale, "Your company");
  const path = `/${locale}/vendors/${slug}`;
  const published = vendor.verificationStatus === "verified";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="surface-card p-6 mb-8 space-y-4" id="cardColor">
      <p className="label-caps">{dashT(locale, "Your Hukum website")}</p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-sm text-[var(--muted)] mt-1">kingdomtrade.com{path}</p>
          <p className="text-xs mt-2">{published ? `🟢 ${dashT(locale, "Published")}` : dashT(locale, "Draft / pending verification")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={path} className="btn-primary" target="_blank">
            {dashT(locale, "View website")}
          </Link>
          <button type="button" className="btn-secondary" onClick={copy}>
            {copied ? dashT(locale, "Copied") : dashT(locale, "Copy link")}
          </button>
          <Link href={`/${locale}/vendor/company`} className="btn-ghost">
            {dashT(locale, "Edit website")}
          </Link>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="label-caps">{dashT(locale, "Completeness")}</p>
          <p className="font-semibold">{completeness}%</p>
        </div>
        <div>
          <p className="label-caps">{dashT(locale, "Visitors")}</p>
          <p className="font-semibold">{views}</p>
        </div>
        <div>
          <p className="label-caps">{dashT(locale, "Contact actions")}</p>
          <p className="font-semibold">{contacts}</p>
        </div>
      </div>
    </div>
  );
}
