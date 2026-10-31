"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/buyer-nav";

type BuyerProfile = {
  fullName: string;
  companyName: string;
  phone: string;
  email?: string;
  quantity?: string;
  updatedAt?: string;
};

type InterestRow = {
  productId: string;
  reference: string;
  productName?: string;
  vendorName?: string;
  quantity?: string;
};

const PROFILE_KEY = "kt_buyer_profile";
const INTERESTS_KEY = "kt_product_interests";

export default function BuyerProfilePage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const [profile, setProfile] = useState<BuyerProfile>({
    fullName: "",
    companyName: "",
    phone: "",
    email: "",
    quantity: "",
  });
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authRes = await fetch("/api/auth", { credentials: "include" });
        const authJson = await authRes.json();
        const user = authJson?.data?.user || authJson?.data?.session || {};
        let next: BuyerProfile = {
          fullName: user.name || "",
          companyName: "",
          phone: user.mobile || "",
          email: user.email || "",
          quantity: "",
        };
        try {
          const orgRes = await fetch("/api/organizations", { credentials: "include" });
          const orgJson = await orgRes.json();
          // Buyer profile may be nested later; keep localStorage merge for now
          void orgJson;
        } catch {
          /* ignore */
        }
        try {
          const raw = localStorage.getItem(PROFILE_KEY);
          if (raw) {
            const local = JSON.parse(raw) as BuyerProfile;
            next = {
              fullName: next.fullName || local.fullName || "",
              companyName: local.companyName || "",
              phone: next.phone || local.phone || "",
              email: next.email || local.email || "",
              quantity: local.quantity || "",
            };
          }
          const mapRaw = localStorage.getItem(INTERESTS_KEY);
          const map = mapRaw ? (JSON.parse(mapRaw) as Record<string, string | InterestRow>) : {};
          if (!cancelled) {
            setInterests(
              Object.entries(map).map(([productId, value]) =>
                typeof value === "string"
                  ? { productId, reference: value }
                  : { ...value, productId: value.productId || productId, reference: value.reference || "" }
              )
            );
          }
        } catch {
          /* ignore */
        }
        if (!cancelled) setProfile(next);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "save_buyer_profile",
          fullName: profile.fullName,
          companyName: profile.companyName,
          phone: profile.phone,
          markPhoneVerified: Boolean(profile.phone && profile.phone.replace(/\D/g, "").length >= 9),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Save failed");
      const saved: BuyerProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(saved));
      setProfile(saved);
      setMessage(isAr ? "تم حفظ الملف." : "Profile saved. RFQ and interest forms will use these details.");
    } catch (err) {
      setError((err as Error).message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">{isAr ? "ملف المشتري" : "Buyer profile"}</h1>
        <p className="text-[var(--muted)]">
          {isAr
            ? "حدّث بياناتك لتُملأ تلقائياً في طلبات الأسعار واهتمامات المنتجات."
            : "Keep your details up to date — they prefill RFQs and product interest forms."}
        </p>
      </div>

      {error ? <p className="mb-3 text-sm text-[var(--accent)]">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-[var(--gold,#c9a962)]">{message}</p> : null}

      {!loaded ? (
        <p className="text-[var(--muted)]">{isAr ? "جارٍ التحميل…" : "Loading…"}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={onSave} className="surface-card space-y-3 p-6">
            <p className="label-caps">{isAr ? "البيانات" : "Details"}</p>
            <label className="block text-sm">
              {isAr ? "الاسم الكامل" : "Full name"}
              <input
                className="input-field mt-1"
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              {isAr ? "الشركة" : "Company"}
              <input
                className="input-field mt-1"
                value={profile.companyName}
                onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              {isAr ? "الجوال" : "Mobile"}
              <input
                className="input-field mt-1"
                dir="ltr"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+9665…"
              />
            </label>
            <label className="block text-sm">
              {isAr ? "البريد" : "Email"}
              <input className="input-field mt-1" value={profile.email || ""} disabled />
            </label>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? (isAr ? "جارٍ الحفظ…" : "Saving…") : isAr ? "حفظ الملف" : "Save profile"}
            </button>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/${locale}/buyer/rfqs`} className="btn-secondary text-sm">
                {isAr ? "الطلبات / RFQs" : "Orders / RFQs"}
              </Link>
              <Link href={`/${locale}/rfq`} className="btn-secondary text-sm">
                {isAr ? "طلب سعر جديد" : "New RFQ"}
              </Link>
            </div>
          </form>

          <div className="surface-card p-6">
            <p className="label-caps mb-4">
              {isAr ? "الاهتمامات" : "Interests"} ({interests.length})
            </p>
            {interests.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                {isAr ? "لا توجد اهتمامات بعد." : "No interests yet."}
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {interests.map((row) => (
                  <li
                    key={row.productId}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/${locale}/products/${row.productId}`}
                        className="font-medium hover:text-[var(--accent)]"
                      >
                        {row.productName || (isAr ? "منتج" : "Product")}
                      </Link>
                      <p className="m-0 text-xs text-[var(--muted)]">
                        {[row.vendorName, row.quantity ? `Qty ${row.quantity}` : "", row.reference]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
