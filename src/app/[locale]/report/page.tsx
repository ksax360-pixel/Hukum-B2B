import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { PhoneCall, ShieldAlert } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { ReportForm } from "@/components/report/ReportForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/report", "ignored", undefined, { seoKey: "report" });
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const next = [
    L("A person on the Hukum team reads every report.", "شخص من فريق حكم يقرأ كل بلاغ."),
    L("We check the supplier or listing and may pause it while we look.", "نفحص المورد أو المنتج وقد نوقفه مؤقتاً أثناء الفحص."),
    L("A confirmed problem removes the verified badge or the listing.", "إذا تأكدت المشكلة تُزال شارة التوثيق أو المنتج."),
    L("We tell you the outcome by email.", "نبلغك بالنتيجة على البريد."),
  ];

  return (
    <div className="hiw rpt" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head">
          <h1>{L("Report a concern", "بلّغ عن مشكلة")}</h1>
          <p>{L("Something wrong with a supplier, a listing or a message? Tell us. Reports are handled confidentially.", "شي غلط في مورد أو منتج أو رسالة؟ بلّغنا. البلاغات تُعامل بسرية.")}</p>
        </header>

        <div className="rpt-layout">
          <section className="boq-card">
            <ReportForm locale={locale} prefillRef={(sp.ref || "").slice(0, 300)} />
          </section>
          <aside className="rpt-side">
            <div className="rpt-urgent">
              <ShieldAlert size={20} aria-hidden />
              <div>
                <b>{L("Paid someone you now doubt?", "حوّلت لأحد وشكّيت فيه؟")}</b>
                <p>{L("Call your bank first to stop or trace the transfer, then send us the report.", "كلّم بنكك أولاً لإيقاف التحويل أو تتبعه، ثم أرسل لنا البلاغ.")}</p>
              </div>
            </div>
            <div className="rpt-next">
              <h2>{L("What happens next", "وش يصير بعدها")}</h2>
              <ol className="boq-steps">
                {next.map((t, i) => (
                  <li key={t}><span aria-hidden>{i + 1}</span><div><p>{t}</p></div></li>
                ))}
              </ol>
            </div>
            <p className="rpt-alt"><PhoneCall size={15} aria-hidden /> {L("For an active crime, contact the police on 999.", "في حال جريمة قائمة، اتصل بالشرطة على 999.")} <Link href={`/${locale}/contact`}>{L("Other questions", "أسئلة أخرى")}</Link></p>
          </aside>
        </div>
      </div>
    </div>
  );
}
