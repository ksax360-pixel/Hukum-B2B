import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { BadgeCheck, FileCheck2, FileSpreadsheet, MapPin, Store, UserRound } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { sellerIsExternal, sellerRegisterUrl } from "@/lib/seller-admin";
import { RIYAL } from "@/lib/money";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/how-it-works/suppliers",
    isAr ? "كيف يعمل حكم للموردين | Hukum" : "How Hukum works for suppliers | Hukum",
    isAr ? "من التسجيل إلى أول عرض سعر: كيف يستقبل الموردون طلبات المشترين على حكم." : "From sign-up to your first quote: how suppliers receive buyer requests on Hukum."
  );
}

/** Supplier journey shown with the screen at each step (example data, labelled), mirroring How it works for buyers. */
export default async function HowItWorksSuppliersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const example = L("Example", "مثال");
  const registerHref = sellerRegisterUrl(locale);
  const ext = sellerIsExternal() ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <div className="hiw" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("From sign-up to your first quote", "من التسجيل لأول عرض سعر")}</h1>
          <p>{L("List your company, get verified, and answer buyers who are already asking for what you sell.", "سجّل شركتك، وثّقها، ورد على مشترين يطلبون اللي تبيعه.")}</p>
          <div className="hiw__actions">
            <a href={registerHref} {...ext} className="brw__btn brw__btn--primary">{L("List your company", "سجّل شركتك")}</a>
            <Link href={`/${locale}/how-it-works`} className="vcard__view">{L("How it works for buyers", "كيف يعمل للمشترين")}</Link>
          </div>
        </header>

        <ol className="hiw__steps">
          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">1</span>
              <h2>{L("Register with your CR", "سجّل بسجلك التجاري")}</h2>
              <p>{L("Company name, commercial registration and one contact person. About five minutes.", "اسم الشركة والسجل التجاري وشخص للتواصل. حوالي خمس دقائق.")}</p>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <div className="rfq2__summary">
                <dl>
                  <div><dt>{L("Company", "الشركة")}</dt><dd>{L("Najd Safety Trading", "نجد لتجارة السلامة")}</dd></div>
                  <div><dt>{L("CR number", "رقم السجل")}</dt><dd dir="ltr">1010 •••• 42</dd></div>
                  <div><dt>{L("City", "المدينة")}</dt><dd>{L("Riyadh", "الرياض")}</dd></div>
                </dl>
                <span className="rfq2__send hiw__fake">{L("Create account", "أنشئ الحساب")}</span>
              </div>
            </figure>
          </li>

          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">2</span>
              <h2>{L("Put your catalogue online", "اعرض كتالوجك")}</h2>
              <p>{L("Add products one by one, or upload a spreadsheet or PDF price list and review it before it goes live. Your storefront works as your company website.", "أضف المنتجات واحداً واحداً، أو ارفع جدول أو قائمة أسعار PDF وراجعها قبل النشر. ومتجرك يشتغل كموقع لشركتك.")}</p>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <div className="ver__card">
                <span className="ver__logo" aria-hidden><FileSpreadsheet size={22} /></span>
                <div className="ver__id">
                  <b>{L("price-list-2026.xlsx", "قائمة-الأسعار-2026.xlsx")}</b>
                  <span>{L("128 products read, 6 need a unit", "قرأنا 128 منتجاً، 6 تحتاج وحدة")}</span>
                </div>
                <span className="ver__pill is-verified"><Store size={14} aria-hidden /> {L("Review", "راجع")}</span>
              </div>
            </figure>
          </li>

          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">3</span>
              <h2>{L("Get verified", "احصل على التوثيق")}</h2>
              <p>{L("Upload your registration and company documents. Once checked, your name shows the green tick buyers look for.", "ارفع سجلك ومستندات شركتك، وبعد الفحص يظهر اسمك بالعلامة الخضراء اللي يدور عليها المشتري.")}</p>
              <Link href={`/${locale}/verification`} className="brw__more">{L("Verification levels", "مستويات التوثيق")}</Link>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <ul className="hiw__levels">
                <li><span className="hiw__lvl"><UserRound size={14} aria-hidden /> {L("Registered", "مسجّل")}</span>{L("Account created", "تم إنشاء الحساب")}</li>
                <li><span className="hiw__lvl"><FileCheck2 size={14} aria-hidden /> {L("CR checked", "فحص السجل")}</span>{L("Registration matched", "تمت مطابقة السجل")}</li>
                <li><span className="hiw__lvl hiw__lvl--on"><BadgeCheck size={14} aria-hidden /> {L("Verified", "موثّق")}</span>{L("Documents reviewed", "تمت مراجعة المستندات")}</li>
              </ul>
            </figure>
          </li>

          <li className="hiw__step">
            <div className="hiw__text">
              <span className="hiw__n">4</span>
              <h2>{L("Receive requests that fit", "استقبل الطلبات المناسبة")}</h2>
              <p>{L("Buyers describe the item, quantity and delivery city. You only see requests for what you sell.", "المشتري يحدد المنتج والكمية ومدينة التوصيل، وتشوف فقط طلبات منتجاتك.")}</p>
            </div>
            <figure className="hiw__shot" aria-label={example}>
              <figcaption>{example}</figcaption>
              <div className="sup-req__card">
                <p className="sup-req__new">{L("New request", "طلب جديد")}</p>
                <b>{L("Safety helmets, white, EN 397", "خوذ سلامة بيضاء EN 397")}</b>
                <dl>
                  <div><dt>{L("Quantity", "الكمية")}</dt><dd>500 {L("pcs", "قطعة")}</dd></div>
                  <div><dt>{L("Deliver to", "التوصيل")}</dt><dd><MapPin size={13} aria-hidden /> {L("Riyadh", "الرياض")}</dd></div>
                  <div><dt>{L("Needed by", "مطلوب قبل")}</dt><dd>{L("2 weeks", "أسبوعين")}</dd></div>
                </dl>
              </div>
            </figure>
          </li>

          <li className="hiw__step" id="quote">
            <div className="hiw__text">
              <span className="hiw__n">5</span>
              <h2>{L("Quote and win", "قدّم عرضك واكسب")}</h2>
              <p>{L("Price each line, add lead time and payment terms. Buyers compare on more than price, so good service wins.", "سعّر كل بند وأضف مدة التوريد وشروط الدفع. المشتري يقارن بأكثر من السعر، فالخدمة الجيدة تكسب.")}</p>
            </div>
            <figure className="hiw__shot hiw__shot--wide" aria-label={example}>
              <figcaption>{example}</figcaption>
              <table className="hiw__table">
                <thead><tr><th>{L("Item", "البند")}</th><th>{L("Qty", "الكمية")}</th><th>{L(`Unit price, ${RIYAL}`, `سعر الوحدة ${RIYAL}`)}</th></tr></thead>
                <tbody>
                  <tr><td>{L("Safety helmet EN 397", "خوذة سلامة EN 397")}</td><td className="hiw__num">500</td><td className="hiw__num">38.00</td></tr>
                  <tr><td>{L("Delivery to Riyadh", "التوصيل للرياض")}</td><td className="hiw__num">1</td><td className="hiw__num">0.00</td></tr>
                  <tr className="is-pick"><td><b>{L("Total incl. 15% VAT", "الإجمالي شامل الضريبة 15%")}</b></td><td /><td className="hiw__num">21,850.00</td></tr>
                </tbody>
              </table>
            </figure>
          </li>
        </ol>

        <aside className="vdir__join">
          <div>
            <b>{L("Free for suppliers in 2027", "مجاني للموردين في 2027")}</b>
            <span>{L("No commission on your deals.", "بدون عمولة على صفقاتك.")}</span>
          </div>
          <a href={registerHref} {...ext} className="brw__btn brw__btn--dark" style={{ width: "auto" }}>{L("List your company", "سجّل شركتك")}</a>
        </aside>
      </div>
    </div>
  );
}
