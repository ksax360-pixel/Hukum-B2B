export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import {
  Brain,
  Database,
  FileSearch,
  Globe2,
  LineChart,
  MessageSquare,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/about",
    isAr ? "عن Hukum" : "About Hukum",
    isAr
      ? "Hukum سوق B2B رقمي يربط المشترين والموردين والمصانع."
      : "Hukum is a digital B2B marketplace connecting buyers, suppliers and manufacturers."
  );
}
import { Category } from "@/modules/categories/taxonomy.model";
import { CATEGORY_SEGMENTS } from "@/data/marketplace-categories";
import { SITE_CONTACT } from "@/data/site-contact";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const n = (en: string, ar: string) => (isAr ? ar : en);

  let productCount = 0;
  let vendorCount = 0;
  let categoryCount = 0;
  try {
    await connectDB();
    const [p, v, c] = await Promise.all([
      Product.countDocuments({ status: "published" }),
      Vendor.countDocuments({ verificationStatus: { $in: ["verified", "pending"] } }),
      Category.countDocuments({ status: "active", level: 1 }),
    ]);
    productCount = p;
    vendorCount = v;
    categoryCount = c;
  } catch {
    /* offline */
  }

  const showStats = productCount > 0 || vendorCount > 0 || categoryCount > 0;

  const missionPillars = [
    { title: n("Simplify discovery", "تبسيط الاكتشاف"), body: n("Help businesses find products and suppliers faster.", "مساعدة الشركات على إيجاد المنتجات والموردين بسرعة أكبر.") },
    { title: n("Improve visibility", "تحسين الظهور"), body: n("Give suppliers structured profiles buyers can trust.", "منح الموردين ملفات منظمة يثق بها المشترون.") },
    { title: n("Structure information", "هيكلة المعلومات"), body: n("Make product specs, certifications and details easier to access.", "جعل مواصفات المنتجات والشهادات والتفاصيل أسهل للوصول.") },
    { title: n("Connect parties", "ربط الأطراف"), body: n("Enable direct conversations between buyers and suppliers.", "تمكين التواصل المباشر بين المشترين والموردين.") },
    { title: n("Digitize B2B", "رقمنة الأعمال"), body: n("Move inquiries, RFQs and engagement into one ecosystem.", "نقل الاستفسارات وطلبات العروض والتفاعل إلى منظومة واحدة.") },
    { title: n("Open markets", "فتح الأسواق"), body: n("Help businesses reach new commercial opportunities.", "مساعدة الشركات على الوصول إلى فرص تجارية جديدة.") },
  ];

  const techPillars = [
    { icon: Brain, title: n("AI-powered discovery", "اكتشاف مدعوم بالذكاء الاصطناعي"), body: n("AI-assisted structuring of product and vendor data.", "هيكلة بيانات المنتجات والموردين بمساعدة الذكاء الاصطناعي.") },
    { icon: Database, title: n("Intelligent data", "بيانات ذكية"), body: n("Marketplace information organized into searchable structure.", "معلومات السوق منظمة بشكل قابل للبحث.") },
    { icon: FileSearch, title: n("Digital vendor onboarding", "انضمام رقمي للموردين"), body: n("Vendor information processed from documents, PDFs and images.", "معالجة معلومات المورد من المستندات وملفات PDF والصور.") },
    { icon: MessageSquare, title: n("Smart RFQ", "طلب عرض سعر ذكي"), body: n("Requirements and sourcing requests communicated digitally.", "إيصال المتطلبات وطلبات التوريد رقمياً.") },
    { icon: LineChart, title: n("Analytics", "التحليلات"), body: n("Understand engagement and marketplace activity.", "فهم التفاعل ونشاط السوق.") },
    { icon: Globe2, title: n("Global connectivity", "ربط عالمي"), body: n("Designed to connect businesses across markets.", "مصمّم لربط الشركات عبر الأسواق.") },
  ];

  const trustItems = [
    n("Vendor verification workflows", "مسارات التحقق من الموردين"),
    n("Structured vendor profiles", "ملفات موردين منظمة"),
    n("Product information & documentation", "معلومات ومستندات المنتجات"),
    n("Certifications where provided", "الشهادات عند توفرها"),
    n("Business contact transparency", "شفافية بيانات التواصل"),
    n("Activity and engagement tracking", "تتبع النشاط والتفاعل"),
    n("Secure platform architecture", "بنية منصة آمنة"),
  ];

  const valueItems = [
    { title: n("One connected ecosystem", "منظومة متصلة واحدة"), body: n("Products, suppliers and business information in one place.", "منتجات وموردون ومعلومات أعمال في مكان واحد.") },
    { title: n("Structured information", "معلومات منظمة"), body: n("Easier access to meaningful product and vendor data.", "وصول أسهل لبيانات المنتجات والموردين ذات المعنى.") },
    { title: n("Faster discovery", "اكتشاف أسرع"), body: n("Reduce the time required to find relevant suppliers.", "تقليل الوقت اللازم لإيجاد الموردين المناسبين.") },
    { title: n("Direct connections", "تواصل مباشر"), body: n("Create direct communication between buyers and vendors.", "تواصل مباشر بين المشترين والموردين.") },
    { title: n("Intelligent infrastructure", "بنية ذكية"), body: n("AI-assisted workflows help organize marketplace data.", "مسارات بمساعدة الذكاء الاصطناعي لتنظيم بيانات السوق.") },
    { title: n("Built for scale", "مصمّم للتوسع"), body: n("Supports businesses from SMEs to larger enterprises.", "يدعم الشركات من المنشآت الصغيرة إلى المؤسسات الكبرى.") },
  ];

  const steps = [
    { n: "01", title: n("Discover", "اكتشف"), body: n("Find products, suppliers and businesses.", "اعثر على المنتجات والموردين والأعمال.") },
    { n: "02", title: n("Explore", "استكشف"), body: n("Review specs, certifications and vendor profiles.", "راجع المواصفات والشهادات وملفات الموردين.") },
    { n: "03", title: n("Connect", "تواصل"), body: n("Contact suppliers through available channels.", "تواصل مع الموردين عبر القنوات المتاحة.") },
    { n: "04", title: n("Inquire", "استفسر"), body: n("Submit requirements, RFQs or business inquiries.", "أرسل المتطلبات أو طلبات العروض أو الاستفسارات.") },
    { n: "05", title: n("Grow", "انمُ"), body: n("Build long-term commercial relationships.", "ابنِ علاقات تجارية طويلة الأمد.") },
  ];

  const journey = [
    { title: n("Foundation", "التأسيس"), body: n("Hukum concept established as a digital B2B trade ecosystem.", "تأسست فكرة Hukum كمنظومة تجارة رقمية بين الشركات.") },
    { title: n("Platform development", "تطوير المنصة"), body: n("Marketplace infrastructure for products, vendors, categories and discovery.", "بنية السوق للمنتجات والموردين والتصنيفات والاكتشاف.") },
    { title: n("AI integration", "دمج الذكاء الاصطناعي"), body: n("AI-assisted data processing and discovery introduced.", "إدخال معالجة البيانات والاكتشاف بمساعدة الذكاء الاصطناعي.") },
    { title: n("Vendor ecosystem", "منظومة الموردين"), body: n("Supplier onboarding, profiles and marketplace expansion.", "انضمام الموردين والملفات وتوسيع السوق.") },
    { title: n("Regional growth", "النمو الإقليمي"), body: n("Expanding connectivity across Saudi Arabia, the GCC and international markets.", "توسيع الربط عبر السعودية والخليج والأسواق الدولية.") },
  ];

  const ecosystem = [
    n("Buyers", "المشترون"),
    n("Suppliers", "الموردون"),
    n("Manufacturers", "المصانع"),
    n("Distributors", "الموزّعون"),
    n("Service providers", "مزوّدو الخدمات"),
    n("Procurement teams", "فرق المشتريات"),
  ];

  return (
    <div className="kt-about">
      {/* 01 Hero */}
      <section className="kt-about-hero">
        <div className="kt-about-hero__visual" aria-hidden>
          <div className="kt-about-hero__orbit kt-about-hero__orbit--a" />
          <div className="kt-about-hero__orbit kt-about-hero__orbit--b" />
          <div className="kt-about-hero__node kt-about-hero__node--1" />
          <div className="kt-about-hero__node kt-about-hero__node--2" />
          <div className="kt-about-hero__node kt-about-hero__node--3" />
          <div className="kt-about-hero__node kt-about-hero__node--4" />
          <div className="kt-about-hero__node kt-about-hero__node--core" />
          <svg className="kt-about-hero__lines" viewBox="0 0 800 480" fill="none">
            <path d="M120 320 C220 220, 280 200, 400 240" />
            <path d="M400 240 C520 280, 580 200, 700 160" />
            <path d="M160 140 C260 180, 320 220, 400 240" />
            <path d="M400 240 C480 300, 560 340, 680 360" />
          </svg>
        </div>
        <div className="container-custom kt-about-hero__content">
          <p className="kt-about-eyebrow">{n("About Hukum", "عن Hukum")}</p>
          <h1 className="kt-about-hero__title">
            {n("Connecting Businesses.", "نربط الأعمال.")}
            <br />
            {n("Simplifying Trade.", "نبسّط التجارة.")}
          </h1>
          <p className="kt-about-hero__lead">
            {n(
              "Hukum brings buyers, suppliers and businesses together through a smarter digital trade ecosystem built for modern commerce.",
              "تجمع Hukum المشترين والموردين والأعمال عبر منظومة تجارة رقمية أذكى مصمّمة للتجارة الحديثة."
            )}
          </p>
        </div>
      </section>

      {/* 02 Who we are */}
      <section className="kt-about-section">
        <div className="container-custom kt-about-editorial">
          <div>
            <p className="kt-about-eyebrow">{n("Who we are", "من نحن")}</p>
            <h2 className="kt-about-display">
              {n(
                "A technology-driven B2B marketplace and trade ecosystem.",
                "سوق B2B ومنظومة تجارة مدفوعة بالتقنية."
              )}
            </h2>
          </div>
          <div className="kt-about-editorial__copy">
            <p>
              {n(
                "Hukum brings together buyers, suppliers, manufacturers, distributors, service providers, procurement teams and businesses in one digital environment.",
                "تجمع Hukum المشترين والموردين والمصانع والموزّعين ومزوّدي الخدمات وفرق المشتريات والأعمال في بيئة رقمية واحدة."
              )}
            </p>
            <p>
              {n(
                "The platform helps businesses discover products and suppliers, evaluate information, initiate conversations, and develop commercial relationships — with clarity and structure.",
                "تساعد المنصة الشركات على اكتشاف المنتجات والموردين، وتقييم المعلومات، وبدء الحوارات، وبناء العلاقات التجارية — بوضوح وهيكلة."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 03 Why */}
      <section className="kt-about-section kt-about-section--soft">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("Our purpose", "هدفنا")}</p>
            <h2 className="kt-about-h2">{n("Why Hukum", "لماذا Hukum")}</h2>
            <p className="kt-about-sub">
              {n(
                "Traditional B2B discovery is often fragmented, manual and slow. Hukum centralizes discovery into a structured digital ecosystem.",
                "اكتشاف B2B التقليدي غالباً مجزّأ ويدوي وبطيء. Hukum يمركز الاكتشاف في منظومة رقمية منظمة."
              )}
            </p>
          </header>
          <div className="kt-about-compare">
            <div className="kt-about-compare__col">
              <h3>{n("Traditional trade", "التجارة التقليدية")}</h3>
              <ul>
                <li>{n("Fragmented", "مجزّأة")}</li>
                <li>{n("Manual", "يدوية")}</li>
                <li>{n("Slow", "بطيئة")}</li>
                <li>{n("Disconnected", "غير مترابطة")}</li>
              </ul>
            </div>
            <div className="kt-about-compare__vs" aria-hidden>
              {n("vs", "مقابل")}
            </div>
            <div className="kt-about-compare__col kt-about-compare__col--accent">
              <h3>Hukum</h3>
              <ul>
                <li>{n("Connected", "مترابطة")}</li>
                <li>{n("Digital", "رقمية")}</li>
                <li>{n("Discoverable", "قابلة للاكتشاف")}</li>
                <li>{n("Structured", "منظمة")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 04 Vision */}
      <section className="kt-about-vision home-band--black">
        <div className="container-custom">
          <p className="kt-about-eyebrow kt-about-eyebrow--gold">{n("Our vision", "رؤيتنا")}</p>
          <h2 className="kt-about-vision__title">
            {n(
              "To build a connected digital trade ecosystem where businesses can discover, connect and grow without borders.",
              "بناء منظومة تجارة رقمية مترابطة تمكّن الشركات من الاكتشاف والتواصل والنمو بلا حدود."
            )}
          </h2>
        </div>
      </section>

      {/* 05 Mission */}
      <section className="kt-about-section">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("Our mission", "رسالتنا")}</p>
            <h2 className="kt-about-h2">{n("What we aim to do", "ما نسعى إليه")}</h2>
          </header>
          <div className="kt-about-pillars">
            {missionPillars.map((p) => (
              <article key={p.title} className="kt-about-pillar">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 06 Ecosystem */}
      <section className="kt-about-section kt-about-section--soft">
        <div className="container-custom">
          <header className="kt-about-head kt-about-head--center">
            <p className="kt-about-eyebrow">{n("The ecosystem", "المنظومة")}</p>
            <h2 className="kt-about-h2">{n("How Hukum connects trade", "كيف تربط Hukum التجارة")}</h2>
          </header>
          <div className="kt-about-eco">
            <div className="kt-about-eco__hub">
              <Network size={22} strokeWidth={1.5} />
              <strong>Hukum</strong>
              <span>{n("Digital trade layer", "طبقة التجارة الرقمية")}</span>
            </div>
            <ul className="kt-about-eco__ring">
              {ecosystem.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <p className="kt-about-eco__foot">
              {n("Business growth through structured discovery and connection.", "نمو الأعمال عبر اكتشاف وربط منظم.")}
            </p>
          </div>
        </div>
      </section>

      {/* 07 How it works */}
      <section className="kt-about-section">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("How it works", "كيف تعمل")}</p>
            <h2 className="kt-about-h2">{n("From discovery to growth", "من الاكتشاف إلى النمو")}</h2>
          </header>
          <ol className="kt-about-steps">
            {steps.map((s) => (
              <li key={s.n}>
                <span>{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 08 Built for modern trade */}
      <section className="kt-about-section kt-about-section--soft">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("Capabilities", "القدرات")}</p>
            <h2 className="kt-about-h2">{n("Built for modern trade", "مصمّم للتجارة الحديثة")}</h2>
          </header>
          <div className="kt-about-techgrid">
            {techPillars.map(({ icon: Icon, title, body }) => (
              <article key={title} className="kt-about-tech">
                <Icon size={20} strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 09 Trust */}
      <section className="kt-about-section">
        <div className="container-custom kt-about-trust">
          <div>
            <p className="kt-about-eyebrow">{n("Trust & transparency", "الثقة والشفافية")}</p>
            <h2 className="kt-about-h2">{n("Built around trust", "مبني حول الثقة")}</h2>
            <p className="kt-about-sub">
              {n(
                "Confidence comes from clearer information, verification workflows and transparent commercial contact — not unsupported claims.",
                "تأتي الثقة من معلومات أوضح، ومسارات تحقق، وتواصل تجاري شفاف — لا من ادعاءات غير مدعومة."
              )}
            </p>
          </div>
          <ul className="kt-about-trust__list">
            {trustItems.map((item) => (
              <li key={item}>
                <ShieldCheck size={16} strokeWidth={1.75} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10 Technology */}
      <section className="kt-about-section kt-about-section--ink">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow kt-about-eyebrow--gold">{n("Our technology", "تقنيتنا")}</p>
            <h2 className="kt-about-h2 kt-about-h2--light">
              {n("SaaS infrastructure for digital commerce", "بنية SaaS للتجارة الرقمية")}
            </h2>
            <p className="kt-about-sub kt-about-sub--light">
              {n(
                "Hukum combines SaaS architecture, AI, search, vendor management, analytics, communication tools and automated workflows — designed for buyers and suppliers, not developers.",
                "تجمع Hukum بين بنية SaaS والذكاء الاصطناعي والبحث وإدارة الموردين والتحليلات وأدوات التواصل والمسارات الآلية — مصمّمة للمشترين والموردين لا للمطوّرين."
              )}
            </p>
          </header>
          <div className="kt-about-techwords">
            {[
              n("SaaS", "SaaS"),
              n("AI", "الذكاء الاصطناعي"),
              n("Search", "البحث"),
              n("Analytics", "التحليلات"),
              n("Vendor management", "إدارة الموردين"),
              n("Automation", "الأتمتة"),
            ].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 11 Reach */}
      <section className="kt-about-section">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("Our reach", "انتشارنا")}</p>
            <h2 className="kt-about-h2">{n("Connecting markets", "ربط الأسواق")}</h2>
          </header>
          <div className="kt-about-markets">
            {SITE_CONTACT.markets.map((m) => (
              <article key={m.id} className="kt-about-market">
                <Globe2 size={18} strokeWidth={1.5} />
                <h3>{n(m.name.en, m.name.ar)}</h3>
                <p>{n(m.status.en, m.status.ar)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 12 Industries */}
      <section className="kt-about-section kt-about-section--soft">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("Industries", "القطاعات")}</p>
            <h2 className="kt-about-h2">{n("Built across sectors", "عبر القطاعات")}</h2>
          </header>
          <div className="kt-about-industries">
            {CATEGORY_SEGMENTS.filter((s) => s.id !== "other").map((s) => (
              <Link key={s.id} href={`/${locale}/categories#segment-${s.id}`} className="kt-about-industry">
                <strong>{n(s.name.en, s.name.ar)}</strong>
                <span>{n(s.description.en, s.description.ar)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 13 Journey */}
      <section className="kt-about-section">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("Our journey", "رحلتنا")}</p>
            <h2 className="kt-about-h2">{n("Building in stages", "نبني على مراحل")}</h2>
          </header>
          <ol className="kt-about-timeline">
            {journey.map((j, i) => (
              <li key={j.title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{j.title}</h3>
                  <p>{j.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 15 Platform numbers — verified only */}
      {showStats ? (
        <section className="kt-about-section kt-about-section--soft">
          <div className="container-custom">
            <header className="kt-about-head kt-about-head--center">
              <p className="kt-about-eyebrow">{n("Platform today", "المنصة اليوم")}</p>
              <h2 className="kt-about-h2">{n("Marketplace in numbers", "السوق بالأرقام")}</h2>
            </header>
            <div className="kt-about-stats">
              {vendorCount > 0 ? (
                <div>
                  <strong>{vendorCount.toLocaleString(locale)}</strong>
                  <span>{n("Suppliers on platform", "موردون على المنصة")}</span>
                </div>
              ) : null}
              {productCount > 0 ? (
                <div>
                  <strong>{productCount.toLocaleString(locale)}</strong>
                  <span>{n("Published products", "منتجات منشورة")}</span>
                </div>
              ) : null}
              {categoryCount > 0 ? (
                <div>
                  <strong>{categoryCount.toLocaleString(locale)}</strong>
                  <span>{n("Active categories", "تصنيفات نشطة")}</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* 16 People — company-focused (no invented team) */}
      <section className="kt-about-section">
        <div className="container-custom kt-about-people">
          <Sparkles size={22} strokeWidth={1.5} />
          <h2 className="kt-about-h2">
            {n("Built by people who understand business", "بناها أشخاص يفهمون الأعمال")}
          </h2>
          <p>
            {n(
              "Hukum is built by a team focused on trade, procurement and digital infrastructure — combining marketplace product thinking with practical commercial workflows.",
              "تُبنى Hukum بواسطة فريق يركّز على التجارة والمشتريات والبنية الرقمية — يجمع تفكير منتجات السوق مع مسارات تجارية عملية."
            )}
          </p>
        </div>
      </section>

      {/* 17 Why businesses choose */}
      <section className="kt-about-section kt-about-section--soft">
        <div className="container-custom">
          <header className="kt-about-head">
            <p className="kt-about-eyebrow">{n("Practical value", "قيمة عملية")}</p>
            <h2 className="kt-about-h2">{n("Why businesses use Hukum", "لماذا تستخدم الشركات Hukum")}</h2>
          </header>
          <div className="kt-about-valuegrid">
            {valueItems.map((v) => (
              <article key={v.title}>
                <Search size={16} strokeWidth={1.75} className="opacity-40" />
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 18 CTA */}
      <section className="kt-about-cta home-band--black">
        <div className="container-custom">
          <div className="home-trust">
            <p className="home-trust__eyebrow">{n("Next step", "الخطوة التالية")}</p>
            <h2 className="home-trust__title">
              {n("Let’s build the future of trade together.", "لنبنِ مستقبل التجارة معاً.")}
            </h2>
            <span className="home-trust__rule" aria-hidden />
            <p className="kt-about-cta__copy">
              {n(
                "Whether you are looking to source, supply, partner or expand into new markets, Hukum is built to help you connect.",
                "سواء كنت تبحث عن التوريد أو العرض أو الشراكة أو التوسع في أسواق جديدة، Hukum مبنية لمساعدتك على التواصل."
              )}
            </p>
            <div className="home-trust__actions">
              <Link href={`/${locale}/products`} className="home-trust__primary">
                {n("Explore products", "استكشف المنتجات")}
              </Link>
              <Link href={`/${locale}/register`} className="home-trust__secondary">
                {n("Join Hukum", "انضم إلى Hukum")}
              </Link>
              <Link href={`/${locale}/contact`} className="home-trust__secondary">
                {n("Contact us", "تواصل معنا")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
