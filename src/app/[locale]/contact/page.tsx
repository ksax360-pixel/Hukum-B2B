import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactChannels } from "@/components/contact/ContactChannels";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { SITE_CONTACT } from "@/data/site-contact";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/contact", "ignored", undefined, { seoKey: "contact" });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const n = (en: string, ar: string) => (isAr ? ar : en);
  const email = SITE_CONTACT.generalEmail;
  const office = SITE_CONTACT.office;
  const hasStreet = Boolean(office.address.en);

  const desks = [
    {
      title: n("General enquiries", "استفسارات عامة"),
      body: n("For general questions about Hukum.", "للاستفسارات العامة حول Hukum."),
      mail: SITE_CONTACT.generalEmail,
    },
    {
      title: n("Business enquiries", "استفسارات الأعمال"),
      body: n("For commercial discussions and enterprise conversations.", "للنقاشات التجارية والمحادثات المؤسسية."),
      mail: SITE_CONTACT.businessEmail,
    },
    {
      title: n("Vendor / supplier", "مورد / بائع"),
      body: n("For businesses interested in joining the marketplace.", "للشركات الراغبة في الانضمام إلى السوق."),
      mail: SITE_CONTACT.vendorsEmail,
    },
    {
      title: n("Buyer / procurement", "مشتري / مشتريات"),
      body: n("For sourcing and procurement requirements.", "لمتطلبات التوريد والمشتريات."),
      mail: SITE_CONTACT.buyersEmail,
    },
    {
      title: n("Partnerships", "الشراكات"),
      body: n("For strategic partnership conversations.", "لمحادثات الشراكات الاستراتيجية."),
      mail: SITE_CONTACT.partnershipsEmail,
    },
    {
      title: n("Technical support", "الدعم التقني"),
      body: n("For platform-related assistance.", "للمساعدة المتعلقة بالمنصة."),
      mail: SITE_CONTACT.supportEmail,
    },
  ];

  const faqs = [
    {
      q: n("How quickly will I hear back?", "متى أتلقى رداً؟"),
      a: n(
        "We review enquiries in business hours and aim to respond as promptly as possible. You will receive a reference number after submitting the form.",
        "نراجع الاستفسارات خلال ساعات العمل ونسعى للرد بأسرع ما يمكن. ستحصل على رقم مرجعي بعد إرسال النموذج."
      ),
    },
    {
      q: n("Can I submit an RFQ instead?", "هل يمكنني إرسال طلب عرض سعر بدلاً من ذلك؟"),
      a: n(
        "Yes. If you already know what you need to source, use the RFQ form for a structured request that can be matched with vendors.",
        "نعم. إذا كنت تعرف ما تريد توريده، استخدم نموذج طلب عرض السعر لطلب منظم يمكن مطابقته مع الموردين."
      ),
    },
    {
      q: n("I want to list my company as a supplier.", "أريد إدراج شركتي كمورد."),
      a: n(
        "Select Supplier / vendor as the enquiry type, or create a vendor account from registration. Share your category and markets to speed up onboarding.",
        "اختر نوع الاستفسار مورد / بائع، أو أنشئ حساب مورد من التسجيل. شارك تصنيفك وأسواقك لتسريع الانضمام."
      ),
    },
    {
      q: n("Do you support Arabic and English?", "هل تدعمون العربية والإنجليزية؟"),
      a: n(
        "Yes. Hukum is bilingual. You can browse and contact us in English or Arabic.",
        "نعم. Hukum ثنائية اللغة. يمكنك التصفح والتواصل بالعربية أو الإنجليزية."
      ),
    },
  ];

  return (
    <div className="kt-contact-page">
      <header className="kt-contact-hero">
        <div className="hukum-page__wrap">
          <HukumPageHeader
            locale={locale}
            eyebrow={n("Contact", "تواصل")}
            title={n("Let’s talk trade.", "لنتحدث عن التجارة.")}
            lead={n(
              "Have a question, want to join the platform, looking for suppliers, or interested in partnering with Hukum? Our team is here to help.",
              "هل لديك سؤال، أو ترغب بالانضمام للمنصة، أو تبحث عن موردين، أو تهتم بالشراكة مع Hukum؟ فريقنا هنا للمساعدة."
            )}
            goldEyebrow
          />
        </div>
      </header>

      <div className="container-custom kt-contact-layout">
        <aside className="kt-contact-aside">
          <h2 className="kt-contact-aside__title">{n("Reach the right desk", "تواصل مع الفريق المناسب")}</h2>
          <p className="kt-contact-aside__copy">
            {n(
              "Choose the enquiry type that matches your need — or email us directly.",
              "اختر نوع الاستفسار المناسب لاحتياجك — أو راسلنا مباشرة."
            )}
          </p>

          <div className="kt-contact-desks">
            {desks.map((d) => (
              <a key={d.title} href={`mailto:${d.mail}?subject=${encodeURIComponent(d.title)}`} className="kt-contact-desk">
                <strong>{d.title}</strong>
                <span>{d.body}</span>
                <em>{d.mail}</em>
              </a>
            ))}
          </div>

          <div className="kt-contact-aside__direct">
            <p className="kt-about-eyebrow">{n("Direct channels", "قنوات مباشرة")}</p>
            <ContactChannels locale={locale} />
          </div>
        </aside>

        <div className="kt-contact-main">
          <div className="kt-contact-panel">
            <header className="kt-contact-panel__head">
              <h2>{n("Send an enquiry", "أرسل استفساراً")}</h2>
              <p>
                {n(
                  "Tell us what you need. Additional fields appear based on your enquiry type so we can route your message correctly.",
                  "أخبرنا بما تحتاجه. تظهر حقول إضافية حسب نوع الاستفسار لنوجّه رسالتك بشكل صحيح."
                )}
              </p>
            </header>
            <ContactForm locale={locale} />
          </div>
        </div>
      </div>

      <section className="kt-contact-office">
        <div className="container-custom kt-contact-office__inner">
          <div>
            <p className="kt-about-eyebrow">{n("Presence", "التواجد")}</p>
            <h2 className="kt-about-h2">{n("Based in Riyadh", "مقرنا في الرياض")}</h2>
            <p className="kt-about-sub">
              {n(
                "Hukum is rooted in Saudi Arabia, with a focus on connecting regional and international trade.",
                "Hukum متجذّرة في السعودية، مع تركيز على ربط التجارة الإقليمية والدولية."
              )}
            </p>
            <dl className="kt-contact-office__meta">
              <div>
                <dt>{n("City", "المدينة")}</dt>
                <dd>
                  {n(office.city.en, office.city.ar)}, {n(office.country.en, office.country.ar)}
                </dd>
              </div>
              {hasStreet ? (
                <div>
                  <dt>{n("Address", "العنوان")}</dt>
                  <dd>{n(office.address.en, office.address.ar)}</dd>
                </div>
              ) : null}
              <div>
                <dt>{n("Hours", "ساعات العمل")}</dt>
                <dd>{n(office.hours.en, office.hours.ar)}</dd>
              </div>
              <div>
                <dt>{n("Email", "البريد")}</dt>
                <dd>
                  <a href={`mailto:${email}`}>{email}</a>
                </dd>
              </div>
            </dl>
            {hasStreet ? (
              <a
                className="kt-contact-directions"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${office.address.en}, ${office.city.en}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {n("Get directions", "الحصول على الاتجاهات")}
              </a>
            ) : null}
          </div>
          <div className="kt-contact-markets">
            <p className="kt-about-eyebrow">{n("Find us around the world", "اعثر علينا حول العالم")}</p>
            <ul>
              {SITE_CONTACT.markets.map((m) => (
                <li key={m.id}>
                  <strong>{n(m.name.en, m.name.ar)}</strong>
                  <span>{n(m.status.en, m.status.ar)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="kt-contact-faq">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("FAQ", "الأسئلة الشائعة")}</p>
            <h2 className="kt-about-h2">{n("Common questions", "أسئلة شائعة")}</h2>
          </header>
          <div className="kt-contact-faq__list">
            {faqs.map((f) => (
              <details key={f.q} className="kt-contact-faq__item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className="kt-contact-faq__alt">
            {n("Prefer a structured sourcing request?", "تفضل طلب توريد منظماً؟")}{" "}
            <Link href={`/${locale}/rfq`}>{n("Create an RFQ", "أنشئ طلب عرض سعر")}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
