import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowUpRight, BadgeCheck, FileSpreadsheet, Inbox, MapPin, Percent, Scale, Store } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { sellerIsExternal, sellerLoginUrl, sellerRegisterUrl } from "@/lib/seller-admin";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/become-a-vendor", "ignored", undefined, { seoKey: "become-a-vendor" });
}

/** Supplier sign-up pitch: show the request a supplier will receive, then the four steps and the terms. */
export default async function BecomeAVendorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const registerHref = sellerRegisterUrl(locale);
  const loginHref = sellerLoginUrl(locale);
  const ext = sellerIsExternal() ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};

  const gets = [
    { icon: Inbox, b: L("Requests that match what you sell", "طلبات تطابق منتجاتك"), t: L("Buyers describe the item, quantity and city. You only see requests for your categories.", "المشتري يحدد المنتج والكمية والمدينة، وتشوف فقط طلبات فئاتك.") },
    { icon: Store, b: L("Your own profile page", "صفحتك الخاصة"), t: L("Products, cities you deliver to and certificates, with the verified tick once checked.", "منتجاتك والمدن اللي توصلها وشهاداتك، مع علامة التوثيق بعد الفحص.") },
    { icon: Scale, b: L("Win on more than price", "تفوز بأكثر من السعر") , t: L("Quotes are compared on lead time, payment terms and validity too, so service counts.", "العروض تُقارن بمدة التوريد وشروط الدفع والصلاحية، فالخدمة تفرق.") },
    { icon: Percent, b: L("No commission", "بدون عمولة"), t: L("You agree the deal and get paid directly by the buyer.", "تتفق على الصفقة ويدفع لك المشتري مباشرة.") },
  ];
  const steps = [
    { b: L("Register with your CR", "سجّل بسجلك التجاري"), t: L("About five minutes. Company name, CR number and a contact person.", "حوالي خمس دقائق: اسم الشركة ورقم السجل وشخص للتواصل.") },
    { b: L("Add your products", "أضف منتجاتك"), t: L("One by one, or upload a spreadsheet or PDF catalogue and review before it goes live.", "واحداً واحداً، أو ارفع جدولاً أو كتالوج PDF وراجعه قبل النشر.") },
    { b: L("Get verified", "احصل على التوثيق"), t: L("We check your registration and documents. Verified suppliers show the green tick.", "نفحص سجلك ومستنداتك، والموثّقون تظهر لهم العلامة الخضراء.") },
    { b: L("Quote and win", "قدّم عرضك واكسب"), t: L("Reply to requests with your price, lead time and terms. Buyers accept the quote that fits.", "رد على الطلبات بسعرك ومدتك وشروطك، والمشتري يقبل العرض المناسب.") },
  ];

  return (
    <div className="hiw sup" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="sup-hero">
          <div>
            <p className="sup-hero__tag">{L("Free through 2027 for founding suppliers", "مجاني حتى 2027 للموردين المؤسسين")}</p>
            <h1>{L("Buyers across the Kingdom are asking for what you sell", "مشترون في كل المملكة يطلبون اللي تبيعه")}</h1>
            <p>{L("List your company once. Get requests with the item, quantity and delivery city already filled in, and answer with a quote.", "سجّل شركتك مرة وحدة، وتوصلك طلبات فيها المنتج والكمية ومدينة التوصيل، وترد بعرض سعرك.")}</p>
            <div className="hiw__actions">
              <a href={registerHref} {...ext} className="brw__btn brw__btn--primary">
                {L("List your company", "سجّل شركتك")} <ArrowUpRight size={15} aria-hidden />
              </a>
              <a href={loginHref} {...ext} className="vcard__view">{L("Already listed? Sign in", "مسجّل من قبل؟ ادخل")}</a>
            </div>
          </div>

          <figure className="hiw__shot sup-req" aria-label={L("Example request", "مثال على طلب")}>
            <figcaption>{L("What you receive (example)", "اللي يوصلك (مثال)")}</figcaption>
            <div className="sup-req__card">
              <p className="sup-req__new">{L("New request", "طلب جديد")}</p>
              <b>{L("Safety helmets, white, EN 397", "خوذ سلامة بيضاء EN 397")}</b>
              <dl>
                <div><dt>{L("Quantity", "الكمية")}</dt><dd>500 {L("pcs", "قطعة")}</dd></div>
                <div><dt>{L("Deliver to", "التوصيل")}</dt><dd><MapPin size={13} aria-hidden /> {L("Riyadh", "الرياض")}</dd></div>
                <div><dt>{L("Needed by", "مطلوب قبل")}</dt><dd>{L("2 weeks", "أسبوعين")}</dd></div>
              </dl>
              <span className="sup-req__btn">{L("Send your quote", "أرسل عرضك")}</span>
            </div>
          </figure>
        </header>

        <section className="sup-gets" aria-labelledby="sup-gets-h">
          <h2 id="sup-gets-h">{L("What you get", "وش تحصل")}</h2>
          <ul>
            {gets.map((g) => (
              <li key={g.b}>
                <span aria-hidden><g.icon size={20} /></span>
                <b>{g.b}</b>
                <p>{g.t}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="sup-steps" aria-labelledby="sup-steps-h">
          <h2 id="sup-steps-h">{L("From sign-up to your first quote", "من التسجيل لأول عرض")}</h2>
          <ol className="boq-steps">
            {steps.map((s, i) => (
              <li key={s.b}>
                <span aria-hidden>{i + 1}</span>
                <div><b>{s.b}</b><p>{s.t}</p></div>
              </li>
            ))}
          </ol>
          <aside className="sup-terms">
            <p><b>{L("Free through 2027", "مجاني حتى 2027")}</b> {L("Listing, requests and quoting cost nothing.", "التسجيل والطلبات وتقديم العروض بدون رسوم.")}</p>
            <p><b>{L("No commission", "بدون عمولة")}</b> {L("Ever. Deals are between you and the buyer.", "أبداً. الصفقة بينك وبين المشتري.")}</p>
            <p><b>{L("Paid placement is labelled", "الظهور المدفوع واضح")}</b> {L("If you promote a listing later, buyers see that it is promoted.", "إذا روّجت منتجاً لاحقاً، يشوف المشتري أنه مروّج.")}</p>
            <p className="sup-terms__links">
              <Link href={`/${locale}/verification`}><BadgeCheck size={14} aria-hidden /> {L("How verification works", "كيف يتم التوثيق")}</Link>
              <Link href={`/${locale}/faq#selling`}><FileSpreadsheet size={14} aria-hidden /> {L("Seller questions", "أسئلة الموردين")}</Link>
            </p>
          </aside>
        </section>

        <aside className="vdir__join">
          <div>
            <b>{L("Ready when you are", "جاهزين متى ما كنت جاهز")}</b>
            <span>{L("About five minutes to register. Your first products can go live today.", "التسجيل ياخذ حوالي خمس دقائق، ومنتجاتك تقدر تنزل اليوم.")}</span>
          </div>
          <a href={registerHref} {...ext} className="brw__btn brw__btn--dark" style={{ width: "auto" }}>
            {L("List your company", "سجّل شركتك")}
          </a>
        </aside>
      </div>
    </div>
  );
}
