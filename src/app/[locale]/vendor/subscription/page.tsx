"use client";

// Plan page for suppliers. Year one is free for everyone, so no prices are shown (Khalid, 11 Nov 2026):
// what is included now, and what paid plans will add later, described by value only.

import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, BarChart3, Check, Inbox, LayoutTemplate, Package, Rocket, Send, Sparkles, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VENDOR_NAV } from "@/lib/vendor-nav";

export default function VendorSubscriptionPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  const included = [
    { icon: Store, t: L("Your storefront and searchable catalogue", "متجرك وكتالوج قابل للبحث") },
    { icon: Inbox, t: L("Requests from buyers that match what you sell", "طلبات المشترين المطابقة لمنتجاتك") },
    { icon: Send, t: L("Unlimited quotes", "عروض أسعار بلا حدود") },
    { icon: Sparkles, t: L("AI catalogue upload from spreadsheets and PDFs", "رفع الكتالوج بالذكاء الاصطناعي من الجداول وملفات PDF") },
    { icon: BadgeCheck, t: L("Verification and the verified badge", "التوثيق وشارة التوثيق") },
    { icon: Package, t: L("Unlimited products", "منتجات بلا حدود") },
  ];
  const later = [
    { icon: Rocket, t: L("Priority matching on requests, always labelled for buyers", "أولوية في المطابقة، تظهر للمشتري بوضوح") },
    { icon: BarChart3, t: L("Deeper analytics and a monthly performance report", "تحليلات أعمق وتقرير أداء شهري") },
    { icon: LayoutTemplate, t: L("Quote templates and your own domain for the storefront", "قوالب عروض ونطاق خاص لمتجرك") },
    { icon: UserRound, t: L("A dedicated account manager and integrations", "مدير حساب مخصص وربط مع أنظمتك") },
  ];

  return (
    <DashboardShell locale={locale} title="Vendor" nav={[...VENDOR_NAV]}>
      <div className="bh vpl" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{L("Your plan", "خطتك")}</h1>
            <p>{L("Every supplier is on the full free plan during 2027.", "كل الموردين على الخطة المجانية الكاملة خلال 2027.")}</p>
          </div>
        </header>

        <section className="vpl-now" aria-labelledby="vpl-now-h">
          <div className="vpl-now__head">
            <span className="vpl-badge">{L("Current plan", "خطتك الحالية")}</span>
            <h2 id="vpl-now-h">{L("Founding supplier, free", "مورد مؤسس، مجاني")}</h2>
            <p>{L("Nothing to pay and no card on file. Everything below is included.", "بدون أي رسوم أو بطاقة مسجلة، وكل ما يلي مشمول.")}</p>
          </div>
          <ul className="vpl-list">
            {included.map((i) => (
              <li key={i.t}><span aria-hidden><i.icon size={18} /></span>{i.t}<Check size={16} className="vpl-tick" aria-hidden /></li>
            ))}
          </ul>
        </section>

        <section className="vpl-later" aria-labelledby="vpl-later-h">
          <h2 id="vpl-later-h">{L("Coming later with paid plans", "قريباً مع الخطط المدفوعة")}</h2>
          <p>{L("Optional extras for suppliers who want more reach. We'll tell you well before anything changes, and the free plan stays.", "إضافات اختيارية للموردين اللي يبون وصولاً أكبر. نبلغك قبل أي تغيير بوقت كافٍ، والخطة المجانية باقية.")}</p>
          <ul className="vpl-list is-muted">
            {later.map((i) => (
              <li key={i.t}><span aria-hidden><i.icon size={18} /></span>{i.t}</li>
            ))}
          </ul>
        </section>

        <p className="vpl-help">{L("Questions about plans?", "أسئلة عن الخطط؟")} <Link href={`/${locale}/contact`}>{L("Talk to the team", "تكلم مع الفريق")}</Link></p>
      </div>
    </DashboardShell>
  );
}
