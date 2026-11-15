// src/components/vendor/VendorHome.tsx
// Supplier home: requests waiting for a quote come first, then quotes in play, then what's left to finish
// on the profile. Every number here is an enquiry count, never presented as sales.

import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Eye, ExternalLink, Package, Send, Upload } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SupplierRequestRow, SupplierStage } from "@/lib/vendor-requests";
import { formatMoney, unitLabel } from "@/lib/money";
import { cityName } from "@/lib/cities";

type Check = { key: string; label: string; ok: boolean };
type Props = {
  locale: Locale;
  name: string;
  rows: SupplierRequestRow[];
  productCount: number;
  views: number;
  verified: boolean;
  storefrontHref: string | null;
  checks: Check[];
  score: number;
};

const CHECK_AR: Record<string, string> = {
  name_en: "الاسم القانوني (إنجليزي)", name_ar: "الاسم القانوني (عربي)", description_en: "نبذة عن الشركة", logo: "شعار الشركة",
  location: "المدينة", company_type: "نوع النشاط", cr_number: "رقم السجل التجاري", contact: "الجوال أو البريد",
  registration_extra: "الرقم الضريبي أو الموقع أو سنة التأسيس", trade_profile: "الأسواق أو الشروط أو الشهادات",
};
const CHECK_EN: Record<string, string> = {
  name_en: "Legal name in English", name_ar: "Legal name in Arabic", description_en: "Company description", logo: "Company logo",
  location: "City", company_type: "Business type", cr_number: "CR number", contact: "Phone or email",
  registration_extra: "VAT number, website or year founded", trade_profile: "Markets, terms or certifications",
};

