"use client";
// src/components/vendor/StorefrontEditor.tsx
// Supplier storefront editor. Company details go live on save; the look of the page (logo, banner,
// colour, wording) goes to Hukum for review first, with a live preview beside the form.

import { useState, type ChangeEvent, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { BadgeCheck, Clock, ExternalLink, ImagePlus, Lock, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Feedback";
import { CITY_AR, cityName } from "@/lib/cities";
import { uploadImage } from "@/lib/upload-image";

type Loc = { en?: string; ar?: string };
export type EditorVendor = {
  id: string;
  name: string;
  verified: boolean;
  tradeName: string;
  legalName: Loc;
  companyType: string;
  city: string;
  yearEstablished?: number;
  website: string;
  phone: string;
  email: string;
  description: Loc;
  publicHref: string | null;
  review: { status: string; reason: string };
  design: {
    headline: Loc; tagline: Loc; bannerText: Loc; ctaLabel: Loc; primaryColor: string;
    logo: string; banner: string; showProducts: boolean; showCertifications: boolean; showContactCta: boolean;
  };
};

const TYPES: Array<[string, string, string]> = [
  ["manufacturer", "Manufacturer", "مصنّع"], ["distributor", "Distributor", "موزّع"], ["wholesaler", "Wholesaler", "تاجر جملة"],
  ["trading_company", "Trading company", "شركة تجارية"], ["importer", "Importer", "مستورد"], ["contractor", "Contractor", "مقاول"],
  ["service_provider", "Service provider", "مقدّم خدمة"], ["retailer", "Retailer", "تاجر تجزئة"],
];
const CITIES = [...new Set(Object.keys(CITY_AR).filter((c) => !["Makkah", "Madinah"].includes(c)))];
const SWATCHES = ["#17634B", "#0F4C81", "#7A2E2E", "#8A5A00", "#3F3D56", "#1F2937"];

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`sfe-field${wide ? " is-wide" : ""}`}>
      <span>{label}{hint ? <small> {hint}</small> : null}</span>
      {children}
    </label>
  );
}

