import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, BadgeCheck, BookOpen, FileSpreadsheet, LifeBuoy, Mail, MessageCircleQuestion, Scale, Send, ShieldAlert, Store, Upload } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/help", "ignored", undefined, { seoKey: "help" });
}

/** Help centre: two paths (buying, selling) with the guides for each, common questions, then a person. */
export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const h = (p: string): string => `/${locale}${p}`;

  const paths = [
    {
      id: "buy",
      title: L("I'm buying", "أنا مشتري"),
      lead: L("Free for buyers. Ask several suppliers at once and compare their quotes.", "مجاني للمشترين. اسأل أكثر من مورد مرة وحدة وقارن عروضهم."),
      links: [
        { icon: BookOpen, href: "/how-it-works", label: L("How buying works", "كيف يعمل الشراء") },
        { icon: Send, href: "/rfq", label: L("Send a request for quotes", "أرسل طلب عروض أسعار") },
        { icon: FileSpreadsheet, href: "/upload-boq", label: L("Upload a BOQ or item list", "ارفع جدول كميات أو قائمة") },
        { icon: BadgeCheck, href: "/verification", label: L("What “Verified” means", "معنى «موثّق»") },
        { icon: MessageCircleQuestion, href: "/faq#buying", label: L("Buying questions", "أسئلة الشراء") },
      ],
    },
    {
      id: "sell",
      title: L("I'm selling", "أنا مورد"),
      lead: L("Free for suppliers through 2027. Get requests that match what you sell.", "مجاني للموردين خلال ٢٠٢٧. توصلك طلبات تطابق منتجاتك."),
      links: [
        { icon: BookOpen, href: "/how-it-works/suppliers", label: L("How selling works", "كيف يعمل البيع") },
        { icon: Store, href: "/become-a-vendor", label: L("List your company", "سجّل شركتك") },
        { icon: Upload, href: "/vendor/ai-upload", label: L("Upload your price list", "ارفع قائمة أسعارك") },
        { icon: BadgeCheck, href: "/vendor/documents", label: L("Get verified", "وثّق حسابك") },
        { icon: MessageCircleQuestion, href: "/faq#selling", label: L("Selling questions", "أسئلة البيع") },
      ],
    },
  ];
  const common = [
    { q: L("Is Hukum free?", "هل حكم مجاني؟"), a: L("Yes for buyers, always. Suppliers are free through 2027.", "نعم للمشترين دائماً. والموردون مجاناً خلال ٢٠٢٧."), href: "/faq#buying" },
    { q: L("Who sees my phone number?", "مين يشوف رقمي؟"), a: L("Only a supplier you choose to contact, after you agree.", "فقط المورد اللي تختار تتواصل معه، وبعد موافقتك."), href: "/faq#privacy" },
    { q: L("What happens when I accept a quote?", "وش يصير لما أقبل عرض؟"), a: L("You get the supplier's contact and agree the order with them directly.", "تحصل على تواصل المورد وتتفق معه على الطلب مباشرة."), href: "/faq#quotes" },
    { q: L("Does Hukum handle payment or delivery?", "هل حكم يتولى الدفع أو التوصيل؟"), a: L("No. Hukum connects you; the buyer and supplier agree payment and delivery.", "لا. حكم يربطكم؛ والمشتري والمورد يتفقون على الدفع والتوصيل."), href: "/terms#about" },
  ];

  return (
    <div className="hiw help2" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("How can we help?", "كيف نقدر نساعدك؟")}</h1>
          <p>{L("Pick your side to see the guides that matter, or go straight to a person.", "اختر جهتك لتشوف الأدلة المهمة لك، أو تواصل مع شخص مباشرة.")}</p>
        </header>

        <div className="help2__paths">
          {paths.map((p) => (
            <section key={p.id} className={`help2__path is-${p.id}`} aria-labelledby={`help-${p.id}`}>
              <h2 id={`help-${p.id}`}>{p.title}</h2>
              <p>{p.lead}</p>
              <ul>
                {p.links.map((l) => (
                  <li key={l.href}>
                    <Link href={h(l.href)}><l.icon size={17} aria-hidden /> <span>{l.label}</span> <ArrowRight size={15} aria-hidden className="help2__arr" /></Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="help2__common" aria-labelledby="help-common">
          <h2 id="help-common">{L("Asked most often", "الأكثر سؤالاً")}</h2>
          <dl>
            {common.map((c) => (
              <div key={c.q}>
                <dt>{c.q}</dt>
                <dd>{c.a} <Link href={h(c.href)}>{L("More", "المزيد")}</Link></dd>
              </div>
            ))}
          </dl>
          <Link href={h("/faq")} className="help2__all">{L("All questions", "كل الأسئلة")} <ArrowRight size={15} aria-hidden /></Link>
        </section>

        <section className="help2__people" aria-labelledby="help-people">
          <h2 id="help-people">{L("Talk to a person", "تكلم مع شخص")}</h2>
          <div className="help2__ways">
            <Link href={h("/buyer/tickets")}><LifeBuoy size={20} aria-hidden /><b>{L("Message support", "راسل الدعم")}</b><span>{L("From your account. Replies show there and by email.", "من حسابك. الردود تظهر هناك وبالإيميل.")}</span></Link>
            <a href="mailto:support@hukum.sa"><Mail size={20} aria-hidden /><b>support@hukum.sa</b><span>{L("If you can't sign in.", "إذا ما تقدر تدخل.")}</span></a>
            <Link href={h("/report")}><ShieldAlert size={20} aria-hidden /><b>{L("Report a concern", "الإبلاغ عن مشكلة")}</b><span>{L("A supplier, listing or message that worries you.", "مورد أو منتج أو رسالة تقلقك.")}</span></Link>
            <Link href={h("/marketplace-rules")}><Scale size={20} aria-hidden /><b>{L("Marketplace rules", "قواعد السوق")}</b><span>{L("What's expected from buyers and suppliers.", "المتوقع من المشترين والموردين.")}</span></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
