// src/components/buyer/BuyerRequestsHome.tsx
// Buyer home: the requests are the product. What needs a decision first, then every request with
// where it stands (finding suppliers → waiting → quotes to compare → supplier chosen).

import Link from "next/link";
import { ArrowRight, FileSpreadsheet, Heart, ListPlus, Plus, Store } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { BuyerRequestRow, RequestStage } from "@/lib/buyer-requests";
import { formatMoney, unitLabel } from "@/lib/money";
import { cityName } from "@/lib/cities";

type Props = {
  locale: Locale;
  name: string;
  rows: BuyerRequestRow[];
  savedCount: number;
  supplierCount: number;
};

const STAGES: RequestStage[] = ["finding", "waiting", "compare", "chosen"];

export function BuyerRequestsHome({ locale, name, rows, savedCount, supplierCount }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const date = (iso?: string): string =>
    iso ? new Date(iso).toLocaleDateString(isAr ? "ar-SA-u-nu-latn" : "en-GB", { day: "numeric", month: "short" }) : "";

  const stageLabel = (r: BuyerRequestRow): string => {
    switch (r.stage) {
      case "finding": return L("Hukum is finding suppliers", "حكم يبحث عن موردين");
      case "waiting": return L(`Sent to ${r.reached} suppliers, waiting for quotes`, `وصل إلى ${r.reached} موردين، بانتظار العروض`);
      case "compare": return L(`${r.quotes} quote${r.quotes === 1 ? "" : "s"} to compare`, `${r.quotes} ${r.quotes === 1 ? "عرض" : "عروض"} للمقارنة`);
      case "chosen": return L("Supplier chosen", "تم اختيار المورد");
      default: return L("Closed", "مغلق");
    }
  };
  const titleOf = (r: BuyerRequestRow): string =>
    r.items.length > 1 ? L(`${r.title} + ${r.items.length - 1} more`, `${r.title} + ${r.items.length - 1} أخرى`) : r.title;
  const quotesHref = (r: BuyerRequestRow): string => `/${locale}/buyer/quotations?${new URLSearchParams({ rfq: r.id, title: titleOf(r) })}`;
  const detailHref = (r: BuyerRequestRow): string => `/${locale}/buyer/rfqs?id=${r.id}`;

  const attention = rows.filter((r) => r.stage === "compare" && r.newQuotes > 0).slice(0, 3);
  const open = rows.filter((r) => r.stage !== "closed" && r.stage !== "chosen");
  const waitingQuotes = rows.reduce((n, r) => n + (r.stage === "compare" ? r.newQuotes : 0), 0);
  const first = name.split(/\s+/)[0];

  return (
    <div className="bh" dir={isAr ? "rtl" : "ltr"}>
      <header className="bh-head">
        <div>
          <h1>{L(`Hi ${first}`, `أهلاً ${first}`)}</h1>
          <p>
            {rows.length
              ? L(
                  `${open.length} open request${open.length === 1 ? "" : "s"}${waitingQuotes ? `, ${waitingQuotes} new quote${waitingQuotes === 1 ? "" : "s"} waiting for you` : ""}`,
                  `${open.length} طلبات مفتوحة${waitingQuotes ? `، و${waitingQuotes} عروض جديدة بانتظارك` : ""}`
                )
              : L("Send one request and suppliers who sell it send you their quotes.", "أرسل طلباً واحداً ويرسل لك الموردون اللي يبيعونه عروضهم.")}
          </p>
        </div>
        <Link href={`/${locale}/rfq`} className="bh-btn bh-btn--primary bh-head__new"><Plus size={16} aria-hidden /> {L("New request", "طلب جديد")}</Link>
      </header>

      {attention.length ? (
        <section className="bh-attn" aria-labelledby="bh-attn-h">
          <h2 id="bh-attn-h">{L("Needs your decision", "بانتظار قرارك")}</h2>
          <div className="bh-attn__grid">
            {attention.map((r) => (
              <Link key={r.id} href={quotesHref(r)} className="bh-attn__card">
                <span className="bh-attn__n">{r.newQuotes}</span>
                <span className="bh-attn__body">
                  <b>{titleOf(r)}</b>
                  <small>
                    {L(`${r.newQuotes} new quote${r.newQuotes === 1 ? "" : "s"}`, `${r.newQuotes} عروض جديدة`)}
                    {r.bestTotal != null ? <> {L("from", "من")} <em>{formatMoney(r.bestTotal, locale, r.currency)}</em></> : null}
                  </small>
                </span>
                <span className="bh-attn__go">{L("Compare", "قارن")} <ArrowRight size={15} aria-hidden /></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="bh-body">
        <section className="bh-list" aria-labelledby="bh-list-h">
          <h2 id="bh-list-h">{L("Your requests", "طلباتك")}</h2>
          {rows.length ? (
            <ul>
              {rows.map((r) => {
                const at = STAGES.indexOf(r.stage);
                return (
                  <li key={r.id} className={`bh-row is-${r.stage}`}>
                    <div className="bh-row__main">
                      <Link href={detailHref(r)} className="bh-row__title">{titleOf(r)}</Link>
                      <p className="bh-row__meta">
                        {r.items[0]?.quantity ? <span>{r.items[0].quantity.toLocaleString("en-US")} {unitLabel(r.items[0].unit, locale)}</span> : null}
                        {r.city ? <span>{cityName(r.city, locale)}</span> : null}
                        <span>{L(`Sent ${date(r.createdAt)}`, `أُرسل ${date(r.createdAt)}`)}</span>
                        {r.neededBy ? <span>{L(`Needed by ${date(r.neededBy)}`, `مطلوب قبل ${date(r.neededBy)}`)}</span> : null}
                      </p>
                      <div className="bh-track" aria-label={stageLabel(r)}>
                        {r.stage === "closed" ? null : STAGES.map((s, i) => <i key={s} className={i <= at ? "is-on" : ""} />)}
                        <span>{stageLabel(r)}</span>
                      </div>
                    </div>
                    <div className="bh-row__side">
                      {r.bestTotal != null ? (
                        <p className="bh-row__best"><small>{L("Best quote", "أفضل عرض")}</small><b>{formatMoney(r.bestTotal, locale, r.currency)}</b></p>
                      ) : null}
                      {r.stage === "compare" ? (
                        <Link href={quotesHref(r)} className="bh-btn bh-btn--primary bh-btn--sm">{L(`Compare ${r.quotes}`, `قارن ${r.quotes}`)}</Link>
                      ) : (
                        <Link href={detailHref(r)} className="bh-btn bh-btn--sm">{L("View", "عرض")}</Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="bh-empty">
              <p>{L("No requests yet. Three ways to start:", "ما فيه طلبات بعد. ابدأ بإحدى ثلاث طرق:")}</p>
              <div className="bh-empty__ways">
                <Link href={`/${locale}/rfq`}><Plus size={16} aria-hidden /> {L("Describe one item", "اكتب منتجاً واحداً")}</Link>
                <Link href={`/${locale}/rfq`}><ListPlus size={16} aria-hidden /> {L("Paste a list", "الصق قائمة")}</Link>
                <Link href={`/${locale}/upload-boq`}><FileSpreadsheet size={16} aria-hidden /> {L("Upload a BOQ", "ارفع جدول كميات")}</Link>
              </div>
            </div>
          )}
        </section>

        <aside className="bh-side">
          <Link href={`/${locale}/buyer/saved`} className="bh-tile">
            <Heart size={18} aria-hidden />
            <span><b>{savedCount}</b> {L(savedCount === 1 ? "saved product" : "saved products", "منتجات محفوظة")}</span>
          </Link>
          <Link href={`/${locale}/buyer/suppliers`} className="bh-tile">
            <Store size={18} aria-hidden />
            <span><b>{supplierCount}</b> {L(supplierCount === 1 ? "supplier you've dealt with" : "suppliers you've dealt with", "موردين تعاملت معهم")}</span>
          </Link>
          <div className="bh-tip">
            <b>{L("Buying several items?", "تشتري أكثر من منتج؟")}</b>
            <p>{L("Paste your whole list into one request instead of sending each item on its own.", "الصق قائمتك كاملة في طلب واحد بدل ما ترسل كل منتج لحاله.")}</p>
            <Link href={`/${locale}/rfq`}>{L("Start a list request", "ابدأ طلب قائمة")}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
