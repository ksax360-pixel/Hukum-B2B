import Link from "next/link";
import {
  ArrowUpRight,
  Handshake,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Search,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import {
  sourcingWhatsAppHref,
  sourcingWhatsAppIsExternal,
} from "@/lib/sourcing-contact";
import { WhatsAppPhoneVideo } from "@/components/home/WhatsAppPhoneVideo";

function WhatsAppIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

export function WhatsAppSourcing({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const href = sourcingWhatsAppHref(locale);
  const external = sourcingWhatsAppIsExternal();

  const icons = [
    { Icon: MessageCircle, label: isAr ? "رسالة" : "Message" },
    { Icon: Mic, label: isAr ? "ملاحظة صوتية" : "Voice note" },
    { Icon: ImageIcon, label: isAr ? "صورة" : "Photo" },
    { Icon: Search, label: isAr ? "نطابق" : "We match" },
    { Icon: Handshake, label: isAr ? "تتواصل" : "You connect" },
  ];

  const cta = (
    <>
      <WhatsAppIcon />
      <span>{isAr ? "راسل توريد حكوم" : "Message Hukum sourcing"}</span>
      <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
    </>
  );

  return (
    <section className="hukum-wa" aria-labelledby="hukum-wa-title">
      <img
        className="hukum-wa__mark"
        src="/brand/hukum-logo-green-watermark.png"
        alt=""
        aria-hidden
        draggable={false}
      />
      <div className="container-custom hukum-wa__wrap">
        <div className="hukum-wa__grid">
          <div className="hukum-wa__copy">
            <p className="hukum-wa__eyebrow">
              <span className="hukum-wa__eyebrow-rule" aria-hidden />
              <span>{isAr ? "توريد عبر واتساب" : "WhatsApp sourcing"}</span>
            </p>
            <h2 id="hukum-wa-title" className="hukum-wa__title">
              {isAr
                ? "أرسل طلبك عبر واتساب. بهذه البساطة."
                : "Send a request on WhatsApp. It’s that easy."}
            </h2>

            <ul className="hukum-wa__icons" aria-label={isAr ? "خطوات التوريد" : "Sourcing steps"}>
              {icons.map(({ Icon, label }, index) => (
                <li key={label} className="hukum-wa__icon-item">
                  {index > 0 ? <span className="hukum-wa__icon-dot" aria-hidden /> : null}
                  <span className="hukum-wa__icon" title={label} aria-label={label}>
                    <Icon size={18} strokeWidth={1.75} aria-hidden />
                  </span>
                </li>
              ))}
            </ul>

            {external ? (
              <a href={href} target="_blank" rel="noreferrer" className="hukum-wa__cta">
                {cta}
              </a>
            ) : (
              <Link href={href} className="hukum-wa__cta">
                {cta}
              </Link>
            )}
          </div>

          <div className="hukum-wa__visual">
            <div className="hukum-wa__stage">
              <WhatsAppPhoneVideo
                src="/hero/Hukum_WhatsApp_RFQ_Square.mp4"
                label={isAr ? "فيديو توريد واتساب حكوم" : "Hukum WhatsApp sourcing video"}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
