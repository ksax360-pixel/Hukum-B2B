import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { QuotationInbox } from "@/components/inbox/QuotationInbox";
import { BUYER_NAV } from "@/lib/buyer-nav";

export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  return (
    <DashboardShell locale={locale} title="Buyer" nav={[...BUYER_NAV]}>
      <div className="bh" dir={isAr ? "rtl" : "ltr"}>
        <header className="bh-head">
          <div>
            <h1>{isAr ? "الرسائل" : "Messages"}</h1>
            <p>{isAr ? "محادثاتك حول الطلبات والعروض. أول تواصل يمر عبر حكم، وأرقام الجوال ما تظهر إلا بموافقة." : "Your conversations about requests and quotes. First contact goes through Hukum; phone numbers show only with consent."}</p>
          </div>
        </header>
        <QuotationInbox locale={locale} role="buyer" linkBase={`/${locale}`} />
      </div>
    </DashboardShell>
  );
}
