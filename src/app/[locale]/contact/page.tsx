import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Search, Sparkles, Store } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { ContactForm } from "@/components/contact/ContactForm";
import { SITE_CONTACT } from "@/data/site-contact";
import { whatsappLink } from "@/components/products/product-helpers";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/contact", "ignored", undefined, { seoKey: "contact" });
}

/** Contact starts from intent: most people want prices or a supplier, which have faster paths than a message. */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const office = SITE_CONTACT.office;
  const wa = whatsappLink(SITE_CONTACT.whatsapp);
  const waText = encodeURIComponent(L("Hi Hukum, I need help sourcing:", "مرحباً حكم، أحتاج مساعدة في توريد:"));

  const paths = [
    { icon: Search, href: `/${locale}/rfq`, title: L("I need prices for a product", "أبي أسعار منتج"), text: L("Send one request and compare quotes from suppliers who sell it.", "أرسل طلباً واحداً وقارن عروض الموردين اللي يبيعونه.") },
    { icon: Sparkles, href: `/${locale}/sourcing-help`, title: L("Find suppliers for me", "ابحثوا لي عن موردين"), text: L("Our sourcing team finds and compares suppliers on your behalf.", "فريق التوريد يبحث ويقارن الموردين نيابةً عنك.") },
    { icon: Store, href: `/${locale}/become-a-vendor`, title: L("I want to sell on Hukum", "أبي أبيع عبر حكم"), text: L("List your company and receive requests that match what you sell.", "سجّل شركتك واستقبل الطلبات المطابقة لمنتجاتك.") },
  ];
  const desks = [
    { title: L("Buyers and sourcing", "المشترون والتوريد"), mail: SITE_CONTACT.buyersEmail },
    { title: L("Suppliers", "الموردون"), mail: SITE_CONTACT.vendorsEmail },
    { title: L("Partnerships", "الشراكات"), mail: SITE_CONTACT.partnershipsEmail },
    { title: L("Technical support", "الدعم التقني"), mail: SITE_CONTACT.supportEmail },
  ];

  return (
    <div className="hiw ctc" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("How can we help?", "كيف نقدر نساعدك؟")}</h1>
          <p>{L("Pick what you came for. The first two are faster than writing to us.", "اختر اللي جيت عشانه. أول خيارين أسرع من مراسلتنا.")}</p>
        </header>

        <nav className="ctc__paths" aria-label={L("What do you need?", "وش تحتاج؟")}>
          {paths.map((p) => (
            <Link key={p.href} href={p.href} className="ctc__path">
              <span className="ctc__icon" aria-hidden><p.icon size={20} /></span>
              <b>{p.title}</b>
              <span>{p.text}</span>
              <ArrowRight size={18} className="ctc__go" aria-hidden />
            </Link>
          ))}
        </nav>

        <div className="ctc__body">
          <section id="form" className="ctc__form" aria-labelledby="ctc-form-h">
            <h2 id="ctc-form-h">{L("Or send us a message", "أو أرسل لنا رسالة")}</h2>
            <p>{L("You get a reference number straight away. We reply within working hours.", "يوصلك رقم مرجعي فوراً، ونرد خلال ساعات العمل.")}</p>
            <ContactForm locale={locale} />
          </section>

          <aside className="ctc__side">
            <section id="whatsapp" className="ctc__card ctc__wa" aria-labelledby="ctc-wa-h">
              <h2 id="ctc-wa-h"><MessageCircle size={18} aria-hidden /> WhatsApp</h2>
              {wa ? (
                <>
                  <p>{L("Send what you need, a photo or your list. Our sourcing team replies on WhatsApp.", "أرسل اللي تحتاجه أو صورة أو قائمتك، وفريق التوريد يرد عليك بالواتساب.")}</p>
                  <a href={`${wa}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="ctc__wa-btn">{L("Open WhatsApp", "افتح واتساب")}</a>
                </>
              ) : (
                <>
                  <p>{L("Our WhatsApp line isn't open yet. Until it is, send your request here and we reply by phone or email.", "خط الواتساب ما انفتح بعد. لين يفتح، أرسل طلبك هنا ونرد عليك بالجوال أو البريد.")}</p>
                  <Link href={`/${locale}/rfq`} className="ctc__wa-btn">{L("Send a request instead", "أرسل طلباً بدلاً منه")}</Link>
                </>
              )}
            </section>

            <section className="ctc__card" aria-labelledby="ctc-desk-h">
              <h2 id="ctc-desk-h"><Mail size={18} aria-hidden /> {L("Email the right team", "راسل الفريق المناسب")}</h2>
              <ul className="ctc__desks">
                {desks.map((d) => (
                  <li key={d.mail}>
                    <span>{d.title}</span>
                    <a href={`mailto:${d.mail}`} dir="ltr">{d.mail}</a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ctc__card" aria-labelledby="ctc-office-h">
              <h2 id="ctc-office-h"><MapPin size={18} aria-hidden /> {L("Where we are", "وين نحن")}</h2>
              <p>{isAr ? `${office.city.ar}، ${office.country.ar}` : `${office.city.en}, ${office.country.en}`}</p>
              {office.address.en ? <p>{isAr ? office.address.ar : office.address.en}</p> : null}
              <p className="ctc__hours"><Clock size={15} aria-hidden /> {isAr ? office.hours.ar : office.hours.en}</p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
