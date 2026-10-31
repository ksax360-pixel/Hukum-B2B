"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { DashboardHome, type DashMetric, type RankItem, type RecentItem } from "@/components/dashboard/DashboardHome";

type DashboardPayload = {
  kpis?: Record<string, number>;
  gauge?: { label?: string; percent?: number };
  ranking?: RankItem[];
  activitySeries?: number[];
  pipeline?: Array<{ label: string; value: number }>;
  recent?: RecentItem[];
};

export default function AdminDashboardPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [name, setName] = useState("Admin");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin?resource=dashboard")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) throw new Error(j.message);
        setData(j.data);
      })
      .catch((e) => setError(e.message));
    fetch("/api/auth")
      .then((r) => r.json())
      .then((j) => {
        const profile = j?.data?.user;
        const session = j?.data?.session;
        setName(profile?.name || session?.email?.split("@")[0] || "Admin");
      })
      .catch(() => undefined);
  }, []);

  const kpis = data?.kpis;
  const metrics: DashMetric[] = [
    { title: "Total vendors", value: kpis?.totalVendors ?? "…", icon: "building" },
    { title: "Published products", value: kpis?.publishedProducts ?? "…", icon: "products" },
    { title: "RFQs", value: kpis?.totalRfqs ?? "…", icon: "file" },
    { title: "Buyers", value: kpis?.totalBuyers ?? "…", icon: "users" },
  ];

  return (
    <DashboardShell locale={locale} title="Admin" nav={[...ADMIN_NAV]}>
      {error && <p className="mb-4 text-sm text-[var(--accent)]">{error}</p>}
      <DashboardHome
        locale={locale}
        role="admin"
        name={name}
        metrics={metrics}
        gauge={{
          title: "Top category",
          caption: "Share of published listings",
          label: data?.gauge?.label || "—",
          percent: data?.gauge?.percent ?? 0,
        }}
        ranking={{
          title: "Top vendors",
          caption: "Highest published listing volume",
          items: data?.ranking?.length ? data.ranking : [{ name: "No published vendors yet", value: "0", meta: "SKUs" }],
        }}
        activity={{
          title: "Leads & traffic",
          caption: "Marketplace events (last 7 days)",
          series: data?.activitySeries?.length ? data.activitySeries : [0, 0, 0, 0, 0, 0, 0],
        }}
        pipeline={{
          title: "Vendor pipeline",
          caption: "Verification and listing status",
          items: data?.pipeline?.length
            ? data.pipeline
            : [
                { label: "Pending", value: kpis?.pendingVendors ?? 0 },
                { label: "Verified", value: kpis?.verifiedVendors ?? 0 },
                { label: "Published", value: kpis?.publishedProducts ?? 0 },
                { label: "RFQs", value: kpis?.totalRfqs ?? 0 },
              ],
        }}
        recent={{
          title: "Recent listings",
          items: (data?.recent || []).map((item) => ({
            title: item.title,
            meta: item.meta,
            href: `/${locale}/admin/products`,
          })),
        }}
        actions={[
          { title: "Verify vendors", href: `/${locale}/admin/vendors` },
          { title: "Moderate products", href: `/${locale}/admin/products` },
          { title: "Open tickets", href: `/${locale}/admin/tickets` },
          { title: "AI admin center", href: `/${locale}/admin/ai` },
        ]}
      />
    </DashboardShell>
  );
}
