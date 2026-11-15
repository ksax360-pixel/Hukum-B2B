export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { BadgeCheck, GitCompare, Hash, Lock, Percent, Search, Send, Store } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/about", "ignored", undefined, { seoKey: "about" });
}

/** About: why Hukum exists, the rules we hold ourselves to, and live numbers only. */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  let stats: { suppliers: number; verified: number; products: number; cities: number } | null = null;
  try {
    await connectDB();
    const live: Record<string, unknown> = { status: { $nin: ["suspended", "rejected", "expired"] } };
    const [suppliers, verified, products, cities] = await Promise.all([
      Vendor.countDocuments(live),
      Vendor.countDocuments({ ...live, verificationStatus: "verified" }),
      Product.countDocuments({ status: "published" }),
      Vendor.distinct("location.city", live),
    ]);
    stats = { suppliers, verified, products, cities: cities.filter(Boolean).length };
  } catch (e) {
    console.error("[about] stats", e);
  }

  const rules = [
    { icon: Percent, b: L("Free for buyers, no commission", "مجاني للمشتري، بدون عمولة"), t: L("Searching, requesting and comparing cost nothing. Deals are agreed directly between buyer and supplier.", "البحث والطلب والمقارنة بدون رسوم، والصفقة بين المشتري والمورد مباشرة.") },
    { icon: BadgeCheck, b: L("Verification is earned, never sold", "التوثيق يُكتسب وما يُباع"), t: L("The green tick means we checked the company. No supplier can pay for it.", "العلامة الخضراء تعني إننا فحصنا الشركة، وما يقدر أي مورد يدفع عشانها.") },
    { icon: Lock, b: L("Your number stays yours", "رقمك يبقى لك"), t: L("First contact goes through Hukum. A supplier sees your number only when you choose, and every reveal is logged.", "أول تواصل يمر عبر حكم، والمورد يشوف رقمك فقط إذا اخترت، وكل كشف مسجّل.") },
    { icon: Hash, b: L("Real numbers only", "أرقام حقيقية فقط"), t: L("Counts on the site are live. Paid placement is always labelled.", "الأرقام في الموقع حية، والظهور المدفوع دائماً واضح.") },
  ];
  const flow = [
    { icon: Search, b: L("Request", "اطلب"), t: L("Say what you need in your own words, Arabic or English.", "قل وش تحتاج بكلماتك، بالعربي أو الإنجليزي."), href: `/${locale}/rfq` },
    { icon: Store, b: L("Match", "نطابق"), t: L("We send it to suppliers who actually sell it.", "نرسله للموردين اللي فعلاً يبيعونه."), href: `/${locale}/vendors` },
    { icon: GitCompare, b: L("Compare", "قارن"), t: L("Quotes side by side, then talk to the one you choose.", "العروض جنباً إلى جنب، ثم تتواصل مع اللي تختاره."), href: `/${locale}/how-it-works#compare` },
  ];

  return (
    <div className="hiw abt" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="abt-hero">
          <h1>{L("Saudi trade, without the phone tag", "التجارة في السعودية، بدون لفّ ودوران")}</h1>
          <p>
            {L(
              "Buying for a business here still means calling around, chasing WhatsApp groups and comparing quotes in a spreadsheet. Suppliers wait for referrals. Hukum puts both sides in one place: find the right supplier, compare real quotes, and connect directly.",
              "الشراء للشركات هنا لسه يعني اتصالات كثيرة وقروبات واتساب ومقارنة العروض في جدول، والموردون ينتظرون التوصيات. حكم يجمع الطرفين في مكان واحد: تلقى المورد المناسب، تقارن عروضاً حقيقية، وتتواصل مباشرة."
            )}
          </p>
        </header>

        <section className="abt-flow" aria-label={L("How it works", "كيف يعمل")}>
          {flow.map((f, i) => (
            <Link key={f.b} href={f.href} className="abt-flow__step">
              <small>{i + 1}</small>
              <span aria-hidden><f.icon size={22} /></span>
              <b>{f.b}</b>
              <p>{f.t}</p>
            </Link>
          ))}
        </section>

        <section className="abt-rules" aria-labelledby="abt-rules-h">
          <h2 id="abt-rules-h">{L("The rules we hold ourselves to", "القواعد اللي نلتزم فيها")}</h2>
          <ul>
            {rules.map((r) => (
              <li key={r.b}>
                <span aria-hidden><r.icon size={20} /></span>
                <div><b>{r.b}</b><p>{r.t}</p></div>
              </li>
            ))}
          </ul>
        </section>

        {stats ? (
          <section className="abt-stats" aria-labelledby="abt-stats-h">
            <h2 id="abt-stats-h">{L("Hukum today", "حكم اليوم")}</h2>
            <dl>
              <div><dt>{L("Suppliers listed", "موردون مسجّلون")}</dt><dd>{stats.suppliers.toLocaleString("en-US")}</dd></div>
              <div><dt>{L("Verified suppliers", "موردون موثّقون")}</dt><dd>{stats.verified.toLocaleString("en-US")}</dd></div>
              <div><dt>{L("Products listed", "منتجات معروضة")}</dt><dd>{stats.products.toLocaleString("en-US")}</dd></div>
              <div><dt>{L("Supplier cities", "مدن الموردين")}</dt><dd>{stats.cities.toLocaleString("en-US")}</dd></div>
            </dl>
            <p>{L("Live counts from the marketplace, updated as suppliers join.", "أرقام حية من السوق، تتحدث مع انضمام الموردين.")}</p>
          </section>
        ) : null}

        <section className="abt-home" aria-labelledby="abt-home-h">
          <h2 id="abt-home-h">{L("Built in Riyadh, for the Kingdom", "من الرياض، لكل المملكة")}</h2>
          <p>{L("Hukum is a Saudi company. Every page works in Arabic and English, prices are in riyals, and suppliers are organised by the cities they deliver to.", "حكم شركة سعودية. كل صفحة بالعربي والإنجليزي، والأسعار بالريال، والموردون مرتبون حسب المدن اللي يوصلون لها.")}</p>
        </section>

        <aside className="abt-cta">
          <Link href={`/${locale}/rfq`} className="abt-cta__card">
            <Send size={20} aria-hidden />
            <b>{L("I'm buying", "أنا أشتري")}</b>
            <span>{L("Send your first request", "أرسل أول طلب")}</span>
          </Link>
          <Link href={`/${locale}/become-a-vendor`} className="abt-cta__card">
            <Store size={20} aria-hidden />
            <b>{L("I'm selling", "أنا أبيع")}</b>
            <span>{L("List your company free", "سجّل شركتك مجاناً")}</span>
          </Link>
          <Link href={`/${locale}/contact`} className="abt-cta__card">
            <Hash size={20} aria-hidden />
            <b>{L("Something else", "شي ثاني")}</b>
            <span>{L("Talk to the team", "تكلم مع الفريق")}</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
