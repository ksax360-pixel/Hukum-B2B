// src/components/home/HomeClosingCta.tsx
// The page's last word to a buyer: two ways to get quotes, side by side.
// Request quotes yourself (self-serve), or hand it to the VIP concierge team.
import Link from "next/link";
import { ArrowUpRight, Crown, FileSpreadsheet, Send } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { rfqPromise } from "@/lib/rfq-promise";
import { sourcingWhatsAppHref, sourcingWhatsAppIsExternal } from "@/lib/sourcing-contact";

export function HomeClosingCta({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  return (
    <section className="hq" aria-labelledby="hq-h" dir={isAr ? "rtl" : "ltr"}>
      <div className="hq__wrap">
        <header className="hq__head">
          <h2 id="hq-h">{L("Tell us what you need", "قل لنا وش تحتاج")}</h2>
          <p>{rfqPromise(locale)}</p>
        </header>

        <div className="hq__grid">
          <article className="hq__card">
            <span className="hq__icon"><Send size={20} strokeWidth={1.7} aria-hidden /></span>
            <h3>{L("Request quotes", "اطلب عروض أسعار")}</h3>
            <p>{L("One request reaches matched suppliers. Compare their quotes side by side.", "طلب واحد يصل للموردين المطابقين. قارن عروضهم جنباً إلى جنب.")}</p>
            <div className="hq__act">
              <Link href={`/${locale}/rfq`} className="hq__cta">{L("Request quotes", "اطلب عروض أسعار")} <ArrowUpRight size={15} aria-hidden /></Link>
              <Link href={`/${locale}/upload-boq`} className="hq__ghost"><FileSpreadsheet size={15} aria-hidden /> {L("Upload a BOQ", "ارفع جدول كميات")}</Link>
            </div>
          </article>

          <article className="hq__card hq__card--vip">
            <span className="hq__icon"><Crown size={20} strokeWidth={1.7} aria-hidden /></span>
            <h3>{L("VIP concierge", "كونسيرج VIP")}</h3>
            <p>{L("Large, complex or urgent? A Hukum manager sources it with you, end to end.", "طلب كبير أو معقّد أو مستعجل؟ مدير من حكم يتولاه معك من البداية للنهاية.")}</p>
            <div className="hq__act">
              <Link href={`/${locale}/sourcing-help`} className="hq__cta hq__cta--gold">{L("Request VIP concierge", "اطلب كونسيرج VIP")} <ArrowUpRight size={15} aria-hidden /></Link>
              {sourcingWhatsAppIsExternal() ? (
                <a href={sourcingWhatsAppHref(locale)} target="_blank" rel="noopener noreferrer" className="hq__ghost">{L("WhatsApp us", "واتساب")}</a>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
