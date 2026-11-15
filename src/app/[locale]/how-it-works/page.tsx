import Link from "next/link";
import { BadgeCheck, Phone, Search, Send, ShieldCheck } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/how-it-works", "ignored", undefined, { seoKey: "how-it-works" });
}

/** Buyer journey shown with the product itself at each step (example data, labelled). */
export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const example = L("Example", "مثال");

  const quotes = [
    { name: L("Najd Safety Trading", "نجد لتجارة السلامة"), city: L("Riyadh", "الرياض"), price: "41.50", lead: L("5 days", "5 أيام"), terms: L("30% advance", "30% مقدّم"), best: true },
    { name: L("Eastern Gulf PPE", "الخليج الشرقي للسلامة"), city: L("Dammam", "الدمام"), price: "39.00", lead: L("12 days", "12 يوماً"), terms: L("Net 30", "صافي 30") },
    { name: L("Red Sea Industrial", "البحر الأحمر الصناعية"), city: L("Jeddah", "جدة"), price: "44.20", lead: L("4 days", "4 أيام"), terms: L("Cash on delivery", "عند الاستلام") },
  ];

  return (
    <div className="hiw" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("From a search to a signed order", "من البحث إلى الطلب المؤكد")}</h1>
          <p>
            {L(
              "Type what you need, send one request, compare quotes side by side, then talk to the supplier you choose.",
              "اكتب ما تحتاجه، أرسل طلباً واحداً، قارن العروض جنباً إلى جنب، ثم تواصل مع المورد اللي تختاره."
            )}
          </p>
          <div className="hiw__actions">
            <Link href={`/${locale}/rfq`} className="brw__btn brw__btn--primary">
              <Send size={15} aria-hidden /> {L("Request quotes", "اطلب عروض أسعار")}
            </Link>
            <Link href={`/${locale}/categories`} className="vcard__view">{L("Browse products", "تصفّح المنتجات")}</Link>
          </div>
        </header>

        <ol className="hiw__steps">
          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">1</span>
              <h2>{L("Search in your own words", "ابحث بكلماتك")}</h2>
              <p>{L("Arabic or English, with quantity and city. Hukum reads the item, the amount and where it goes.", "بالعربي أو الإنجليزي، مع الكمية والمدينة. حكم يفهم المنتج والكمية ومكان التوصيل.")}</p>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <div className="hiw__search"><Search size={16} aria-hidden /> {L("500 safety helmets delivered to Riyadh", "أبي ٥٠٠ خوذة في الرياض")}</div>
              <div className="disc-understood__row">
                <span className="disc-understood__label">{L("Understood as", "فهمنا طلبك")}</span>
                <span className="disc-chip disc-chip--on">{L("safety helmet", "خوذة سلامة")}</span>
                <span className="disc-chip disc-chip--on">500</span>
                <span className="disc-chip disc-chip--on">{L("Deliver to Riyadh", "التوصيل إلى الرياض")}</span>
              </div>
            </figure>
          </li>

          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">2</span>
              <h2>{L("Send one request", "أرسل طلباً واحداً")}</h2>
              <p>{L("Three short questions: what, where and when, and how to reach you. We pass it to suppliers who sell it.", "ثلاثة أسئلة قصيرة: وش تحتاج، ووين ومتى، وكيف نوصل لك. ونرسله للموردين اللي يبيعونه.")}</p>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <div className="rfq2__summary">
                <p className="rfq2__what">{L("Safety helmets, white, EN 397", "خوذ سلامة بيضاء EN 397")}</p>
                <dl>
                  <div><dt>{L("Quantity", "الكمية")}</dt><dd>500 {L("pcs", "قطعة")}</dd></div>
                  <div><dt>{L("Deliver to", "التوصيل")}</dt><dd>{L("Riyadh", "الرياض")}</dd></div>
                  <div><dt>{L("Needed by", "مطلوب قبل")}</dt><dd>{L("2 weeks", "أسبوعين")}</dd></div>
                </dl>
                <span className="rfq2__send hiw__fake">{L("Send request", "أرسل الطلب")}</span>
              </div>
            </figure>
          </li>

          <li className="hiw__step" id="compare">
            <div className="hiw__text">
              <span className="hiw__n">3</span>
              <h2>{L("Compare quotes side by side", "قارن العروض جنباً إلى جنب")}</h2>
              <p>{L("Price per unit with VAT, lead time and payment terms in one table, not only the total.", "سعر الوحدة مع الضريبة ومدة التوريد وشروط الدفع في جدول واحد، مو الإجمالي فقط.")}</p>
            </div>
            <figure className="hiw__shot hiw__shot--wide" aria-label={example}>
              <figcaption>{example}</figcaption>
              <table className="hiw__table">
                <thead>
                  <tr>
                    <th>{L("Supplier", "المورد")}</th>
                    <th>{L("\uF0EA / pc incl. VAT", "\uF0EA / قطعة شامل الضريبة")}</th>
                    <th>{L("Lead time", "التوريد")}</th>
                    <th>{L("Payment", "الدفع")}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.name} className={q.best ? "is-pick" : ""}>
                      <td>
                        <b>{q.name} <BadgeCheck size={14} className="brw__tick" aria-hidden /></b>
                        <small>{q.city}</small>
                      </td>
                      <td className="hiw__num">{q.price}</td>
                      <td>{q.lead}</td>
                      <td>{q.terms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
          </li>

          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">4</span>
              <h2>{L("Check who you are buying from", "تأكد ممن تشتري")}</h2>
              <p>{L("Every supplier shows what Hukum checked: registration, commercial record, documents.", "كل مورد يوضّح وش تحققنا منه: التسجيل، والسجل التجاري، والمستندات.")}</p>
              <Link href={`/${locale}/verification`} className="brw__more">{L("Verification levels", "مستويات التحقق")}</Link>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <ul className="hiw__levels">
                <li><span className="hiw__lvl">{L("Registered", "مسجّل")}</span>{L("Account and basic profile", "حساب وملف أساسي")}</li>
                <li><span className="hiw__lvl">{L("CR checked", "سجل تجاري")}</span>{L("Commercial registration matched", "تمت مطابقة السجل التجاري")}</li>
                <li><span className="hiw__lvl hiw__lvl--on"><BadgeCheck size={14} aria-hidden /> {L("Verified", "موثّق")}</span>{L("Documents and business details reviewed", "تمت مراجعة المستندات وبيانات النشاط")}</li>
              </ul>
            </figure>
          </li>

          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">5</span>
              <h2>{L("Talk to the supplier you choose", "تواصل مع المورد اللي تختاره")}</h2>
              <p>{L("Agree to share your number once. The supplier gets your request and you see their number. Every reveal is logged.", "توافق مرة واحدة على مشاركة رقمك. يستلم المورد طلبك وتشوف رقمه. وكل كشف للرقم مسجّل.")}</p>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <label className="hiw__consent"><ShieldCheck size={16} aria-hidden /> {L("I agree Hukum shares my number with this supplier", "أوافق على مشاركة رقمي مع هذا المورد")}</label>
              <span className="hiw__phone" dir="ltr"><Phone size={16} aria-hidden /> +966 5X XXX XXXX</span>
            </figure>
          </li>
        </ol>

        <aside className="vdir__join">
          <div>
            <b>{L("Ready when you are", "جاهزين متى ما احتجت")}</b>
            <span>{L("Free for buyers. No subscription.", "مجاني للمشترين وبدون اشتراك.")}</span>
          </div>
          <Link href={`/${locale}/rfq`} className="brw__btn brw__btn--dark" style={{ width: "auto" }}>{L("Request quotes", "اطلب عروض أسعار")}</Link>
        </aside>
      </div>
    </div>
  );
}