export function VendorHome({ locale, name, rows, productCount, views, verified, storefrontHref, checks, score }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const date = (iso?: string): string =>
    iso ? new Date(iso).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short" }) : "";
  const titleOf = (r: SupplierRequestRow): string =>
    r.items.length > 1 ? L(`${r.title} + ${r.items.length - 1} more`, `${r.title} + ${r.items.length - 1} أخرى`) : r.title;
  const open = (r: SupplierRequestRow): string => `/${locale}/vendor/rfqs?id=${r.id}`;
  const stageText: Record<SupplierStage, string> = {
    new: L("New", "جديد"), opened: L("Opened", "تم فتحه"), quoted: L("Buyer is comparing", "المشتري يقارن"),
    question: L("Buyer asked a question", "المشتري سأل سؤالاً"), won: L("Won · contact the buyer", "فزت · تواصل مع المشتري"), lost: L("Not chosen", "لم يُختر"), closed: L("Closed", "مغلق"),
  };

  const waiting = rows.filter((r) => r.stage === "new" || r.stage === "opened");
  const inPlay = rows.filter((r) => r.stage === "quoted" || r.stage === "question" || r.stage === "won").slice(0, 6);
  const missing = checks.filter((c) => !c.ok);
  const wins = rows.filter((r) => r.stage === "won");
  const first = name.split(/\s+/)[0];

  return (
    <div className="bh vh" dir={isAr ? "rtl" : "ltr"}>
      <section className="vh-hero" aria-labelledby="vh-hello">
        <div className="vh-hero__text">
          <p className="vh-hero__hi" id="vh-hello">{L(`Hi ${first}`, `أهلاً ${first}`)}</p>
          <h1>
            {waiting.length
              ? L(`${waiting.length} buyer${waiting.length === 1 ? " is" : "s are"} waiting for your quote`, `${waiting.length} مشترين بانتظار عرضك`)
              : wins.length
                ? L(`You won ${wins.length} request${wins.length === 1 ? "" : "s"}. Follow up with the buyer${wins.length === 1 ? "" : "s"}.`, `فزت بـ ${wins.length} طلبات. تابع مع المشترين.`)
                : productCount === 0
                  ? L("Add your products so buyer requests can find you", "أضف منتجاتك عشان توصلك طلبات المشترين")
                  : L("No requests waiting. A complete catalogue brings more.", "ما فيه طلبات بانتظارك. الكتالوج المكتمل يجيب طلبات أكثر.")}
          </h1>
          <div className="vh-hero__act">
            {waiting.length ? (
              <Link href={open(waiting[0])} className="vh-hero__cta"><Send size={16} aria-hidden /> {L("Start quoting", "ابدأ التسعير")}</Link>
            ) : wins.length ? (
              <Link href={open(wins[0])} className="vh-hero__cta">{L("Contact the buyer", "تواصل مع المشتري")}</Link>
            ) : (
              <>
                <Link href={`/${locale}/vendor/products/new`} className="vh-hero__cta"><Package size={16} aria-hidden /> {L("Add a product", "أضف منتج")}</Link>
                <Link href={`/${locale}/vendor/ai-upload`} className="vh-hero__ghost"><Upload size={15} aria-hidden /> {L("Upload a price list", "ارفع قائمة أسعار")}</Link>
              </>
            )}
            {storefrontHref ? <Link href={storefrontHref} target="_blank" className="vh-hero__ghost"><ExternalLink size={15} aria-hidden /> {L("Your storefront", "متجرك")}</Link> : null}
          </div>
        </div>
        {waiting.length + wins.length + views + rows.length > 0 ? (
        <dl className="vh-hero__facts">
          <div><dt>{L("Waiting", "بانتظارك")}</dt><dd>{waiting.length}</dd></div>
          <div><dt>{L("With buyers", "عند المشترين")}</dt><dd>{rows.filter((r) => r.stage === "quoted" || r.stage === "question").length}</dd></div>
          <div><dt>{L("Won", "فزت بها")}</dt><dd>{wins.length}</dd></div>
          <div><dt>{L("Storefront views", "زيارات المتجر")}</dt><dd>{views.toLocaleString("en-US")}</dd></div>
        </dl>
        ) : null}
      </section>

      <div className="bh-body">
        <div className="vh-main">
          <section className="bh-list" aria-labelledby="vh-wait">
            <h2 id="vh-wait">{L("Waiting for your quote", "بانتظار عرضك")}</h2>
            {waiting.length ? (
              <ul>
                {waiting.map((r) => (
                  <li key={r.id} className={`bh-row is-${r.stage}`}>
                    <div className="bh-row__main">
                      <Link href={open(r)} className="bh-row__title">{titleOf(r)}</Link>
                      <p className="bh-row__meta">
                        {r.items[0]?.quantity ? <span>{r.items[0].quantity.toLocaleString("en-US")} {unitLabel(r.items[0].unit, locale)}</span> : null}
                        {r.city ? <span>{L(`Deliver to ${cityName(r.city, locale)}`, `التوصيل إلى ${cityName(r.city, locale)}`)}</span> : null}
                        <span>{L(`Received ${date(r.receivedAt)}`, `وصل ${date(r.receivedAt)}`)}</span>
                        {r.deadline ? <span className="vh-due">{L(`Quotes due ${date(r.deadline)}`, `آخر موعد ${date(r.deadline)}`)}</span> : null}
                      </p>
                    </div>
                    <div className="bh-row__side">
                      {r.stage === "new" ? <span className="vh-new">{L("New", "جديد")}</span> : null}
                      <Link href={open(r)} className="bh-btn bh-btn--primary bh-btn--sm"><Send size={14} aria-hidden /> {L("Send quote", "أرسل عرضك")}</Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bh-empty">
                <p>{L("New requests appear here when buyers ask for what you sell. The more complete your catalogue, the more requests match you.", "الطلبات الجديدة تظهر هنا لما يطلب المشترون منتجاتك. كل ما اكتمل كتالوجك زادت الطلبات المطابقة.")}</p>
                <div className="bh-empty__ways">
                  <Link href={`/${locale}/vendor/products`}><Package size={16} aria-hidden /> {L("Add products", "أضف منتجات")}</Link>
                  <Link href={`/${locale}/vendor/ai-upload`}><Upload size={16} aria-hidden /> {L("Upload your catalogue", "ارفع كتالوجك")}</Link>
                </div>
              </div>
            )}
          </section>

          {inPlay.length ? (
            <section className="bh-list" aria-labelledby="vh-play">
              <h2 id="vh-play">{L("Your quotes", "عروضك")}</h2>
              <ul>
                {inPlay.map((r) => (
                  <li key={r.id} className={`bh-row is-${r.stage}`}>
                    <div className="bh-row__main">
                      <Link href={open(r)} className="bh-row__title">{titleOf(r)}</Link>
                      <p className="bh-row__meta"><span className={`vh-stage is-${r.stage}`}>{stageText[r.stage]}</span></p>
                    </div>
                    <div className="bh-row__side">
                      {r.quoteTotal != null ? <p className="bh-row__best"><small>{L("Your quote", "عرضك")}</small><b>{formatMoney(r.quoteTotal, locale)}</b></p> : null}
                      <Link href={open(r)} className={`bh-btn bh-btn--sm${r.stage === "won" ? " bh-btn--primary" : ""}`}>{r.stage === "won" ? L("Contact buyer", "تواصل") : r.stage === "question" ? L("Answer", "رد") : L("View", "عرض")}</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="bh-side">
          <section className="vh-profile">
            <div className="vh-profile__head">
              <b>{L("Your profile", "ملفك")}</b>
              <span>{score}%</span>
            </div>
            <div className="vh-bar" aria-hidden><i style={{ width: `${score}%` }} /></div>
            <p className="vh-verified">
              {verified ? <><BadgeCheck size={16} aria-hidden /> {L("Verified", "موثّق")}</> : <Link href={`/${locale}/vendor/documents`}>{L("Get verified to show the green tick", "وثّق حسابك لتظهر العلامة الخضراء")}</Link>}
            </p>
            {missing.length ? (
              <>
                <p className="vh-profile__hint">{L("Finish these so more buyers find you:", "أكمل هذي عشان يلقاك مشترون أكثر:")}</p>
                <ul className="vh-todo">
                  {missing.slice(0, 4).map((c) => (
                    <li key={c.key}><Link href={`/${locale}/vendor/company`}>{isAr ? CHECK_AR[c.key] || c.label : CHECK_EN[c.key] || c.label} <ArrowRight size={14} aria-hidden /></Link></li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="vh-done"><Check size={15} aria-hidden /> {L("Profile complete", "الملف مكتمل")}</p>
            )}
          </section>
          <Link href={`/${locale}/vendor/products`} className="bh-tile">
            <Package size={18} aria-hidden />
            <span><b>{productCount}</b> {L(productCount === 1 ? "product live" : "products live", "منتجات منشورة")}</span>
          </Link>
          <Link href={`/${locale}/vendor/analytics`} className="bh-tile">
            <Eye size={18} aria-hidden />
            <span><b>{views.toLocaleString("en-US")}</b> {L("storefront views", "مشاهدة للمتجر")}</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
