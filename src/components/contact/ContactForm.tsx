"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Paperclip, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { ApiBody } from "@/lib/api";
import { track } from "@/lib/track-client";
import { KtSelect } from "@/components/ui/KtSelect";

const ENQUIRY_TYPES = [
  { value: "general", en: "General enquiry", ar: "استفسار عام" },
  { value: "buyer", en: "Buyer / procurement", ar: "مشتري / مشتريات" },
  { value: "supplier", en: "Supplier / vendor", ar: "مورد / بائع" },
  { value: "partnership", en: "Partnership", ar: "شراكة" },
  { value: "support", en: "Technical support", ar: "دعم تقني" },
  { value: "media", en: "Media", ar: "إعلام" },
  { value: "other", en: "Other", ar: "أخرى" },
] as const;

const COUNTRIES = [
  { value: "SA", en: "Saudi Arabia", ar: "السعودية" },
  { value: "AE", en: "United Arab Emirates", ar: "الإمارات" },
  { value: "BH", en: "Bahrain", ar: "البحرين" },
  { value: "KW", en: "Kuwait", ar: "الكويت" },
  { value: "QA", en: "Qatar", ar: "قطر" },
  { value: "OM", en: "Oman", ar: "عُمان" },
  { value: "EG", en: "Egypt", ar: "مصر" },
  { value: "IN", en: "India", ar: "الهند" },
  { value: "CN", en: "China", ar: "الصين" },
  { value: "US", en: "United States", ar: "الولايات المتحدة" },
  { value: "GB", en: "United Kingdom", ar: "المملكة المتحدة" },
  { value: "OTHER", en: "Other", ar: "أخرى" },
] as const;

const ALLOWED_EXT = /\.(pdf|doc|docx|xls|xlsx|png|jpe?g|webp)$/i;
const MAX_BYTES = 8 * 1024 * 1024;

