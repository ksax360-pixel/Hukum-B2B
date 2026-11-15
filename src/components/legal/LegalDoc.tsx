// src/components/legal/LegalDoc.tsx
// Shared layout for legal pages: plain-language summary first, then numbered clauses with a contents list
// that stays in view. Clause numbers carry meaning here (people cite "section 4"), so they stay.

import Link from "next/link";
import { FileText } from "lucide-react";

export type Bi = { en: string; ar: string };
export type LegalSection = { id: string; title: Bi; paras?: Bi[]; list?: Bi[] };
export type LegalContent = { title: Bi; lead: Bi; summary: Bi[]; sections: LegalSection[] };

const OTHERS: Array<{ href: string; label: Bi }> = [
  { href: "/terms", label: { en: "Terms of service", ar: "شروط الاستخدام" } },
  { href: "/privacy", label: { en: "Privacy policy", ar: "سياسة الخصوصية" } },
  { href: "/marketplace-rules", label: { en: "Marketplace rules", ar: "قواعد السوق" } },
];

export function LegalDoc({ locale, doc, path }: { locale: string; doc: LegalContent; path: string }) {
  const isAr = locale === "ar";
  const t = (b: Bi): string => (isAr ? b.ar : b.en);

  return (
    <div className="hiw legal" dir={isAr ? "rtl" : "ltr"}>
      <div className="hiw__wrap">
        <header className="hiw__head legal__head">
          <h1>{t(doc.title)}</h1>
          <p>{t(doc.lead)}</p>
          <p className="legal__draft"><FileText size={14} aria-hidden /> {isAr ? "مسودة قيد المراجعة القانونية، نوفمبر ٢٠٢٦. نبلغ المستخدمين قبل أي تغيير جوهري." : "Draft under legal review, November 2026. We'll tell users before any material change."}</p>
        </header>

        <section className="legal__summary" aria-labelledby="legal-sum">
          <h2 id="legal-sum">{isAr ? "باختصار" : "In short"}</h2>
          <ul>{doc.summary.map((s) => <li key={s.en}>{t(s)}</li>)}</ul>
        </section>

        <div className="legal__layout">
          <nav className="legal__toc" aria-label={isAr ? "المحتويات" : "Contents"}>
            <b>{isAr ? "المحتويات" : "Contents"}</b>
            <ol>{doc.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{t(s.title)}</a></li>)}</ol>
            <div className="legal__others">
              {OTHERS.filter((o) => o.href !== path).map((o) => <Link key={o.href} href={`/${locale}${o.href}`}>{t(o.label)}</Link>)}
            </div>
          </nav>
          <article className="legal__body">
            <ol>
              {doc.sections.map((s) => (
                <li key={s.id} id={s.id}>
                  <h2>{t(s.title)}</h2>
                  {s.paras?.map((p) => <p key={p.en}>{t(p)}</p>)}
                  {s.list ? <ul>{s.list.map((p) => <li key={p.en}>{t(p)}</li>)}</ul> : null}
                </li>
              ))}
            </ol>
            <p className="legal__contact">
              {isAr ? "أسئلة عن هذه الصفحة؟ راسلنا على " : "Questions about this page? Write to "}
              <a href="mailto:support@hukum.sa" dir="ltr">support@hukum.sa</a>
              {isAr ? " أو من " : " or use "}
              <Link href={`/${locale}/contact`}>{isAr ? "صفحة التواصل" : "the contact page"}</Link>.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
