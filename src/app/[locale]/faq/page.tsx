export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ChevronDown, MessageCircle, Send } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { CMSPage } from "@/modules/platform/platform.model";
import { t } from "@/lib/utils";
import { rfqPromise } from "@/lib/rfq-promise";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, faqPageLd } from "@/modules/seo/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/faq", "ignored", undefined, { seoKey: "faq" });
}

type QA = { q: string; a: string };
type Group = { id: string; title: string; items: QA[] };

/** Curated answers, grouped by what people ask about. CMS entries are added under "More questions". */
function groups(isAr: boolean, locale: Locale): Group[] {
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  return [
    {
      id: "buying",
      title: L("Buying on Hukum", "الشراء عبر حكم"),
      items: [
        { q: L("Is Hukum free for buyers?", "هل حكم مجاني للمشترين؟"), a: L("Yes. Searching, sending requests and comparing quotes is free. There is no subscription and no commission on your deals.", "نعم. البحث وإرسال الطلبات ومقارنة العروض مجاني، بدون اشتراك وبدون عمولة على صفقاتك.") },
        { q: L("How does a quote request work?", "كيف يعمل طلب عرض السعر؟"), a: L(`You describe what you need, how many and where it goes. We send it to suppliers who sell it and their quotes arrive in your account. ${rfqPromise("en")}.`, `تكتب وش تحتاج وكم ووين يوصل، ونرسله للموردين اللي يبيعونه وتوصلك عروضهم في حسابك. ${rfqPromise("ar")}.`) },
        { q: L("Can I ask for several items in one request?", "أقدر أطلب أكثر من منتج في طلب واحد؟"), a: L("Yes. Add items one by one, paste your whole list, or upload a bill of quantities. Each item keeps its own quantity and unit.", "نعم. أضف المنتجات واحداً واحداً، أو الصق قائمتك كاملة، أو ارفع جدول الكميات. وكل منتج يحتفظ بكميته ووحدته.") },
        { q: L("What if no supplier lists what I need?", "وإذا ما فيه مورد يعرض اللي أحتاجه؟"), a: L("Send the request anyway. When no listed supplier matches, the Hukum team looks for suppliers and adds them to your request.", "أرسل الطلب. إذا ما طابقه مورد مسجّل، يبحث فريق حكم عن موردين ويضيفهم لطلبك.") },
        { q: L("Do I need an account?", "أحتاج حساب؟"), a: L("You can browse and compare without one. To send a request or see a supplier's number you sign in with your mobile number. Your draft request is kept while you do.", "تقدر تتصفح وتقارن بدون حساب. لإرسال طلب أو رؤية رقم المورد تسجّل الدخول برقم جوالك، وطلبك محفوظ أثناء ذلك.") },
      ],
    },
    {
      id: "quotes",
      title: L("Quotes and prices", "العروض والأسعار"),
      items: [
        { q: L("Why do listings say “From” before the price?", "ليش الأسعار مكتوب قبلها «يبدأ من»؟"), a: L("It is the supplier's starting price. Your final price depends on quantity, specification and delivery city, which is why the quote matters.", "هذا السعر المبدئي للمورد، والسعر النهائي يعتمد على الكمية والمواصفات ومدينة التوصيل، ولهذا يهم عرض السعر.") },
        { q: L("How do I compare quotes fairly?", "كيف أقارن العروض بعدل؟"), a: L("Open a request and its quotes appear side by side. We work out the landed cost per unit, which adds VAT and delivery to the unit price, and mark the best value in each row.", "افتح الطلب وتظهر عروضه جنباً إلى جنب. نحسب تكلفة الوحدة شاملة الضريبة والتوصيل، ونميّز الأفضل في كل صف.") },
        { q: L("What happens when I accept a quote?", "وش يصير لما أقبل عرضاً؟"), a: L("The other quotes on that request are declined, the chosen supplier's contact details are shown to you and a deal record is saved in your account. Payment and delivery are agreed directly with the supplier.", "تُرفض بقية العروض على الطلب، وتظهر لك بيانات المورد المختار، ويُحفظ سجل الصفقة في حسابك. والدفع والتوصيل تتفقون عليه مباشرة.") },
        { q: L("Does Hukum take a commission?", "هل تأخذ حكم عمولة؟"), a: L("No. Orders are agreed directly between the buyer and the supplier.", "لا. الطلبات تُتفق مباشرة بين المشتري والمورد.") },
      ],
    },
    {
      id: "trust",
      title: L("Suppliers and trust", "الموردون والثقة"),
      items: [
        { q: L("What does the green tick mean?", "وش تعني العلامة الخضراء؟"), a: L("The supplier is Verified: they passed Hukum's identity and business checks. Two earlier levels exist, Registered and CR checked.", "المورد موثّق: اجتاز فحوصات حكم للهوية والنشاط. وفيه مستويين قبلها: مسجّل وتم فحص السجل.") },
        { q: L("Is a verified supplier guaranteed?", "هل المورد الموثّق مضمون؟"), a: L("Verification confirms who the company is. It is not a guarantee of quality or delivery. Ask for samples on large orders and confirm the bank account before paying.", "التوثيق يثبت هوية الشركة، وما يضمن الجودة أو التوصيل. اطلب عينات في الطلبات الكبيرة وتأكد من الحساب البنكي قبل الدفع.") },
        { q: L("How do I report a supplier?", "كيف أبلّغ عن مورد؟"), a: L("Use Report a concern on the supplier's page or the Help menu. We review every report and re-check the supplier.", "استخدم «بلّغ عن مشكلة» في صفحة المورد أو قائمة المساعدة. نراجع كل بلاغ ونعيد فحص المورد.") },
      ],
    },
    {
      id: "privacy",
      title: L("Privacy and contact", "الخصوصية والتواصل"),
      items: [
        { q: L("Who sees my phone number?", "مين يشوف رقمي؟"), a: L("Only a supplier you choose to contact, and only after you agree. You see their number at the same time. Every reveal is logged.", "فقط المورد اللي تختار تتواصل معه وبعد موافقتك، وتشوف رقمه في نفس الوقت. وكل كشف للرقم مسجّل.") },
        { q: L("Can suppliers message me without asking?", "يقدر المورد يراسلني بدون إذن؟"), a: L("No. Suppliers reply to your requests inside Hukum. They only get your number when you share it.", "لا. الموردون يردون على طلباتك داخل حكم، وما يحصلون على رقمك إلا إذا شاركته.") },
        { q: L("Is the site in Arabic?", "هل الموقع بالعربي؟"), a: L("Yes, every page works in Arabic and English, and you can search in either.", "نعم، كل الصفحات بالعربي والإنجليزي، وتقدر تبحث بأي لغة.") },
      ],
    },
    {
      id: "selling",
      title: L("Selling on Hukum", "البيع عبر حكم"),
      items: [
        { q: L("How do I list my company?", "كيف أسجّل شركتي؟"), a: L("Create a supplier account, add your commercial registration and your products. You start receiving requests that match what you sell.", "أنشئ حساب مورد، أضف سجلك التجاري ومنتجاتك، وتبدأ توصلك الطلبات المطابقة لمنتجاتك.") },
        { q: L("What does it cost to sell?", "كم تكلفة البيع؟"), a: L("Listing is free through 2027. Any paid placement is always labelled as such for buyers.", "التسجيل مجاني حتى 2027، وأي ظهور مدفوع يظهر للمشتري بوضوح أنه مدفوع.") },
        { q: L("Can I upload my catalogue in one go?", "أقدر أرفع الكتالوج دفعة وحدة؟"), a: L("Yes. Upload your price list as an Excel or CSV file, up to 500 products. They arrive as drafts you check before sending for review.", "نعم. ارفع قائمة أسعارك كملف Excel أو CSV، لين ٥٠٠ منتج. توصل كمسودات تراجعها قبل إرسالها للمراجعة.") },
      ],
    },
  ];
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  let cms: QA[] = [];
  try {
    await connectDB();
    const rows = await CMSPage.find({ status: "published", type: "faq" }).sort({ createdAt: 1 }).lean();
    cms = rows.map((item) => ({
      q: t(locale, item.title as { en?: string; ar?: string }),
      a: t(locale, item.body as { en?: string; ar?: string }),
    }));
  } catch {
    /* offline: curated answers still render */
  }

  const all = groups(isAr, locale);
  const known = new Set(all.flatMap((g) => g.items.map((i) => i.q.toLowerCase())));
  const extra = cms.filter((c) => c.q && !known.has(c.q.toLowerCase()));
  if (extra.length) all.push({ id: "more", title: L("More questions", "أسئلة أخرى"), items: extra });

  return (
    <>
      <JsonLd
        data={[
          faqPageLd(all.flatMap((g) => g.items)),
          breadcrumbLd(locale, [{ name: L("Home", "الرئيسية"), path: "/" }, { name: L("FAQ", "الأسئلة الشائعة") }]),
        ]}
      />
      <div className="hiw faq" dir={isAr ? "rtl" : "ltr"}>
        <div className="hiw__wrap">
          <header className="hiw__head">
            <h1>{L("Questions, answered", "أسئلتك وإجاباتها")}</h1>
            <p>{L("How buying, quotes, verification and privacy work on Hukum. Short answers first, details where they matter.", "كيف يعمل الشراء والعروض والتوثيق والخصوصية في حكم. إجابات قصيرة، وتفاصيل حيث تهم.")}</p>
          </header>

          <div className="faq__layout">
            <nav className="faq__nav" aria-label={L("Topics", "المواضيع")}>
              {all.map((g) => (
                <a key={g.id} href={`#${g.id}`}>
                  {g.title} <small>{g.items.length}</small>
                </a>
              ))}
            </nav>

            <div className="faq__groups">
              {all.map((g) => (
                <section key={g.id} id={g.id} className="faq__group" aria-labelledby={`faq-${g.id}`}>
                  <h2 id={`faq-${g.id}`}>{g.title}</h2>
                  {g.items.map((item, i) => (
                    <details key={item.q} className="faq__item" open={g.id === "buying" && i === 0}>
                      <summary>
                        <span>{item.q}</span>
                        <ChevronDown size={18} aria-hidden />
                      </summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </section>
              ))}
            </div>
          </div>

          <aside className="vdir__join">
            <div>
              <b>{L("Didn't find your answer?", "ما لقيت إجابتك؟")}</b>
              <span>{L("Ask us directly or send a request and see how it works.", "اسألنا مباشرة أو أرسل طلباً وشوف كيف يشتغل.")}</span>
            </div>
            <div className="faq__cta">
              <Link href={`/${locale}/contact`} className="brw__btn brw__btn--dark" style={{ width: "auto" }}><MessageCircle size={15} aria-hidden /> {L("Contact us", "تواصل معنا")}</Link>
              <Link href={`/${locale}/rfq`} className="faq__link"><Send size={14} aria-hidden /> {L("Request quotes", "اطلب عروض أسعار")}</Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