export function ContactForm({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const started = useRef(false);
  const [enquiryType, setEnquiryType] = useState("general");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("SA");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  // Dynamic extras
  const [companyType, setCompanyType] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [website, setWebsite] = useState("");
  const [countriesServed, setCountriesServed] = useState("");
  const [quantity, setQuantity] = useState("");
  const [timeline, setTimeline] = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [market, setMarket] = useState("");

  useEffect(() => {
    void track({ type: "contact_page_view", meta: { locale } });
    return () => {
      if (!reference && started.current) {
        void track({ type: "contact_form_abandoned", meta: { enquiryType, locale } });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    void track({ type: "contact_form_started", meta: { locale } });
  }

  function onFile(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }
    if (!ALLOWED_EXT.test(f.name)) {
      setError(isAr ? "نوع الملف غير مدعوم." : "Unsupported file type.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(isAr ? "الحد الأقصى للحجم 8 ميجابايت." : "Maximum file size is 8MB.");
      return;
    }
    setError(null);
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      void track({ type: "contact_form_completed", meta: { enquiryType, locale } });

      const extras: Record<string, string> = {};
      if (enquiryType === "supplier") {
        if (companyType) extras.companyType = companyType;
        if (productCategory) extras.productCategory = productCategory;
        if (website) extras.website = website;
        if (countriesServed) extras.countriesServed = countriesServed;
      }
      if (enquiryType === "buyer") {
        if (productCategory) extras.productCategory = productCategory;
        if (quantity) extras.quantity = quantity;
        if (market) extras.requiredMarket = market;
        if (timeline) extras.timeline = timeline;
      }
      if (enquiryType === "partnership") {
        if (partnershipType) extras.partnershipType = partnershipType;
        if (market) extras.market = market;
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          companyName,
          email,
          phone,
          country,
          subject,
          message,
          enquiryType,
          locale,
          extras,
          attachmentMeta: file
            ? { name: file.name, size: file.size, type: file.type }
            : undefined,
        }),
      });
      const json = (await res.json()) as ApiBody<{ reference?: string }>;
      if (!json.success || !json.data?.reference) {
        setError(json.message || json.error || (isAr ? "فشل الإرسال" : "Submit failed"));
        return;
      }
      setReference(json.data.reference);
      started.current = false;
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setLoading(false);
    }
  }

  if (reference) {
    return (
      <div className="kt-contact-success">
        <CheckCircle2 size={28} strokeWidth={1.5} />
        <h2>{isAr ? "شكراً لك. تم استلام استفسارك." : "Thank you. Your enquiry has been received."}</h2>
        <p className="kt-contact-success__ref">
          {isAr ? "المرجع" : "Reference"}: <strong>{reference}</strong>
        </p>
        <p>
          {isAr
            ? "سيراجع فريقنا طلبك ويتواصل معك في أقرب وقت."
            : "Our team will review your request and get back to you shortly."}
        </p>
      </div>
    );
  }

  const typeOpts = ENQUIRY_TYPES.map((t) => ({
    value: t.value,
    label: isAr ? t.ar : t.en,
  }));
  const countryOpts = COUNTRIES.map((c) => ({
    value: c.value,
    label: isAr ? c.ar : c.en,
  }));

  return (
    <form className="kt-contact-form" onSubmit={onSubmit} onFocus={markStarted}>
      <div className="kt-contact-form__grid">
        <div className="kt-contact-field">
          <label htmlFor="c-name">
            {isAr ? "الاسم الكامل" : "Full name"} <em>*</em>
          </label>
          <input
            id="c-name"
            className="kt-contact-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="kt-contact-field">
          <label htmlFor="c-company">
            {isAr ? "اسم الشركة" : "Company name"} <em>*</em>
          </label>
          <input
            id="c-company"
            className="kt-contact-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div className="kt-contact-field">
          <label htmlFor="c-email">
            {isAr ? "البريد التجاري" : "Business email"} <em>*</em>
          </label>
          <input
            id="c-email"
            type="email"
            className="kt-contact-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="kt-contact-field">
          <label htmlFor="c-phone">{isAr ? "رقم الهاتف" : "Phone number"}</label>
          <input
            id="c-phone"
            type="tel"
            className="kt-contact-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+966…"
          />
        </div>
        <div className="kt-contact-field">
          <label htmlFor="c-country">{isAr ? "الدولة" : "Country"}</label>
          <KtSelect
            id="c-country"
            value={country}
            onChange={setCountry}
            options={countryOpts}
            placeholder={isAr ? "الدولة" : "Country"}
          />
        </div>
        <div className="kt-contact-field">
          <label htmlFor="c-type">
            {isAr ? "نوع الاستفسار" : "Enquiry type"} <em>*</em>
          </label>
          <KtSelect
            id="c-type"
            value={enquiryType}
            onChange={(v) => {
              setEnquiryType(v);
              void track({ type: "contact_enquiry_type_change", meta: { enquiryType: v } });
            }}
            options={typeOpts}
            placeholder={isAr ? "النوع" : "Type"}
          />
        </div>

        {enquiryType === "supplier" && (
          <>
            <div className="kt-contact-field">
              <label htmlFor="c-ctype">{isAr ? "نوع الشركة" : "Company type"}</label>
              <input
                id="c-ctype"
                className="kt-contact-input"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                placeholder={isAr ? "مصنّع، موزّع…" : "Manufacturer, distributor…"}
              />
            </div>
            <div className="kt-contact-field">
              <label htmlFor="c-pcat">{isAr ? "تصنيف المنتجات" : "Product category"}</label>
              <input
                id="c-pcat"
                className="kt-contact-input"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
              />
            </div>
            <div className="kt-contact-field">
              <label htmlFor="c-web">{isAr ? "الموقع الإلكتروني" : "Website"}</label>
              <input
                id="c-web"
                className="kt-contact-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="kt-contact-field">
              <label htmlFor="c-served">{isAr ? "الأسواق المخدومة" : "Countries served"}</label>
              <input
                id="c-served"
                className="kt-contact-input"
                value={countriesServed}
                onChange={(e) => setCountriesServed(e.target.value)}
              />
            </div>
          </>
        )}

        {enquiryType === "buyer" && (
          <>
            <div className="kt-contact-field">
              <label htmlFor="c-bcat">{isAr ? "تصنيف المنتج" : "Product category"}</label>
              <input
                id="c-bcat"
                className="kt-contact-input"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
              />
            </div>
            <div className="kt-contact-field">
              <label htmlFor="c-qty">{isAr ? "الكمية التقريبية" : "Approx. quantity"}</label>
              <input
                id="c-qty"
                className="kt-contact-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="kt-contact-field">
              <label htmlFor="c-market">{isAr ? "السوق المطلوب" : "Required market"}</label>
              <input
                id="c-market"
                className="kt-contact-input"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
              />
            </div>
            <div className="kt-contact-field">
              <label htmlFor="c-time">{isAr ? "الجدول الزمني المتوقع" : "Expected timeline"}</label>
              <input
                id="c-time"
                className="kt-contact-input"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>
          </>
        )}

        {enquiryType === "partnership" && (
          <>
            <div className="kt-contact-field">
              <label htmlFor="c-ptype">{isAr ? "نوع الشراكة" : "Partnership type"}</label>
              <input
                id="c-ptype"
                className="kt-contact-input"
                value={partnershipType}
                onChange={(e) => setPartnershipType(e.target.value)}
              />
            </div>
            <div className="kt-contact-field">
              <label htmlFor="c-pmarket">{isAr ? "السوق" : "Market"}</label>
              <input
                id="c-pmarket"
                className="kt-contact-input"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="kt-contact-field kt-contact-field--full">
          <label htmlFor="c-subject">
            {isAr ? "الموضوع" : "Subject"} <em>*</em>
          </label>
          <input
            id="c-subject"
            className="kt-contact-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <div className="kt-contact-field kt-contact-field--full">
          <label htmlFor="c-message">
            {isAr ? "الرسالة" : "Message"} <em>*</em>
          </label>
          <textarea
            id="c-message"
            className="kt-contact-input kt-contact-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
          />
        </div>

        <div className="kt-contact-field kt-contact-field--full">
          <label>{isAr ? "مرفق (اختياري)" : "Attachment (optional)"}</label>
          <div className="kt-contact-file">
            <label className="kt-contact-file__btn">
              <Paperclip size={15} strokeWidth={1.75} />
              {isAr ? "إرفاق ملف" : "Attach file"}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                hidden
                onChange={(e) => onFile(e.target.files?.[0] || null)}
              />
            </label>
            <span className="kt-contact-file__hint">
              {isAr ? "PDF، Word، Excel، صور — حتى 8 ميجابايت" : "PDF, Word, Excel, images — up to 8MB"}
            </span>
            {file ? (
              <button type="button" className="kt-contact-file__chip" onClick={() => setFile(null)}>
                {file.name}
                <X size={12} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="kt-contact-form__error">{error}</p> : null}

      <button type="submit" className="kt-contact-submit" disabled={loading}>
        {loading
          ? isAr
            ? "جاري الإرسال…"
            : "Sending…"
          : isAr
            ? "إرسال الاستفسار"
            : "Send enquiry"}
      </button>
    </form>
  );
}
