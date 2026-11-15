import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { BoqUploader } from "@/components/boq/BoqUploader";
import { rfqPromise } from "@/lib/rfq-promise";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/upload-boq", "ignored", undefined, { seoKey: "upload-boq" });
}

/** The tool is the page: drop a file, check the lines, send them as one request. */
export default async function UploadBoqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);

  const steps = [
    { b: L("Drop the file", "ارفع الملف"), t: L("Excel or CSV straight from your estimator.", "Excel أو CSV مثل ما هو من فريق الكميات.") },
    { b: L("Check the lines", "راجع البنود"), t: L("We read item, quantity and unit. Fix anything in the table.", "نقرأ البند والكمية والوحدة، وتعدّل أي شي في الجدول.") },
    { b: L("Send one request", "أرسل طلباً واحداً"), t: rfqPromise(locale) },
  ];

  return (
    <div className="hiw boq" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("Turn your BOQ into quotes", "حوّل جدول الكميات إلى عروض أسعار")}</h1>
          <p>{L("Upload the bill of quantities you already have. Every line becomes part of one request to suppliers who sell those items.", "ارفع جدول الكميات اللي عندك، وكل بند يصير جزءاً من طلب واحد للموردين اللي يبيعونه.")}</p>
        </header>

        <div className="boq-layout">
          <section className="boq-card" aria-label={L("Upload", "الرفع")}>
            <BoqUploader locale={locale} />
          </section>
          <aside className="boq-side">
            <ol className="boq-steps">
              {steps.map((s, i) => (
                <li key={s.b}>
                  <span aria-hidden>{i + 1}</span>
                  <div><b>{s.b}</b><p>{s.t}</p></div>
                </li>
              ))}
            </ol>
            <p className="boq-side__alt">
              {L("Large or mixed project?", "مشروع كبير أو متنوع؟")}{" "}
              <Link href={`/${locale}/sourcing-help`}>{L("Let our concierge run it", "خلّ الكونسيرج يتولاه")}</Link>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