export function StorefrontEditor({ locale, vendor }: { locale: string; vendor: EditorVendor }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const [d, setD] = useState({ ...vendor, yearEstablished: vendor.yearEstablished ? String(vendor.yearEstablished) : "" });
  const [look, setLook] = useState(vendor.design);
  const [review, setReview] = useState(vendor.review);
  const [busy, setBusy] = useState<"" | "details" | "look">("");

  const set = (k: keyof typeof d, v: unknown) => setD((p) => ({ ...p, [k]: v }));
  const setLoc = (k: "legalName" | "description", lang: "en" | "ar", v: string) => setD((p) => ({ ...p, [k]: { ...p[k], [lang]: v } }));
  const setLook1 = (k: keyof typeof look, v: unknown) => setLook((p) => ({ ...p, [k]: v }));
  const setLookLoc = (k: "headline" | "tagline" | "bannerText" | "ctaLabel", lang: "en" | "ar", v: string) =>
    setLook((p) => ({ ...p, [k]: { ...p[k], [lang]: v } }));

  const send = async (body: Record<string, unknown>): Promise<boolean> => {
    try {
      const r = await fetch("/api/vendors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: vendor.id, ...body }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      return true;
    } catch (e) {
      toast(L("Couldn't save. Check your connection and try again.", "تعذّر الحفظ. تأكد من الاتصال وحاول مرة ثانية."), "error");
      console.error("[storefront]", e);
      return false;
    }
  };

  const saveDetails = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("details");
    const year = Number(d.yearEstablished);
    const ok = await send({
      updates: {
        tradeName: d.tradeName.trim(),
        companyType: d.companyType,
        website: d.website.trim(),
        phone: d.phone.trim(),
        email: d.email.trim(),
        description: { en: d.description.en || "", ar: d.description.ar || "" },
        location: { city: d.city },
        ...(year > 1900 && year <= new Date().getFullYear() ? { yearEstablished: year } : {}),
        ...(vendor.verified ? {} : { legalName: { en: d.legalName.en || "", ar: d.legalName.ar || "" } }),
      },
    });
    setBusy("");
    if (ok) toast(L("Details saved. They show on your page now.", "تم الحفظ. التفاصيل تظهر في صفحتك الآن."), "success");
  };

  const sendLook = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("look");
    const ok = await send({ updates: {}, storefront: look });
    setBusy("");
    if (ok) {
      setReview({ status: "pending", reason: "" });
      toast(L("Sent for review. Your live page keeps the current look until it's approved.", "أُرسل للمراجعة. صفحتك الحالية تبقى كما هي لين الموافقة."), "success");
    }
  };

  const pickImage = (k: "logo" | "banner", maxW: number) => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setLook1(k, await uploadImage(file, k === "logo" ? "company_logo" : "company_cover", maxW));
    } catch {
      toast(L("That image couldn't be used. Use a JPG, PNG or WebP under 5 MB.", "ما قدرنا نستخدم الصورة. استخدم JPG أو PNG أو WebP أقل من ٥ ميجا."), "error");
    }
  };

  const pick = (v: Loc): string => (isAr ? v.ar || v.en : v.en || v.ar) || "";
  const shownName = pick(look.headline) || d.tradeName || pick(d.legalName) || vendor.name;
  const brand = { ["--vms-brand" as string]: look.primaryColor } as CSSProperties;

  return (
    <div className="sfe" dir={isAr ? "rtl" : "ltr"}>
      <header className="bh-head">
        <div>
          <h1>{L("Your storefront", "متجرك")}</h1>
          <p>{L("Your page on Hukum works as your company website. Buyers land here from search and products.", "صفحتك في حكم تشتغل كموقع لشركتك. المشترون يوصلونها من البحث والمنتجات.")}</p>
        </div>
        {vendor.publicHref ? (
          <a href={vendor.publicHref} target="_blank" rel="noopener noreferrer" className="bh-btn"><ExternalLink size={15} aria-hidden /> {L("View live page", "شاهد صفحتك")}</a>
        ) : null}
      </header>

      {review.status === "pending" ? (
        <p className="sfe-status is-pending"><Clock size={16} aria-hidden /> {L("Your new look is with Hukum for review. The live page shows the last approved version until then.", "شكل صفحتك الجديد عند فريق حكم للمراجعة. الصفحة الحالية تبقى كما هي لين الموافقة.")}</p>
      ) : review.status === "rejected" ? (
        <p className="sfe-status is-rejected">{L("Your last change wasn't approved", "آخر تعديل ما تمت الموافقة عليه")}{review.reason ? `: ${review.reason}` : "."} {L("Edit below and send again.", "عدّل تحت وأرسل مرة ثانية.")}</p>
      ) : null}

      <div className="sfe-body">
        <div className="sfe-forms">
          <form className="sfe-card" onSubmit={saveDetails}>
            <div className="sfe-card__head">
              <h2>{L("Company details", "بيانات الشركة")}</h2>
              <p>{L("Shown on your page as soon as you save.", "تظهر في صفحتك أول ما تحفظ.")}</p>
            </div>
            <div className="sfe-grid">
              <Field label={L("Legal name in English", "الاسم القانوني بالإنجليزي")}>
                <input value={d.legalName.en || ""} onChange={(e) => setLoc("legalName", "en", e.target.value)} disabled={vendor.verified} />
              </Field>
              <Field label={L("Legal name in Arabic", "الاسم القانوني بالعربي")}>
                <input dir="rtl" value={d.legalName.ar || ""} onChange={(e) => setLoc("legalName", "ar", e.target.value)} disabled={vendor.verified} />
              </Field>
              {vendor.verified ? (
                <p className="sfe-lock is-wide"><Lock size={14} aria-hidden /> {L("Legal name is locked because it matches your verified CR. Contact support to change it.", "الاسم القانوني مقفل لأنه مطابق لسجلك الموثّق. تواصل مع الدعم لتغييره.")}</p>
              ) : null}
              <Field label={L("Trade name", "الاسم التجاري")} hint={L("optional", "اختياري")}>
                <input value={d.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
              </Field>
              <Field label={L("Business type", "نوع النشاط")}>
                <select value={d.companyType} onChange={(e) => set("companyType", e.target.value)}>
                  {TYPES.map(([k, en, ar]) => <option key={k} value={k}>{isAr ? ar : en}</option>)}
                </select>
              </Field>
              <Field label={L("City", "المدينة")}>
                <select value={d.city} onChange={(e) => set("city", e.target.value)}>
                  <option value="">{L("Choose a city", "اختر مدينة")}</option>
                  {CITIES.map((c) => <option key={c} value={c}>{cityName(c, locale)}</option>)}
                </select>
              </Field>
              <Field label={L("Year founded", "سنة التأسيس")}>
                <input inputMode="numeric" maxLength={4} value={d.yearEstablished} onChange={(e) => set("yearEstablished", e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field label={L("Website", "الموقع")} hint={L("optional", "اختياري")}>
                <input type="url" dir="ltr" placeholder="https://" value={d.website} onChange={(e) => set("website", e.target.value)} />
              </Field>
              <Field label={L("Sales phone", "جوال المبيعات")}>
                <input type="tel" dir="ltr" value={d.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label={L("Sales email", "بريد المبيعات")}>
                <input type="email" dir="ltr" value={d.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <p className="sfe-note is-wide">{L("Buyers don't see your phone or email until they ask to contact you. Hukum relays the first message.", "المشترون ما يشوفون جوالك أو بريدك إلا لما يطلبون التواصل. حكم يوصل أول رسالة.")}</p>
              <Field label={L("About your company, English", "عن شركتك، بالإنجليزي")} wide>
                <textarea rows={4} maxLength={1500} value={d.description.en || ""} onChange={(e) => setLoc("description", "en", e.target.value)} placeholder={L("What you sell, who you supply, how long you've been doing it.", "")} />
              </Field>
              <Field label={L("About your company, Arabic", "عن شركتك، بالعربي")} wide>
                <textarea rows={4} dir="rtl" maxLength={1500} value={d.description.ar || ""} onChange={(e) => setLoc("description", "ar", e.target.value)} placeholder="وش تبيع، ومين تورّد له، وكم صار لك بالسوق." />
              </Field>
            </div>
            <div className="sfe-act">
              <button type="submit" className="qb-send" disabled={busy !== ""}>{busy === "details" ? L("Saving…", "جارٍ الحفظ…") : L("Save details", "احفظ البيانات")}</button>
            </div>
          </form>

          <form className="sfe-card" onSubmit={sendLook}>
            <div className="sfe-card__head">
              <h2>{L("How your page looks", "شكل صفحتك")}</h2>
              <p>{L("Hukum checks these before they go live, so every storefront stays professional.", "فريق حكم يراجعها قبل النشر عشان تبقى كل الصفحات احترافية.")}</p>
            </div>
            <div className="sfe-grid">
              <div className="sfe-field">
                <span>{L("Logo", "الشعار")} <small>{L("square, PNG or JPG", "مربع، PNG أو JPG")}</small></span>
                <div className="sfe-upload">
                  {look.logo ? <img src={look.logo} alt="" className="sfe-upload__logo" /> : <span className="sfe-upload__empty"><ImagePlus size={20} aria-hidden /></span>}
                  <label className="bh-btn bh-btn--sm">{look.logo ? L("Replace", "استبدل") : L("Upload", "ارفع")}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickImage("logo", 400)} /></label>
                  {look.logo ? <button type="button" className="sfe-remove" onClick={() => setLook1("logo", "")} aria-label={L("Remove logo", "احذف الشعار")}><Trash2 size={15} aria-hidden /></button> : null}
                </div>
              </div>
              <div className="sfe-field">
                <span>{L("Cover image", "صورة الغلاف")} <small>{L("wide, at least 1600px", "عريضة، ١٦٠٠ بكسل أو أكثر")}</small></span>
                <div className="sfe-upload">
                  {look.banner ? <img src={look.banner} alt="" className="sfe-upload__banner" /> : <span className="sfe-upload__empty is-wide"><ImagePlus size={20} aria-hidden /></span>}
                  <label className="bh-btn bh-btn--sm">{look.banner ? L("Replace", "استبدل") : L("Upload", "ارفع")}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickImage("banner", 1800)} /></label>
                  {look.banner ? <button type="button" className="sfe-remove" onClick={() => setLook1("banner", "")} aria-label={L("Remove cover image", "احذف صورة الغلاف")}><Trash2 size={15} aria-hidden /></button> : null}
                </div>
              </div>
              <fieldset className="sfe-field is-wide">
                <legend>{L("Brand colour", "لون العلامة")} <small>{L("used for your header and buttons", "للرأس والأزرار")}</small></legend>
                <div className="sfe-swatches">
                  {SWATCHES.map((c) => (
                    <button key={c} type="button" className={`sfe-swatch${look.primaryColor.toLowerCase() === c.toLowerCase() ? " is-on" : ""}`} style={{ background: c }} onClick={() => setLook1("primaryColor", c)} aria-label={c} aria-pressed={look.primaryColor.toLowerCase() === c.toLowerCase()} />
                  ))}
                  <label className="sfe-custom">
                    <input type="color" value={look.primaryColor} onChange={(e) => setLook1("primaryColor", e.target.value)} />
                    {L("Custom", "لون آخر")}
                  </label>
                </div>
              </fieldset>
              <Field label={L("Name on your page, English", "الاسم في صفحتك، بالإنجليزي")} hint={L("leave empty to use your company name", "اتركه فاضي لاستخدام اسم الشركة")}>
                <input maxLength={80} value={look.headline.en || ""} onChange={(e) => setLookLoc("headline", "en", e.target.value)} />
              </Field>
              <Field label={L("Name on your page, Arabic", "الاسم في صفحتك، بالعربي")}>
                <input dir="rtl" maxLength={80} value={look.headline.ar || ""} onChange={(e) => setLookLoc("headline", "ar", e.target.value)} />
              </Field>
              <Field label={L("Tagline, English", "الشعار النصي، بالإنجليزي")} hint={L("one line", "سطر واحد")}>
                <input maxLength={120} value={look.tagline.en || ""} onChange={(e) => setLookLoc("tagline", "en", e.target.value)} placeholder="Safety equipment for Saudi industry since 2009" />
              </Field>
              <Field label={L("Tagline, Arabic", "الشعار النصي، بالعربي")}>
                <input dir="rtl" maxLength={120} value={look.tagline.ar || ""} onChange={(e) => setLookLoc("tagline", "ar", e.target.value)} placeholder="معدات السلامة للصناعة السعودية من ٢٠٠٩" />
              </Field>
              <Field label={L("Notice, English", "تنبيه، بالإنجليزي")} hint={L("optional, e.g. holiday hours", "اختياري، مثل دوام الإجازة")}>
                <input maxLength={160} value={look.bannerText.en || ""} onChange={(e) => setLookLoc("bannerText", "en", e.target.value)} />
              </Field>
              <Field label={L("Notice, Arabic", "تنبيه، بالعربي")}>
                <input dir="rtl" maxLength={160} value={look.bannerText.ar || ""} onChange={(e) => setLookLoc("bannerText", "ar", e.target.value)} />
              </Field>
              <fieldset className="sfe-field is-wide">
                <legend>{L("Show on your page", "اعرض في صفحتك")}</legend>
                <div className="sfe-toggles">
                  {([
                    ["showProducts", L("Products", "المنتجات")],
                    ["showCertifications", L("Certifications", "الشهادات")],
                    ["showContactCta", L("Contact section", "قسم التواصل")],
                  ] as const).map(([k, label]) => (
                    <label key={k} className="sfe-toggle">
                      <input type="checkbox" checked={look[k]} onChange={(e) => setLook1(k, e.target.checked)} /> {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="sfe-act">
              <button type="submit" className="qb-send" disabled={busy !== ""}>{busy === "look" ? L("Sending…", "جارٍ الإرسال…") : L("Send for review", "أرسل للمراجعة")}</button>
            </div>
          </form>
        </div>

        <aside className="sfe-preview" aria-label={L("Preview", "معاينة")} style={brand}>
          <p className="sfe-preview__label">{L("Preview", "معاينة")}</p>
          <div className="sfe-mini">
            <div className="sfe-mini__bar">
              {look.logo ? <img src={look.logo} alt="" /> : <span className="sfe-mini__mono">{shownName.slice(0, 1)}</span>}
              <b>{shownName}</b>
            </div>
            <div className="sfe-mini__hero" style={look.banner ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.6), rgba(0,0,0,.15)), url(${look.banner})` } : undefined}>
              {pick(look.tagline) ? <p>{pick(look.tagline)}</p> : null}
              <h3>{shownName}</h3>
              {vendor.verified ? <span className="sfe-mini__badge"><BadgeCheck size={13} aria-hidden /> {L("Verified", "موثّق")}</span> : null}
              <span className="sfe-mini__cta">{L("Request a quote", "اطلب عرض سعر")}</span>
            </div>
            {pick(look.bannerText) ? <p className="sfe-mini__notice">{pick(look.bannerText)}</p> : null}
            <div className="sfe-mini__rows" aria-hidden>
              {look.showProducts ? <i /> : null}<i /><i />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
