import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Check, CheckCircle2 } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { staticPageMetadata } from "@/modules/seo/static-metadata";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { RFQ } from "@/modules/rfqs/rfq.model";
import { cityName } from "@/lib/cities";
import { unitLabel } from "@/lib/money";
import { rfqPromise } from "@/lib/rfq-promise";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/rfq/sent",
    isAr ? "تم إرسال الطلب | Hukum" : "Request sent | Hukum",
    isAr
      ? "تم استلام طلب عرض السعر. سنتابع المطابقة مع الموردين المناسبين."
      : "Your quote request was received. Matching with relevant suppliers is next."
  );
}

type SentRfq = {
  title?: { en?: string };
  items?: Array<{ name?: { en?: string; ar?: string }; quantity?: number; unit?: string }>;
  deliveryLocation?: { city?: string };
  deliveryDate?: string;
};

/** The request's own details, only for the buyer who sent it. */
async function loadOwnRfq(ref: string): Promise<SentRfq | null> {
  if (!/^[a-f\d]{24}$/i.test(ref)) return null;
  try {
    const session = await getSession();
    if (!session) return null;
    await connectDB();
    const rfq = await RFQ.findOne({ _id: ref, buyerId: session.id }).select("title items deliveryLocation deliveryDate").lean();
    return rfq ? (JSON.parse(JSON.stringify(rfq)) as SentRfq) : null;
  } catch {
    return null;
  }
}

export default async function RfqSentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const sp = await searchParams;
  const ref = sp.ref || sp.id || "";
  const matched = Math.max(0, Number(sp.n) || 0);
  const rfq = ref ? await loadOwnRfq(ref) : null;
  const items = rfq?.items || [];

  const steps = [
    { done: true, title: L("Request sent", "تم إرسال الطلب"), text: L("Saved to your account.", "محفوظ في حسابك.") },
    matched
      ? {
          done: true,
          title: L(`Sent to ${matched} matching supplier${matched === 1 ? "" : "s"}`, `وصل إلى ${matched} ${matched === 1 ? "مورد" : "موردين"} مطابقين`),
          text: L("Only suppliers who sell this see it. Your number stays private.", "يشوفه فقط الموردون اللي يبيعون هذا المنتج، ورقمك يبقى خاصاً."),
        }
      : {
          done: false,
          title: L("The Hukum team is finding suppliers", "فريق حكم يبحث لك عن موردين"),
          text: L("No listed supplier matched it yet, so we look for them and add them to your request.", "ما فيه مورد مسجّل يطابق الطلب بعد، فنبحث عنهم ونضيفهم لطلبك."),
        },
    { done: false, title: L("Quotes arrive", "تصلك العروض"), text: `${rfqPromise(locale)}. ${L("They appear in your account as they come in.", "تظهر في حسابك أول ما توصل.")}` },
    { done: false, title: L("Compare and choose", "قارن واختر"), text: L("See prices, lead times and terms side by side. Accept one and you get the supplier's contact.", "تشوف الأسعار ومدد التوريد والشروط جنباً إلى جنب. تقبل عرضاً وتحصل على بيانات المورد.") },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <div className="rfqs" dir={isAr ? "rtl" : "ltr"}>
      <div className="rfqs__wrap">
        <header className="rfqs__head">
          <span className="rfqs__ok" aria-hidden><CheckCircle2 size={28} /></span>
          <h1>{L("Your request is on its way", "طلبك في الطريق")}</h1>
          {ref ? <p>{L("Reference", "رقم المرجع")} <b dir="ltr">#{ref.slice(-6).toUpperCase()}</b></p> : null}
        </header>

        {rfq ? (
          <section className="rfqs__card" aria-label={L("Your request", "طلبك")}>
            <h2>{items.length > 1 ? L(`${items.length} items`, `${items.length} منتجات`) : items[0]?.name?.en || rfq.title?.en}</h2>
            {items.length ? (
              <ul className="rfqs__items">
                {items.map((it, i) => (
                  <li key={i}>
                    <span>{(isAr ? it.name?.ar || it.name?.en : it.name?.en) || "—"}</span>
                    {it.quantity ? <b>{it.quantity.toLocaleString("en-US")} {unitLabel(it.unit, locale)}</b> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <dl>
              {rfq.deliveryLocation?.city ? <div><dt>{L("Deliver to", "التوصيل إلى")}</dt><dd>{cityName(rfq.deliveryLocation.city, locale)}</dd></div> : null}
              <div><dt>{L("Needed by", "مطلوب قبل")}</dt><dd>{rfq.deliveryDate ? new Date(rfq.deliveryDate).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : L("Flexible", "مرن")}</dd></div>
            </dl>
          </section>
        ) : null}

        <section className="rfqs__card" aria-labelledby="rfqs-next">
          <h2 id="rfqs-next">{L("What happens next", "وش يصير بعدين")}</h2>
          <ol className="rfqs__steps">
            {steps.map((s, i) => (
              <li key={s.title} className={s.done ? "is-done" : i === current ? "is-now" : ""} aria-current={i === current ? "step" : undefined}>
                <span className="rfqs__dot" aria-hidden>{s.done ? <Check size={14} /> : i + 1}</span>
                <div>
                  <b>{s.title}</b>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="rfqs__act">
          <Link href={`/${locale}/buyer/rfqs`} className="brw__btn brw__btn--primary">{L("Track this request", "تابع الطلب")}</Link>
          <Link href={`/${locale}/rfq`} className="vsf-btn">{L("Send another request", "أرسل طلباً آخر")}</Link>
          <Link href={`/${locale}/products`} className="brw__more">{L("Keep browsing", "تابع التصفح")}</Link>
        </div>
      </div>
    </div>
  );
}
