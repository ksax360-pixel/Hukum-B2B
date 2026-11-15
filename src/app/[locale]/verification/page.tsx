import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { AlertTriangle, BadgeCheck, Building2, Check, FileCheck2, MapPin, Search, UserRound } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/verification", "ignored", undefined, { seoKey: "verification" });
}

/** Verification levels told the same way as How it works: each level shown as the buyer sees it on a supplier card. */
export default async function VerificationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const example = L("Example", "مثال");
  const supplier = L("Najd Safety Trading", "نجد لتجارة السلامة");

  const levels = [
    {
      n: 1,
      name: L("Registered", "مسجّل"),
      text: L("The supplier opened an account and filled in the basic company profile. Nothing has been checked yet.", "فتح المورد حساباً وعبّى بيانات الشركة الأساسية. ما تم التحقق من شيء بعد."),
      checks: [L("Contact details confirmed by the supplier", "بيانات التواصل مؤكدة من المورد"), L("Company profile filled in", "ملف الشركة مكتمل")],
      not: L("Does not mean the commercial registration was reviewed", "لا يعني مراجعة السجل التجاري"),
      badge: null as null | "cr" | "verified",
    },
    {
      n: 2,
      name: L("CR checked", "تم فحص السجل"),
      text: L("Hukum reviewed the commercial registration the supplier submitted and matched it to the company name on the profile.", "راجعت حكم السجل التجاري المقدّم وطابقته مع اسم الشركة في الملف."),
      checks: [L("CR number reviewed", "مراجعة رقم السجل"), L("Company name matches the CR", "اسم الشركة يطابق السجل"), L("Based on information available at the time of the check", "حسب المعلومات المتاحة وقت الفحص")],
      not: null,
      badge: "cr" as const,
    },
    {
      n: 3,
      name: L("Verified", "موثّق"),
      text: L("The supplier passed Hukum's wider identity and business checks. This is the green tick you see next to supplier names.", "اجتاز المورد فحوصات حكم الأوسع للهوية والنشاط. هذه العلامة الخضراء اللي تشوفها جنب أسماء الموردين."),
      checks: [L("CR and identity checks", "فحص السجل والهوية"), L("Evidence of real business activity reviewed", "مراجعة ما يثبت النشاط الفعلي"), L("Re-reviewed when something changes", "إعادة المراجعة عند أي تغيير")],
      not: null,
      badge: "verified" as const,
    },
  ];

  return (
    <div className="hiw" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("Know who you are buying from", "اعرف ممن تشتري")}</h1>
          <p>
            {L(
              "Every supplier on Hukum shows how far they got through our checks. Three levels, earned through checks and never sold.",
              "كل مورد في حكم يوضّح وين وصل في فحوصاتنا. ثلاث مستويات تُكتسب بالفحص وما تُباع."
            )}
          </p>
          <div className="hiw__actions">
            <Link href={`/${locale}/vendors?verified=1`} className="brw__btn brw__btn--primary">
              <BadgeCheck size={15} aria-hidden /> {L("Browse verified suppliers", "تصفّح الموردين الموثّقين")}
            </Link>
            <Link href={`/${locale}/how-it-works`} className="vcard__view">{L("How Hukum works", "كيف يعمل حكم")}</Link>
          </div>
        </header>

        <ol className="hiw__steps">
          {levels.map((lv) => (
            <li key={lv.n} className="hiw__step">
              <div className="hiw__text">
                <span className="hiw__n">{lv.n}</span>
                <h2>{lv.name}</h2>
                <p>{lv.text}</p>
                <ul className="ver__checks">
                  {lv.checks.map((c) => <li key={c}><Check size={15} aria-hidden /> {c}</li>)}
                  {lv.not ? <li className="is-not"><AlertTriangle size={15} aria-hidden /> {lv.not}</li> : null}
                </ul>
              </div>
              <figure className="hiw__shot" aria-label={example}>
                <figcaption>{example}</figcaption>
                <div className="ver__card">
                  <span className="ver__logo" aria-hidden><Building2 size={22} /></span>
                  <div className="ver__id">
                    <b>
                      {supplier}
                      {lv.badge === "verified" ? <BadgeCheck size={16} className="ver__tick" aria-label={L("Verified", "موثّق")} /> : null}
                    </b>
                    <span><MapPin size={13} aria-hidden /> {L("Riyadh", "الرياض")}</span>
                  </div>
                  <span className={`ver__pill${lv.badge ? ` is-${lv.badge}` : ""}`}>
                    {lv.badge === "verified" ? <BadgeCheck size={14} aria-hidden /> : lv.badge === "cr" ? <FileCheck2 size={14} aria-hidden /> : <UserRound size={14} aria-hidden />}
                    {lv.name}
                  </span>
                </div>
                <div className="ver__meter" aria-hidden>
                  {[1, 2, 3].map((i) => <i key={i} className={i <= lv.n ? "is-on" : ""} />)}
                </div>
              </figure>
            </li>
          ))}
        </ol>

        <section className="ver__honest" aria-labelledby="ver-not">
          <div>
            <h2 id="ver-not">{L("What a badge does not promise", "وش ما تضمنه الشارة")}</h2>
            <p>
              {L(
                "Verification checks who the company is. It is not a guarantee of product quality, delivery or the outcome of a deal.",
                "التحقق يثبت من هي الشركة، وما يضمن جودة المنتج أو التوصيل أو نتيجة الصفقة."
              )}
            </p>
          </div>
          <ul>
            <li><Search size={16} aria-hidden /> {L("Ask for samples and references on large orders", "اطلب عينات ومراجع في الطلبات الكبيرة")}</li>
            <li><FileCheck2 size={16} aria-hidden /> {L("Check the licences your purchase needs, like SASO or SFDA", "تأكد من التراخيص اللي يحتاجها طلبك مثل SASO أو SFDA")}</li>
            <li><AlertTriangle size={16} aria-hidden /> {L("Confirm the bank account belongs to the supplier before you pay", "تأكد إن الحساب البنكي باسم المورد قبل الدفع")}</li>
          </ul>
        </section>

        <aside className="vdir__join">
          <div>
            <b>{L("Something looks wrong with a supplier?", "شي غريب في مورد؟")}</b>
            <span>{L("Tell us. We review every report and re-check the supplier.", "بلّغنا. نراجع كل بلاغ ونعيد فحص المورد.")}</span>
          </div>
          <Link href={`/${locale}/report`} className="brw__btn brw__btn--dark" style={{ width: "auto" }}>{L("Report a concern", "بلّغ عن مشكلة")}</Link>
        </aside>
      </div>
    </div>
  );
}
