import Link from "next/link";
import { Handshake, MessageCircle, Search } from "lucide-react";
import type { Locale } from "@/i18n/config";
import {
  sourcingWhatsAppHref,
  sourcingWhatsAppIsExternal,
} from "@/lib/sourcing-contact";

function WhatsAppIcon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function PhoneMock({ isAr }: { isAr: boolean }) {
  const vendors = isAr
    ? [
        { name: "الصفوة للسلامة", badge: "موثّق", tone: "verified" as const },
        { name: "إيسترن غلف سبلاي", badge: "موثّق", tone: "verified" as const },
        { name: "نجد الصناعية", badge: "سجل تجاري", tone: "cr" as const },
      ]
    : [
        { name: "Al Safwa Safety", badge: "Verified", tone: "verified" as const },
        { name: "Eastern Gulf Supply", badge: "Verified", tone: "verified" as const },
        { name: "Najd Industrial", badge: "CR checked", tone: "cr" as const },
      ];

  return (
    <div className="hukum-wa__phone" aria-hidden>
      <div className="hukum-wa__phone-bezel">
        <div className="hukum-wa__phone-notch" />
        <div className="hukum-wa__chat">
          <div className="hukum-wa__chat-head">
            <span className="hukum-wa__avatar">ح</span>
            <div>
              <p className="hukum-wa__chat-name">
                {isAr ? "توريد حكوم" : "Hukum Sourcing"}
              </p>
              <p className="hukum-wa__chat-status">
                {isAr ? "فريق توريد حكوم" : "Hukum sourcing team"}
              </p>
            </div>
          </div>
          <div className="hukum-wa__chat-body">
            <div className="hukum-wa__bubble hukum-wa__bubble--out">
              {isAr
                ? "السلام عليكم، أحتاج 500 خوذة سلامة للرياض هذا الأسبوع."
                : "Salam, I need 500 safety helmets delivered to Riyadh this week."}
              <span className="hukum-wa__time">10:02</span>
            </div>
            <div className="hukum-wa__bubble hukum-wa__bubble--in">
              {isAr
                ? "وعليكم السلام! نرسل طلبك الآن لموردين موثّقين في الرياض."
                : "Wa alaikum assalam! Sending your request to verified suppliers in Riyadh now."}
              <span className="hukum-wa__time">10:02</span>
            </div>
            <div className="hukum-wa__vendors">
              <p className="hukum-wa__vendors-title">
                {isAr ? "3 موردين موثّقين" : "3 verified vendors found"}
              </p>
              <p className="hukum-wa__vendors-sub">
                {isAr ? "مطابقة لطلبك" : "Matched to your request"}
              </p>
              {vendors.map((v) => (
                <span key={v.name} className="hukum-wa__vendor-row">
                  <span className="hukum-wa__vendor-name">{v.name}</span>
                  <span className={`hukum-wa__vendor-badge hukum-wa__vendor-badge--${v.tone}`}>
                    {v.tone === "verified" ? (
                      <span className="hukum-wa__vendor-check" />
                    ) : null}
                    {v.badge}
                  </span>
                </span>
              ))}
              <p className="hukum-wa__vendors-hint">
                {isAr ? "رد بـ 1 أو 2 أو 3 للتواصل مباشرة." : "Reply 1, 2 or 3 to connect directly."}
              </p>
              <span className="hukum-wa__time hukum-wa__time--block">10:06</span>
            </div>
            <div className="hukum-wa__bubble hukum-wa__bubble--out">
              {isAr ? "1 من فضلك" : "1 please"}
              <span className="hukum-wa__time">10:07</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppSourcing({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const href = sourcingWhatsAppHref(locale);
  const external = sourcingWhatsAppIsExternal();

  const steps = [
    {
      Icon: MessageCircle,
      title: isAr ? "راسلنا" : "Message us",
      text: isAr ? "الصنف، الكمية، المدينة" : "Item, quantity, city",
    },
    {
      Icon: Search,
      title: isAr ? "نطابق" : "We match",
      text: isAr ? "موثّق أو سجل تجاري" : "Verified or CR-checked",
    },
    {
      Icon: Handshake,
      title: isAr ? "تتواصل" : "You connect",
      text: isAr ? "مباشرة في نفس المحادثة" : "Directly, in the same chat",
    },
  ];

  return (
    <section className="hukum-wa">
      <div className="container-custom">
        <div className="hukum-wa__panel">
          <div className="hukum-wa__copy">
            <span className="hukum-wa__tag">
              <WhatsAppIcon size={15} />
              {isAr ? "تواصل مع توريد حكوم" : "Contact Hukum sourcing"}
            </span>
            <h2 className="hukum-wa__title">
              {isAr
                ? "أرسل طلبك عبر واتساب. بهذه البساطة."
                : "Send a request on WhatsApp. It’s that easy."}
            </h2>
            <p className="hukum-wa__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
              {isAr
                ? "Send a quote request on WhatsApp"
                : "أرسل طلب عرض السعر عبر واتساب"}
            </p>
            <p className="hukum-wa__lead">
              {isAr
                ? "أخبرنا بما تحتاجه بالعربية أو الإنجليزية، برسالة أو ملاحظة صوتية أو صورة. يطابق فريق التوريد طلبك بموردين مناسبين ويرد في نفس المحادثة."
                : "Tell us what you need in Arabic or English, as a message, voice note or photo. Our sourcing team matches it with suitable suppliers and replies in the same chat."}
            </p>

            <div className="hukum-wa__steps">
              {steps.map((s) => (
                <div key={s.title} className="hukum-wa__step">
                  <span className="hukum-wa__step-icon" aria-hidden>
                    <s.Icon size={18} strokeWidth={1.75} />
                  </span>
                  <p className="hukum-wa__step-title">{s.title}</p>
                  <p className="hukum-wa__step-text">{s.text}</p>
                </div>
              ))}
            </div>

            {external ? (
              <a href={href} target="_blank" rel="noreferrer" className="hukum-wa__cta">
                <WhatsAppIcon />
                {isAr ? "راسل توريد حكوم" : "Message Hukum sourcing"}
              </a>
            ) : (
              <Link href={href} className="hukum-wa__cta">
                <WhatsAppIcon />
                {isAr ? "راسل توريد حكوم" : "Message Hukum sourcing"}
              </Link>
            )}
          </div>

          <div className="hukum-wa__visual">
            <PhoneMock isAr={isAr} />
          </div>
        </div>
      </div>
    </section>
  );
}
