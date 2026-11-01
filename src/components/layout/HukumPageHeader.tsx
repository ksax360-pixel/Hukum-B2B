import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";

export type HukumCrumb = {
  label: string;
  href?: string;
};

export function HukumPageHeader({
  locale,
  eyebrow,
  title,
  lead,
  arabic,
  crumbs,
  actions,
  goldEyebrow = false,
}: {
  locale: Locale;
  eyebrow?: string;
  title: string;
  lead?: string;
  arabic?: string;
  crumbs?: HukumCrumb[];
  actions?: ReactNode;
  goldEyebrow?: boolean;
}) {
  const homeLabel = locale === "ar" ? "الرئيسية" : "Home";

  const items: HukumCrumb[] = crumbs?.length
    ? crumbs
    : [{ label: homeLabel, href: `/${locale}` }, { label: title }];

  return (
    <header className="hukum-page-header">
      <div className="hukum-page-header__main">
        <nav aria-label={locale === "ar" ? "مسار التنقل" : "Breadcrumb"}>
          <ol className="hukum-page-header__crumb">
            {items.map((item, i) => (
              <li key={`${item.label}-${i}`} className="inline-flex items-center gap-2">
                {i > 0 ? (
                  <span className="hukum-page-header__crumb-sep" aria-hidden>
                    /
                  </span>
                ) : null}
                {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              </li>
            ))}
          </ol>
        </nav>

        {eyebrow ? (
          <p
            className={`hukum-page-header__eyebrow${goldEyebrow ? " hukum-page-header__eyebrow--gold" : ""}`}
          >
            <span className="hukum-page-header__eyebrow-rule" aria-hidden />
            <span>{eyebrow}</span>
          </p>
        ) : null}

        <h1 className="hukum-page-header__title">{title}</h1>
        {arabic ? (
          <p className="hukum-page-header__arabic" lang="ar" dir="ltr">
            {arabic}
          </p>
        ) : null}
        {lead ? <p className="hukum-page-header__lead">{lead}</p> : null}
      </div>

      {actions ? <div className="hukum-page-header__actions">{actions}</div> : null}
    </header>
  );
}
