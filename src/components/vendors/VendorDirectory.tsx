// src/components/vendors/VendorDirectory.tsx
// Supplier directory: search, type tabs with counts, city + verified chips, and supplier cards that show
// what they sell (3 product photos) so buyers judge fit without opening every profile (IndiaMART pattern).

import Link from "next/link";
import { BadgeCheck, CalendarDays, MapPin, Search, Send, Store } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { SUPPLIER_TYPES, type DirectoryFilters, type DirectoryResult } from "@/modules/vendors/directory.service";

type Props = { locale: Locale; result: DirectoryResult; filters: DirectoryFilters };

const CITY_AR: Record<string, string> = {
  Riyadh: "الرياض", Jeddah: "جدة", Dammam: "الدمام", Khobar: "الخبر", Dhahran: "الظهران", Mecca: "مكة",
  Medina: "المدينة", Jubail: "الجبيل", Yanbu: "ينبع", Tabuk: "تبوك", Abha: "أبها", Qassim: "القصيم",
};
const TYPE_LABEL: Record<string, { en: string; ar: string }> = {
  manufacturer: { en: "Manufacturer", ar: "مصنّع" }, oem: { en: "OEM manufacturer", ar: "مصنّع OEM" }, odm: { en: "ODM manufacturer", ar: "مصنّع ODM" },
  distributor: { en: "Distributor", ar: "موزّع" }, importer: { en: "Importer", ar: "مستورد" }, brand_owner: { en: "Brand owner", ar: "مالك علامة" },
  wholesaler: { en: "Wholesaler", ar: "تاجر جملة" }, trading_company: { en: "Trading company", ar: "شركة تجارية" }, retailer: { en: "Retailer", ar: "تاجر تجزئة" },
  exporter: { en: "Exporter", ar: "مصدّر" }, service_provider: { en: "Service provider", ar: "مزوّد خدمة" }, contractor: { en: "Contractor", ar: "مقاول" },
};

