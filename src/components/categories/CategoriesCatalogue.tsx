"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { HukumSectorCard } from "@/components/categories/HukumSectorCard";

export type CatalogueSector = {
  slug: string;
  nameEn: string;
  nameAr: string;
  href: string;
  imageSrc: string;
  supplierCount: number;
};

export type CatalogueGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  sectors: CatalogueSector[];
};

export function CategoriesCatalogue({
  locale,
  popular,
  groups,
}: {
  locale: Locale;
  popular: CatalogueSector[];
  groups: CatalogueGroup[];
}) {
  const isAr = locale === "ar";
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        sectors: group.sectors.filter((s) => {
          const blob = `${s.nameEn} ${s.nameAr} ${s.slug}`.toLowerCase();
          return blob.includes(q);
        }),
      }))
      .filter((g) => g.sectors.length > 0);
  }, [groups, query]);

  const filteredPopular = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return popular;
    return popular.filter((s) => `${s.nameEn} ${s.nameAr} ${s.slug}`.toLowerCase().includes(q));
  }, [popular, query]);

  const totalVisible =
    filteredPopular.length + filteredGroups.reduce((n, g) => n + g.sectors.length, 0);

  return (
    <div className="hukum-sectors hukum-sectors--catalogue hukum-page" style={{ paddingBlock: 0, borderTop: 0 }}>
      <div className="hukum-page__wrap">
        <header className="hukum-page-header">
          <div className="hukum-page-header__main">
            <nav aria-label={isAr ? "مسار التنقل" : "Breadcrumb"}>
              <ol className="hukum-page-header__crumb">
                <li>
                  <Link href={`/${locale}`}>{isAr ? "الرئيسية" : "Home"}</Link>
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="hukum-page-header__crumb-sep" aria-hidden>
                    ›
                  </span>
                  <span>{isAr ? "التصنيفات" : "Categories"}</span>
                </li>
              </ol>
            </nav>
            <p className="hukum-page-header__eyebrow hukum-page-header__eyebrow--gold">
              <span className="hukum-page-header__eyebrow-rule" aria-hidden />
              <span>{isAr ? "التصنيفات" : "Categories"}</span>
            </p>
            <h1 className="hukum-page-header__title">
              {isAr ? "تصفّح كل القطاعات" : "Browse every sector"}
            </h1>
            <p className="hukum-page-header__lead">
              {isAr
                ? "٤٩ قطاعاً، من معدات السلامة إلى سلسلة التبريد."
                : "49 sectors, from safety equipment to cold chain."}
            </p>
          </div>

          <div className="hukum-page-header__actions" style={{ minWidth: "min(100%, 17rem)" }}>
            <label className="hukum-catalogue-search" htmlFor="sector-search">
              <Search size={16} strokeWidth={1.75} className="hukum-catalogue-search__icon" aria-hidden />
              <input
                id="sector-search"
                type="text"
                role="searchbox"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن قطاع…" : "Find a sector…"}
                aria-label={isAr ? "ابحث عن قطاع" : "Find a sector"}
                className="hukum-catalogue-search__input"
                autoComplete="off"
              />
            </label>
          </div>
        </header>

        {totalVisible === 0 ? (
          <div className="hukum-empty">
            <h2 className="hukum-empty__title">{isAr ? "لا نتائج" : "No sectors found"}</h2>
            <p className="hukum-empty__text">
              {isAr ? "جرّب كلمة بحث أخرى أو امسح البحث." : "Try another keyword, or clear the search."}
            </p>
          </div>
        ) : (
          <>
            {filteredPopular.length > 0 ? (
              <section className="mb-10" aria-labelledby="popular-sectors-title">
                <h2 id="popular-sectors-title" className="hukum-sectors__title" style={{ marginBottom: "1rem" }}>
                  {isAr ? "قطاعات شائعة" : "Popular sectors"}
                </h2>
                <ul className="hukum-sectors__grid">
                  {filteredPopular.map((item) => (
                    <li key={`popular-${item.slug}`}>
                      <HukumSectorCard
                        href={item.href}
                        nameEn={item.nameEn}
                        nameAr={item.nameAr}
                        imageSrc={item.imageSrc}
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="flex flex-col gap-10">
              {filteredGroups.map((group) => (
                <section key={group.id} aria-labelledby={`group-${group.id}`}>
                  <h2
                    id={`group-${group.id}`}
                    className="mb-4 text-sm font-semibold tracking-wide text-[var(--hukum-muted)]"
                  >
                    {isAr ? group.nameAr : group.nameEn}
                  </h2>
                  <ul className="hukum-sectors__grid">
                    {group.sectors.map((item) => (
                      <li key={item.slug}>
                        <HukumSectorCard
                          href={item.href}
                          nameEn={item.nameEn}
                          nameAr={item.nameAr}
                          imageSrc={item.imageSrc}
                          locale={locale}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
