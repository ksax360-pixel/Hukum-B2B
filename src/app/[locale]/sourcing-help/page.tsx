import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { BadgeCheck, ClipboardList, FileSpreadsheet, Handshake, Scale, Send, Users } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { ConciergeIntake } from "@/components/concierge/ConciergeIntake";
import { RIYAL } from "@/lib/money";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/sourcing-help", "ignored", undefined, { seoKey: "sourcing-help" });
}

/** VIP concierge: the team runs the sourcing for you and hands back a decision-ready comparison. */
export default async function SourcingHelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  const steps = [
    { icon: ClipboardList, title: L("We scope it with you", "نحدد النطاق معك"), text: L("A short call to pin down specs, quantities, standards and delivery.", "مكالمة قصيرة نثبّت فيها المواصفات والكميات والمعايير والتوصيل.") },
    { icon: Users, title: L("We go to suppliers", "نتواصل مع الموردين"), text: L("Listed suppliers first, then the wider market when your item needs it.", "الموردون المسجّلون أولاً، ثم السوق الأوسع إذا احتاج طلبك.") },
    { icon: Scale, title: L("We line the quotes up", "نرتّب العروض"), text: L("Same units, VAT and delivery in every line, so the numbers compare fairly.", "نفس الوحدات والضريبة والتوصيل في كل بند، عشان تكون المقارنة عادلة.") },
    { icon: Handshake, title: L("You decide", "أنت تقرر"), text: L("You get a one-page summary and choose. Contract and payment stay with your company.", "توصلك خلاصة في صفحة واحدة وتختار، والتعاقد والدفع يبقون مع شركتك.") },
  ];
  const fits = [
    L("Many lines in one purchase: fit-outs, site setups, openings", "بنود كثيرة في شراء واحد: تجهيزات ومواقع وافتتاحات"),
    L("A category your team hasn't bought before", "فئة ما اشتراها فريقك من قبل"),
    L("Tight deadlines where calling around takes too long", "مواعيد ضيقة والاتصال بالموردين ياخذ وقت"),
    L("You need a clean comparison to take to management", "تحتاج مقارنة واضحة ترفعها للإدارة"),
  ];
  const brief = [
    { s: L("Al Waha Furnishings", "الواحة للأثاث"), total: "412,800", lead: L("21 days", "21 يوماً"), pick: true },
    { s: L("Gulf Hospitality Supply", "الخليج لتوريدات الضيافة"), total: "438,250", lead: L("14 days", "14 يوماً"), pick: false },
    { s: L("Najd Interiors", "نجد للتصميم الداخلي"), total: "455,900", lead: L("30 days", "30 يوماً"), pick: false },
  ];

  return (
    <div className="cnc" dir={isAr ? "rtl" : "ltr"}>
      <section className="cnc-hero">
        <div className="cnc-wrap cnc-hero__grid">
          <div>
            <p className="cnc-hero__mark">{L("Hukum Concierge", "حكم كونسيرج")}</p>
            <h1>{L("Hand us the list. Get back a decision.", "سلّمنا القائمة، وخذ القرار جاهز.")}</h1>
            <p className="cnc-hero__lead">
              {L(
                "For purchases too big or too urgent to run yourself, a Hukum sourcing lead finds the suppliers, gathers the quotes and puts them side by side for you.",
                "للمشتريات الكبيرة أو المستعجلة، مسؤول توريد من حكم يجد الموردين ويجمع العروض ويرتبها جنباً إلى جنب لك."
              )}
            </p>
            <div className="cnc-hero__act">
              <a href="#brief" className="cnc-btn cnc-btn--gold">{L("Start a brief", "ابدأ الموجز")}</a>
              <Link href={`/${locale}/rfq`} className="cnc-btn cnc-btn--ghost"><Send size={15} aria-hidden /> {L("Or request quotes yourself", "أو اطلب العروض بنفسك")}</Link>
            </div>
          </div>

          <figure className="cnc-doc" aria-label={L("Example of the summary you receive", "مثال على الخلاصة اللي توصلك")}>
            <figcaption>{L("Example summary", "مثال على الخلاصة")}</figcaption>
            <p className="cnc-doc__title">{L("Hotel fit-out, Jeddah: 40 rooms", "تجهيز فندق، جدة: 40 غرفة")}</p>
            <p className="cnc-doc__meta">{L("7 suppliers contacted, 3 complete quotes", "تواصلنا مع 7 موردين، و3 عروض مكتملة")}</p>
            <table>
              <thead><tr><th>{L("Supplier", "المورد")}</th><th>{L(`Total, ${RIYAL} incl. VAT`, `الإجمالي ${RIYAL} شامل الضريبة`)}</th><th>{L("Lead time", "التوريد")}</th></tr></thead>
              <tbody>
                {brief.map((b) => (
                  <tr key={b.s} className={b.pick ? "is-pick" : ""}>
                    <td>{b.s} {b.pick ? <BadgeCheck size={14} aria-hidden /> : null}</td>
                    <td>{b.total}</td>
                    <td>{b.lead}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cnc-doc__note"><b>{L("Our read:", "رأينا:")}</b> {L("lowest landed cost and a full 2-year warranty. The 14-day option costs 6% more if the opening date moves forward.", "أقل تكلفة شاملة وضمان كامل لسنتين. خيار الـ14 يوماً أغلى بـ6% إذا تقدّم موعد الافتتاح.")}</p>
          </figure>
        </div>
      </section>

      <div className="cnc-wrap">
        <section className="cnc-steps" aria-labelledby="cnc-how">
          <h2 id="cnc-how">{L("How it runs", "كيف تمشي الخدمة")}</h2>
          <ol>
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="cnc-steps__icon" aria-hidden><s.icon size={20} /></span>
                <small>{i + 1}</small>
                <b>{s.title}</b>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="cnc-split">
          <section className="cnc-fit" aria-labelledby="cnc-fit-h">
            <h2 id="cnc-fit-h">{L("When it's worth it", "متى تستاهل")}</h2>
            <ul>{fits.map((f) => <li key={f}>{f}</li>)}</ul>
            <p className="cnc-fit__alt">
              {L("Buying one item?", "تشتري منتجاً واحداً؟")}{" "}
              <Link href={`/${locale}/rfq`}>{L("A regular request is quicker", "الطلب العادي أسرع")}</Link>.{" "}
              {L("Have a spreadsheet?", "عندك جدول؟")}{" "}
              <Link href={`/${locale}/upload-boq`}><FileSpreadsheet size={14} aria-hidden /> {L("Upload your BOQ", "ارفع جدول الكميات")}</Link>.
            </p>
          </section>

          <section id="brief" className="cnc-brief" aria-labelledby="cnc-brief-h">
            <h2 id="cnc-brief-h">{L("Tell us what you need", "قل لنا وش تحتاج")}</h2>
            <p>{L("Two minutes. A sourcing lead calls you to agree the scope before any work starts.", "دقيقتين. مسؤول توريد يتصل عليك ونتفق على النطاق قبل ما نبدأ.")}</p>
            <ConciergeIntake locale={locale} />
          </section>
        </div>
      </div>
    </div>
  );
}