export function VendorDirectory({ locale, result, filters }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const cityName = (c: string): string => (isAr ? CITY_AR[c] || c : c);
  const named = (n?: { en?: string; ar?: string }): string => (isAr ? n?.ar || n?.en : n?.en || n?.ar) || "";
  const base = `/${locale}/vendors`;
  const year = new Date().getFullYear();

  const href = (change: Partial<Record<"type" | "city" | "verified" | "page", string | undefined>>): string => {
    const cur: Record<string, string | undefined> = {
      q: filters.q,
      type: filters.type,
      city: filters.city,
      verified: filters.verified ? "1" : undefined,
      origin: filters.saudi ? "saudi" : undefined,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...cur, ...change })) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const tabs = [{ key: "", en: "All suppliers", ar: "كل الموردين", count: result.typeCounts.all || 0 }].concat(
    Object.entries(SUPPLIER_TYPES).map(([key, t]) => ({ key, en: t.en, ar: t.ar, count: result.typeCounts[key] || 0 }))
  );

  return (
    <div className="vdir" dir={isAr ? "rtl" : "ltr"}>
      <div className="vdir__wrap">
        <header className="vdir__head">
          <div>
            <h1>{filters.saudi ? L("Saudi suppliers", "موردون سعوديون") : L("Find suppliers in Saudi Arabia", "ابحث عن موردين في السعودية")}</h1>
            <p>
              {L(
                "Manufacturers, distributors and traders — checked against their commercial registration. Compare, then send one request.",
                "مصنّعون وموزّعون وتجار — نتحقق من سجلهم التجاري. قارن بينهم ثم أرسل طلباً واحداً."
              )}
            </p>
          </div>
          <form action={base} className="vdir__search" role="search">
            <Search size={18} aria-hidden />
            <input
              name="q"
              defaultValue={filters.q}
              placeholder={L("Supplier name, product or city…", "اسم المورد أو المنتج أو المدينة…")}
              aria-label={L("Search suppliers", "ابحث عن الموردين")}
            />
            {filters.type ? <input type="hidden" name="type" value={filters.type} /> : null}
            <button type="submit">{L("Search", "بحث")}</button>
          </form>
        </header>

        <nav className="vdir__tabs" aria-label={L("Supplier type", "نوع المورد")}>
          {tabs.map((t) => (
            <Link key={t.key || "all"} href={href({ type: t.key || undefined, page: undefined })} className={(filters.type || "") === t.key ? "is-on" : ""}>
              {isAr ? t.ar : t.en} <small>{t.count}</small>
            </Link>
          ))}
        </nav>

        <div className="vdir__chips">
          <Link href={href({ city: undefined, page: undefined })} className={`brw__chip${!filters.city ? " is-on" : ""}`}>
            {L("All cities", "كل المدن")}
          </Link>
          {result.cities.map((c) => (
            <Link key={c.city} href={href({ city: c.city, page: undefined })} className={`brw__chip${filters.city?.toLowerCase() === c.city.toLowerCase() ? " is-on" : ""}`}>
              <MapPin size={13} aria-hidden /> {cityName(c.city)} <small>{c.count}</small>
            </Link>
          ))}
          <span className="brw__div" aria-hidden />
          <Link href={href({ verified: filters.verified ? undefined : "1", page: undefined })} className={`brw__chip${filters.verified ? " is-on" : ""}`}>
            <BadgeCheck size={13} aria-hidden /> {L("Verified only", "الموثّقون فقط")}
          </Link>
        </div>

        <p className="vdir__count">
          {L(`${result.total} supplier${result.total === 1 ? "" : "s"}`, `${result.total} مورد`)}
          {filters.q ? L(` for “${filters.q}”`, ` لـ «${filters.q}»`) : ""}
        </p>

        {result.suppliers.length ? (
          <ul className="vdir__list">
            {result.suppliers.map((s) => {
              const t = TYPE_LABEL[s.type] || TYPE_LABEL.trading_company;
              const profile = `/${locale}/vendors/${s.slug}`;
              return (
                <li key={s.id} className="vcard">
                  <div className="vcard__id">
                    <Link href={profile} className="vcard__logo" aria-label={s.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {s.logo ? <img src={s.logo} alt="" /> : <Store size={22} aria-hidden />}
                    </Link>
                    <div className="vcard__names">
                      <Link href={profile} className="vcard__name">
                        {s.name}
                        {s.verified ? <BadgeCheck size={17} className="brw__tick" aria-label={L("Verified", "موثّق")} /> : null}
                      </Link>
                      {s.nameAr && !isAr ? (
                        <span className="vcard__ar" lang="ar" dir="rtl">{s.nameAr}</span>
                      ) : null}
                      <div className="vcard__facts">
                        <span className="vcard__type">{isAr ? t.ar : t.en}</span>
                        {s.city ? (
                          <span><MapPin size={13} aria-hidden /> {cityName(s.city)}</span>
                        ) : null}
                        {s.since ? (
                          <span><CalendarDays size={13} aria-hidden /> {L(`${Math.max(1, year - s.since)} yrs`, `${Math.max(1, year - s.since)} سنوات`)}</span>
                        ) : null}
                        <span>{L(`${s.productCount} product${s.productCount === 1 ? "" : "s"}`, `${s.productCount} منتج`)}</span>
                      </div>
                      {s.categories.length || s.certifications.length ? (
                        <p className="vcard__sells">
                          {s.categories.map((c) => <span key={named(c)}>{named(c)}</span>)}
                          {s.certifications.map((c) => <span key={c} className="vcard__certs">{c}</span>)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {s.products.length ? (
                    <div className="vcard__products">
                      {s.products.map((p) => (
                        <Link key={p.slug} href={`/${locale}/products/${p.slug}`} className="vcard__prod" title={named(p.name)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span />}
                          <small>{named(p.name)}</small>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="vcard__products vcard__products--empty">{L("Catalogue coming soon", "الكتالوج قريباً")}</div>
                  )}

                  <div className="vcard__actions">
                    <Link href={`/${locale}/rfq?vendorId=${encodeURIComponent(s.id)}`} className="brw__btn brw__btn--primary">
                      <Send size={15} aria-hidden /> {L("Request quote", "اطلب عرض سعر")}
                    </Link>
                    <Link href={profile} className="vcard__view">
                      {L("View supplier", "عرض المورد")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="brw__empty">
            <h2>{L("No supplier matches these filters", "لا يوجد مورد يطابق هذه التصفية")}</h2>
            <p>{L("Clear a filter, or send a request and we'll find suppliers for you.", "أزل أحد عوامل التصفية، أو أرسل طلباً ونبحث لك عن موردين.")}</p>
            <div className="vcard__actions" style={{ flexDirection: "row" }}>
              <Link href={base} className="vcard__view">{L("Clear filters", "إزالة التصفية")}</Link>
              <Link href={`/${locale}/rfq${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ""}`} className="brw__btn brw__btn--primary">
                <Send size={15} aria-hidden /> {L("Request quotes", "اطلب عروض أسعار")}
              </Link>
            </div>
          </div>
        )}

        {result.pages > 1 ? (
          <nav className="brw__pager" aria-label={L("Pages", "الصفحات")}>
            {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={href({ page: n > 1 ? String(n) : undefined })} aria-current={n === result.page ? "page" : undefined}>
                {n}
              </Link>
            ))}
          </nav>
        ) : null}

        <aside className="vdir__join">
          <div>
            <b>{L("Sell to Saudi buyers on Hukum", "بِع للمشترين السعوديين عبر حكم")}</b>
            <span>{L("Free listing through 2027. Get requests that match what you make.", "إدراج مجاني حتى نهاية 2027. تصلك الطلبات المناسبة لمنتجاتك.")}</span>
          </div>
          <Link href={`/${locale}/become-a-vendor`} className="brw__btn brw__btn--dark" style={{ width: "auto" }}>
            {L("List your company", "سجّل شركتك")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
