"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  X,
} from "lucide-react";
import { track } from "@/lib/track-client";
import { ContactRevealGate, type RevealedContact } from "./ContactRevealGate";
import { telLink, whatsappLink } from "./product-helpers";

type Props = {
  productId: string;
  productName: string;
  productSku?: string;
  vendorId?: string;
  vendorName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  locale: "en" | "ar";
  rfqEnabled?: boolean;
  inquiryEnabled?: boolean;
  whatsapp?: string;
  /** Vendor microsite: heading + WhatsApp at bottom-right. */
  floatLayout?: "default" | "vendor";
};

type Panel =
  | "menu"
  | "phone"
  | "email"
  | "location"
  | "inquiry"
  | "inquiry_success";

export function ProductContact({
  productId,
  productName,
  productSku,
  vendorId,
  vendorName,
  phone,
  email,
  address,
  city,
  country,
  locale,
  rfqEnabled = true,
  inquiryEnabled = true,
  whatsapp,
  floatLayout = "default",
}: Props) {
  const isAr = locale === "ar";
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("menu");
  const [copied, setCopied] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquiryRef, setInquiryRef] = useState<string | null>(null);
  const [inqName, setInqName] = useState("");
  const [inqCompany, setInqCompany] = useState("");
  const [inqEmail, setInqEmail] = useState("");
  const [inqPhone, setInqPhone] = useState("");
  const [inqQty, setInqQty] = useState("");
  const [inqCity, setInqCity] = useState("");
  const [inqMessage, setInqMessage] = useState("");
  const [revealed, setRevealed] = useState<RevealedContact | null>(null);

  const livePhone = revealed?.phone || phone || "";
  const liveEmail = revealed?.email || email || "";
  const liveWaRaw = revealed?.whatsapp || whatsapp || phone || "";
  // When props omit contacts (stripped SSR), still offer reveal if product/vendor known.
  const offerReveal = !livePhone && !liveEmail && !liveWaRaw && Boolean(productId || vendorId);

  const wa = whatsappLink(liveWaRaw);
  const tel = telLink(livePhone);
  const place = [address, city, country].filter(Boolean).join(", ");
  const mapsQuery = encodeURIComponent(place || [city, country].filter(Boolean).join(", "));
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}` : "";
  const hasAny =
    Boolean(wa || livePhone || liveEmail || place || rfqEnabled || inquiryEnabled || offerReveal);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function record(type: string, meta?: Record<string, unknown>) {
    await track({
      type,
      productId,
      vendorId,
      meta: {
        productName,
        vendorName,
        productSku,
        source: "product_detail",
        ...meta,
      },
    });
  }

  function openModal() {
    setPanel("menu");
    setOpen(true);
    void record("vendor_contact_open");
  }

  function closeModal() {
    setOpen(false);
    setPanel("menu");
    setInquiryError(null);
  }

  async function openWhatsApp() {
    if (!wa) return;
    await record("vendor_contact_whatsapp");
    const msg =
      floatLayout === "vendor"
        ? isAr
          ? `مرحباً، وجدت صفحة «${vendorName || productName}» على Hukum وأرغب بالتواصل.`
          : `Hello, I found "${vendorName || productName}" on Hukum and would like to get in touch.`
        : isAr
          ? `مرحباً، وجدت منتجكم «${productName}» على Hukum وأرغب بمزيد من المعلومات.`
          : `Hello, I found your product "${productName}" on Hukum and would like more information.`;
    const url = `${wa}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    closeModal();
  }

  async function goPhone() {
    if (!livePhone) return;
    await record("vendor_contact_phone");
    setPanel("phone");
  }

  async function goEmail() {
    if (!liveEmail) return;
    await record("vendor_contact_email");
    setPanel("email");
  }

  async function goLocation() {
    if (!place) return;
    await record("vendor_contact_location");
    setPanel("location");
  }

  async function goDirections() {
    if (!mapsUrl) return;
    await record("vendor_direction_click");
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }

  async function goRfq() {
    await record("vendor_request_quote");
    window.location.href = `/${locale}/rfq?product=${productId}`;
  }

  async function goInquiry() {
    await record("vendor_send_inquiry");
    setPanel("inquiry");
  }

  async function copyPhone() {
    if (!livePhone) return;
    try {
      await navigator.clipboard.writeText(livePhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function openMailto() {
    if (!liveEmail) return;
    const subject = isAr
      ? `Hukum — استفسار عن ${productName}`
      : `Hukum — Enquiry About ${productName}`;
    const body = isAr
      ? `مرحباً،\n\nأنا مهتم بالمنتج التالي على Hukum:\n\nالمنتج: ${productName}\nرمز المنتج: ${productSku || "—"}\nالمورد: ${vendorName || "—"}\n\nيرجى تزويدي بمعلومات حول السعر والتوفر والحد الأدنى والتسليم.\n\nشكراً لكم.`
      : `Hello,\n\nI am interested in the following product listed on Hukum:\n\nProduct: ${productName}\nProduct ID: ${productSku || "—"}\nVendor: ${vendorName || "—"}\n\nPlease provide further information regarding pricing, availability, MOQ and delivery.\n\nThank you.`;
    window.location.href = `mailto:${liveEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError(null);
    if (!String(inqPhone || "").trim()) {
      setInquiryError(isAr ? "رقم الهاتف مطلوب" : "Phone number is required");
      setInquiryLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: inqName,
          companyName: inqCompany,
          email: inqEmail,
          phone: inqPhone.trim(),
          country: "SA",
          subject: `Product inquiry — ${productName}`,
          message: [
            inqMessage,
            "",
            `Product: ${productName}`,
            `Product ID: ${productSku || productId}`,
            `Vendor: ${vendorName || "—"}`,
            inqQty ? `Quantity: ${inqQty}` : "",
            inqCity ? `Delivery location: ${inqCity}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          enquiryType: "buyer",
          locale,
          source: "product_detail",
          extras: {
            productId,
            productName,
            productSku: productSku || "",
            vendorId: vendorId || "",
            vendorName: vendorName || "",
            quantity: inqQty,
            deliveryLocation: inqCity,
            requestType: "product_order_request",
          },
        }),
      });
      const json = (await res.json()) as { success?: boolean; data?: { reference?: string }; message?: string; error?: string };
      if (!json.success || !json.data?.reference) {
        setInquiryError(json.message || json.error || (isAr ? "فشل الإرسال" : "Submit failed"));
        return;
      }
      setInquiryRef(json.data.reference);
      setPanel("inquiry_success");
    } catch {
      setInquiryError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setInquiryLoading(false);
    }
  }

  if (!hasAny) return null;

  const options = [
    wa
      ? {
          key: "whatsapp",
          icon: MessageCircle,
          title: "WhatsApp",
          desc: isAr ? "تواصل مباشرة عبر واتساب" : "Connect directly through WhatsApp",
          onClick: () => void openWhatsApp(),
        }
      : null,
    livePhone
      ? {
          key: "phone",
          icon: Phone,
          title: isAr ? "الهاتف" : "Phone",
          desc: isAr ? "عرض أو الاتصال برقم المورد" : "View or call the vendor’s number",
          onClick: () => void goPhone(),
        }
      : null,
    liveEmail
      ? {
          key: "email",
          icon: Mail,
          title: isAr ? "البريد" : "Email",
          desc: isAr ? "أرسل بريداً إلى المورد" : "Send an email to the vendor",
          onClick: () => void goEmail(),
        }
      : null,
    place
      ? {
          key: "location",
          icon: MapPin,
          title: isAr ? "الموقع" : "Location",
          desc: isAr ? "عرض موقع عمل المورد" : "View the vendor’s business location",
          onClick: () => void goLocation(),
        }
      : null,
    mapsUrl
      ? {
          key: "directions",
          icon: Navigation,
          title: isAr ? "الاتجاهات" : "Directions",
          desc: isAr ? "احصل على الاتجاهات على الخريطة" : "Get directions on the map",
          onClick: () => void goDirections(),
        }
      : null,
    rfqEnabled
      ? {
          key: "rfq",
          icon: FileText,
          title: isAr ? "طلب عرض سعر" : "Request quote",
          desc: isAr ? "أرسل طلب تسعير منظماً" : "Send a structured quotation request",
          onClick: () => void goRfq(),
        }
      : null,
    inquiryEnabled
      ? {
          key: "inquiry",
          icon: Mail,
          title: isAr ? "إرسال استفسار" : "Send inquiry",
          desc: isAr ? "أرسل رسالة مباشرة للمورد" : "Send a message directly to the vendor",
          onClick: () => void goInquiry(),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof Phone;
    title: string;
    desc: string;
    onClick: () => void;
  }>;

  return (
    <>
      <div className="kt-cvendor">
        <button type="button" className="kt-cvendor__cta" onClick={openModal}>
          {isAr ? "تواصل مع المورد" : "Contact Vendor"}
        </button>
      </div>

      {floatLayout !== "vendor" && !open ? (
        <div className="kt-cvendor-sticky">
          <button type="button" className="kt-cvendor__cta kt-cvendor__cta--sticky" onClick={openModal}>
            {isAr ? "تواصل مع المورد" : "Contact Vendor"}
          </button>
        </div>
      ) : null}

      {floatLayout === "vendor" ? (
        <div className={`kt-vweb-dock${open ? " is-hidden" : ""}`}>
          <button type="button" className="kt-vweb-dock__heading" onClick={openModal}>
            {isAr ? "تواصل مع المورد" : "Contact vendor"}
          </button>
          {wa ? (
            <button type="button" className="kt-vweb-dock__wa" aria-label="WhatsApp" onClick={() => void openWhatsApp()}>
              <MessageCircle size={22} strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
      ) : wa ? (
        <button
          type="button"
          className={`kt-wa-float${open ? " is-hidden" : ""}`}
          aria-label="WhatsApp"
          onClick={() => void openWhatsApp()}
        >
          <MessageCircle size={22} strokeWidth={1.75} />
        </button>
      ) : null}

      {open ? (
        <div className="kt-cvendor-modal" role="presentation">
          <button type="button" className="kt-cvendor-modal__backdrop" aria-label="Close" onClick={closeModal} />
          <div
            className="kt-cvendor-modal__sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="kt-cvendor-modal__head">
              <div>
                <h2 id={titleId}>{isAr ? "تواصل مع المورد" : "Contact Vendor"}</h2>
                {panel === "menu" ? (
                  <p>{isAr ? "كيف تود التواصل مع هذا المورد؟" : "How would you like to connect with this vendor?"}</p>
                ) : null}
              </div>
              <button type="button" className="kt-cvendor-modal__close" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="kt-cvendor-modal__ref">
              <strong>{productName}</strong>
              <span>
                {[vendorName, productSku ? `${isAr ? "رمز" : "ID"}: ${productSku}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>

            {panel === "menu" ? (
              <div className="kt-cvendor-options">
                {offerReveal ? (
                  <div className="mb-3">
                    <ContactRevealGate
                      locale={locale}
                      productId={productId}
                      vendorId={vendorId}
                      hasContact
                      onRevealed={(c) => {
                        setRevealed(c);
                        void record("contact_revealed", { via: "product_contact_modal" });
                      }}
                    />
                  </div>
                ) : null}
                {options.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.key} type="button" className="kt-cvendor-option" onClick={opt.onClick}>
                      <span className="kt-cvendor-option__icon">
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      <span className="kt-cvendor-option__copy">
                        <strong>{opt.title}</strong>
                        <em>{opt.desc}</em>
                      </span>
                      <ArrowRight size={16} className={isAr ? "rotate-180 opacity-40" : "opacity-40"} />
                    </button>
                  );
                })}
              </div>
            ) : null}

            {panel === "phone" && livePhone ? (
              <div className="kt-cvendor-panel">
                <p className="kt-cvendor-panel__label">{isAr ? "رقم الهاتف" : "Phone number"}</p>
                <p className="kt-cvendor-panel__value">{livePhone}</p>
                <div className="kt-cvendor-panel__actions">
                  {tel ? (
                    <a href={tel} className="kt-cvendor__cta kt-cvendor__cta--sm">
                      {isAr ? "اتصال" : "Call"}
                    </a>
                  ) : null}
                  <button type="button" className="btn-secondary" onClick={() => void copyPhone()}>
                    <Copy size={14} className="inline me-1" />
                    {copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ الرقم" : "Copy number"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setPanel("menu")}>
                    {isAr ? "رجوع" : "Back"}
                  </button>
                </div>
              </div>
            ) : null}

            {panel === "email" && liveEmail ? (
              <div className="kt-cvendor-panel">
                <p className="kt-cvendor-panel__label">{isAr ? "البريد الإلكتروني" : "Email"}</p>
                <p className="kt-cvendor-panel__value">{liveEmail}</p>
                <div className="kt-cvendor-panel__actions">
                  <button type="button" className="kt-cvendor__cta kt-cvendor__cta--sm" onClick={openMailto}>
                    {isAr ? "إرسال بريد" : "Email vendor"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setPanel("menu")}>
                    {isAr ? "رجوع" : "Back"}
                  </button>
                </div>
              </div>
            ) : null}

            {panel === "location" && place ? (
              <div className="kt-cvendor-panel">
                <p className="kt-cvendor-panel__label">{isAr ? "موقع المورد" : "Vendor location"}</p>
                {vendorName ? <p className="kt-cvendor-panel__value">{vendorName}</p> : null}
                <p className="kt-cvendor-panel__muted">{place}</p>
                <div className="kt-cvendor-panel__actions">
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kt-cvendor__cta kt-cvendor__cta--sm"
                      onClick={() => void record("vendor_contact_location", { action: "view_map" })}
                    >
                      {isAr ? "عرض الموقع" : "View location"}
                    </a>
                  ) : null}
                  {mapsUrl ? (
                    <button type="button" className="btn-secondary" onClick={() => void goDirections()}>
                      {isAr ? "الاتجاهات" : "Directions"}
                    </button>
                  ) : null}
                  <button type="button" className="btn-secondary" onClick={() => setPanel("menu")}>
                    {isAr ? "رجوع" : "Back"}
                  </button>
                </div>
              </div>
            ) : null}

            {panel === "inquiry" ? (
              <form className="kt-cvendor-inq" onSubmit={(e) => void submitInquiry(e)}>
                <div className="kt-cvendor-inq__grid">
                  <label>
                    <span>{isAr ? "الاسم" : "Name"} *</span>
                    <input required value={inqName} onChange={(e) => setInqName(e.target.value)} />
                  </label>
                  <label>
                    <span>{isAr ? "الشركة" : "Company"} *</span>
                    <input required value={inqCompany} onChange={(e) => setInqCompany(e.target.value)} />
                  </label>
                  <label>
                    <span>{isAr ? "البريد" : "Email"} *</span>
                    <input type="email" required value={inqEmail} onChange={(e) => setInqEmail(e.target.value)} />
                  </label>
                  <label>
                    <span>{isAr ? "الهاتف" : "Phone"} *</span>
                    <input
                      required
                      type="tel"
                      placeholder={isAr ? "+9665…" : "+9665…"}
                      value={inqPhone}
                      onChange={(e) => setInqPhone(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>{isAr ? "الكمية" : "Quantity"}</span>
                    <input value={inqQty} onChange={(e) => setInqQty(e.target.value)} />
                  </label>
                  <label>
                    <span>{isAr ? "موقع التسليم" : "Delivery location"}</span>
                    <input value={inqCity} onChange={(e) => setInqCity(e.target.value)} />
                  </label>
                  <label className="kt-cvendor-inq__full">
                    <span>{isAr ? "الرسالة" : "Message"} *</span>
                    <textarea required rows={3} value={inqMessage} onChange={(e) => setInqMessage(e.target.value)} />
                  </label>
                </div>
                {inquiryError ? <p className="kt-cvendor-inq__error">{inquiryError}</p> : null}
                <div className="kt-cvendor-panel__actions">
                  <button type="submit" className="kt-cvendor__cta kt-cvendor__cta--sm" disabled={inquiryLoading}>
                    {inquiryLoading
                      ? isAr
                        ? "جاري الإرسال…"
                        : "Sending…"
                      : isAr
                        ? "إرسال الاستفسار"
                        : "Send inquiry"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setPanel("menu")}>
                    {isAr ? "رجوع" : "Back"}
                  </button>
                </div>
              </form>
            ) : null}

            {panel === "inquiry_success" ? (
              <div className="kt-cvendor-panel kt-cvendor-panel--success">
                <h3>{isAr ? "تم استلام الطلب" : "Request received"}</h3>
                <p>
                  {isAr
                    ? "تم إرسال استفسارك بنجاح إلى المورد."
                    : "Your enquiry has been successfully submitted to the vendor."}
                </p>
                {inquiryRef ? (
                  <p className="kt-cvendor-panel__value">
                    {isAr ? "المرجع" : "Reference"}: <strong>{inquiryRef}</strong>
                  </p>
                ) : null}
                <button type="button" className="kt-cvendor__cta kt-cvendor__cta--sm" onClick={closeModal}>
                  {isAr ? "إغلاق" : "Close"}
                </button>
              </div>
            ) : null}

            {panel === "menu" && rfqEnabled ? (
              <p className="kt-cvendor-modal__hint">
                {isAr ? "للتسعير المنظم استخدم " : "For structured pricing use "}
                <Link href={`/${locale}/rfq?product=${productId}`} onClick={() => void record("vendor_request_quote")}>
                  {isAr ? "طلب عرض السعر" : "Request Quote"}
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
