"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashT } from "@/i18n/dash-copy";
import { vendorLogoUrl } from "@/components/products/product-helpers";
import { t } from "@/lib/utils";

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

type VendorDoc = {
  _id: string;
  legalName?: { en?: string; ar?: string };
  tradeName?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: { en?: string; ar?: string };
  verificationStatus?: string;
  completenessScore?: number;
  location?: { city?: string; address?: string };
  logo?: string;
  slug?: { en?: string };
};

export default function VendorCompanyPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [vendor, setVendor] = useState<VendorDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [legalNameEn, setLegalNameEn] = useState("");
  const [legalNameAr, setLegalNameAr] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [descEn, setDescEn] = useState("");

  const applyVendor = (v: VendorDoc) => {
    setVendor(v);
    setLegalNameEn(v.legalName?.en || "");
    setLegalNameAr(v.legalName?.ar || "");
    setTradeName(v.tradeName || "");
    setEmail(v.email || "");
    setPhone(v.phone || "");
    setWebsite(v.website || "");
    setCity(v.location?.city || "");
    setDescEn(v.description?.en || "");
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/vendors?mine=true")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        if (j.data) applyVendor(j.data as VendorDoc);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?._id) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vendor._id,
          updates: {
            legalName: { en: legalNameEn, ar: legalNameAr },
            tradeName,
            email,
            phone,
            website,
            description: { en: descEn, ar: vendor.description?.ar || "" },
            location: { ...vendor.location, city },
          },
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      applyVendor(j.data.vendor as VendorDoc);
      setMessage("Company profile saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell locale={locale} title="Vendor" nav={nav}>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-semibold">{dashT(locale, "Company")}</h1>
        <p className="text-[var(--muted)]">Legal identity and contact details buyers see on your storefront.</p>
      </div>

      {loading ? (
        <div className="surface-card p-8 skeleton h-48" />
      ) : !vendor ? (
        <div className="surface-card empty-state">
          <p className="font-medium text-[var(--ink)]">No vendor profile linked</p>
          <p className="text-sm mt-2">Register or sign in with a vendor account to manage company details.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vendorLogoUrl(vendor)} alt="" className="h-16 w-16 rounded-xl object-contain border border-[var(--border)]" />
            <div className="surface-card px-5 py-3">
              <p className="label-caps mb-1">Verification</p>
              <p className="font-medium capitalize">{vendor.verificationStatus || "unverified"}</p>
            </div>
            <div className="surface-card px-5 py-3">
              <p className="label-caps mb-1">Profile score</p>
              <p className="font-medium">{vendor.completenessScore ?? 0}%</p>
            </div>
          </div>

          <form onSubmit={save} className="surface-card p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input-field" placeholder="Legal name (English)" value={legalNameEn} onChange={(e) => setLegalNameEn(e.target.value)} />
              <input className="input-field" placeholder="Legal name (Arabic)" value={legalNameAr} onChange={(e) => setLegalNameAr(e.target.value)} />
              <input className="input-field" placeholder="Trade name" value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
              <input className="input-field" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="input-field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className="input-field md:col-span-2" placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <textarea
              className="input-field min-h-[120px]"
              placeholder="Description (English)"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
            />
            {error && <p className="text-sm text-[var(--accent)]">{error}</p>}
            {message && <p className="text-sm text-[var(--ink-soft)]">{message}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
          {t(locale, vendor.legalName) && (
            <p className="mt-4 text-sm text-[var(--muted)]">Public listing: {t(locale, vendor.legalName)}</p>
          )}
        </>
      )}
    </DashboardShell>
  );
}
