"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  MessageSquare,
  Package,
  Truck,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { SaudiSupplierMap } from "@/components/home/SaudiSupplierMap";

export type NearSupplier = {
  id: string;
  href: string;
  name: string;
  city: string;
  citiesServed: string[];
  companyType?: string;
  verificationStatus?: string;
  certifications: string[];
  capabilities: string[];
  productCount: number;
  thumb?: string;
  tags: string[];
};

const CITY_TABS = ["Riyadh", "Jeddah", "Dammam", "Qassim"] as const;

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  manufacturer: { en: "Manufacturer", ar: "مصنّع" },
  distributor: { en: "Distributor", ar: "موزّع" },
  wholesaler: { en: "Wholesaler", ar: "تاجر جملة" },
  importer: { en: "Importer", ar: "مستورد" },
  exporter: { en: "Exporter", ar: "مصدّر" },
  trading_company: { en: "Trading company", ar: "شركة تجارية" },
  oem: { en: "OEM", ar: "تصنيع أصلي" },
  agent: { en: "Agent", ar: "وكيل" },
  other: { en: "Other", ar: "أخرى" },
};

function matchesCity(s: NearSupplier, city: string | "all") {
  if (city === "all") return true;
  const needle = city.toLowerCase();
  if (s.city?.toLowerCase() === needle) return true;
  return s.citiesServed.some((c) => c.toLowerCase() === needle);
}

function deliveryLabel(s: NearSupplier, isAr: boolean, city: string) {
  const served = s.citiesServed.filter(Boolean);
  if (served.length >= 4 || served.some((c) => /kingdom|saudi|nationwide|all/i.test(c))) {
    return isAr ? "يورّد على مستوى المملكة" : "Delivers Kingdom-wide";
  }
  if (served.length > 0) {
    const list = served.slice(0, 3).join(isAr ? "، " : ", ");
    return isAr ? `يورّد إلى ${list}` : `Delivers to ${list}`;
  }
  if (s.city) {
    return isAr ? `يورّد في ${s.city}` : `Delivers in ${s.city}`;
  }
  return isAr ? `يورّد إلى ${city}` : `Delivers to ${city}`;
}

export function SuppliersNearYou({
  locale,
  suppliers,
}: {
  locale: Locale;
  suppliers: NearSupplier[];
}) {
  const isAr = locale === "ar";
  const [city, setCity] = useState<string>("Riyadh");

  const filtered = useMemo(() => {
    const list = suppliers.filter((s) => matchesCity(s, city === "all" ? "all" : city));
    // Prefer verified + higher product counts
    return [...list]
      .sort((a, b) => {
        const av = a.verificationStatus === "verified" ? 1 : 0;
        const bv = b.verificationStatus === "verified" ? 1 : 0;
        if (bv !== av) return bv - av;
        return (b.productCount || 0) - (a.productCount || 0);
      })
      .slice(0, 3);
  }, [suppliers, city]);

  const cityLabel =
    city === "all"
      ? isAr
        ? "كل المدن"
        : "All cities"
      : city;

  const mapHref =
    city === "all" ? `/${locale}/vendors` : `/${locale}/vendors?city=${encodeURIComponent(city)}`;

  return (
    <section className="hukum-near">
      <div className="container-custom">
        <div className="hukum-near__head">
          <div className="hukum-near__titles">
            <h2 className="hukum-near__title">
              {isAr ? "موردون بالقرب منك" : "Suppliers near you"}
            </h2>
            <p className="hukum-near__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
              {isAr ? "Suppliers near you" : "موردون بالقرب منك"}
            </p>
          </div>

          <div className="hukum-near__tabs" role="tablist" aria-label={isAr ? "المدينة" : "City"}>
            {CITY_TABS.map((c) => {
              const active = city === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`hukum-near__tab${active ? " is-active" : ""}`}
                  onClick={() => setCity(c)}
                >
                  {active ? <MapPin size={13} strokeWidth={2.25} aria-hidden /> : null}
                  {c}
                </button>
              );
            })}
            <button
              type="button"
              role="tab"
              aria-selected={city === "all"}
              className={`hukum-near__tab${city === "all" ? " is-active" : ""}`}
              onClick={() => setCity("all")}
            >
              {city === "all" ? <MapPin size={13} strokeWidth={2.25} aria-hidden /> : null}
              {isAr ? "كل المدن" : "All cities"}
            </button>
          </div>
        </div>

        <div className="hukum-near__grid">
          <div className="hukum-near__map-card">
            <div className="hukum-near__map-copy">
              <h3 className="hukum-near__map-city">{cityLabel}</h3>
              <p className="hukum-near__map-lead">
                {city === "all"
                  ? isAr
                    ? "موردون في أنحاء المملكة أو يورّدون إليها"
                    : "Suppliers based across Saudi Arabia"
                  : isAr
                    ? `موردون مقرهم في ${city} أو يورّدون إليها`
                    : `Suppliers based in or delivering to ${city}`}
              </p>
            </div>
            <div className="hukum-near__map-visual">
              <SaudiSupplierMap activeCity={city === "all" ? "Riyadh" : city} />
            </div>
            <Link href={mapHref} className="hukum-near__map-link">
              {isAr ? "افتح خريطة الموردين" : "Open the supplier map"}
              <ArrowRight size={14} strokeWidth={2.25} className="rtl:rotate-180" />
            </Link>
          </div>

          <div className="hukum-near__list">
            {filtered.length === 0 ? (
              <div className="hukum-near__empty">
                <p>
                  {isAr
                    ? "لا يوجد موردون لهذه المدينة بعد."
                    : "No suppliers for this city yet."}
                </p>
                <Link href={`/${locale}/vendors`} className="hukum-near__map-link">
                  {isAr ? "تصفّح كل الموردين" : "Browse all suppliers"}
                  <ArrowRight size={14} strokeWidth={2.25} className="rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              filtered.map((s) => {
                const typeKey = s.companyType || "";
                const typeLabel = TYPE_LABELS[typeKey]
                  ? isAr
                    ? TYPE_LABELS[typeKey].ar
                    : TYPE_LABELS[typeKey].en
                  : typeKey.replace(/_/g, " ");
                const verified = s.verificationStatus === "verified";
                const crChecked = !verified && (s.certifications?.length || 0) > 0;
                const based =
                  s.city ||
                  (isAr ? "السعودية" : "Saudi Arabia");

                return (
                  <article key={s.id} className="hukum-supplier">
                    <Link href={s.href} className="hukum-supplier__thumb" aria-hidden tabIndex={-1}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.thumb || "/vendors/demo.jpg"} alt="" loading="lazy" />
                    </Link>

                    <div className="hukum-supplier__main">
                      <div className="hukum-supplier__title-row">
                        <Link href={s.href} className="hukum-supplier__name">
                          {s.name}
                        </Link>
                        {verified ? (
                          <span className="hukum-supplier__badge hukum-supplier__badge--verified">
                            <BadgeCheck size={12} strokeWidth={2} />
                            {isAr ? "موثّق" : "Verified"}
                          </span>
                        ) : crChecked ? (
                          <span className="hukum-supplier__badge hukum-supplier__badge--cr">
                            {isAr ? "سجل تجاري" : "CR checked"}
                          </span>
                        ) : null}
                      </div>

                      <div className="hukum-supplier__stats">
                        <span>
                          <MapPin size={13} strokeWidth={1.75} />
                          {isAr ? `مقره في ${based}` : `Based in ${based}`}
                        </span>
                        <span>
                          <Package size={13} strokeWidth={1.75} />
                          {isAr
                            ? `${s.productCount} منتج`
                            : `${s.productCount} product${s.productCount === 1 ? "" : "s"}`}
                        </span>
                      </div>

                      <p className="hukum-supplier__delivery">
                        <Truck size={13} strokeWidth={1.75} />
                        {deliveryLabel(s, isAr, city === "all" ? based : city)}
                      </p>

                      <div className="hukum-supplier__tags">
                        {[typeLabel, ...s.tags].filter(Boolean).slice(0, 3).map((tag) => (
                          <span key={tag} className="hukum-supplier__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="hukum-supplier__actions">
                      <Link href={s.href} className="hukum-supplier__contact">
                        <MessageSquare size={14} strokeWidth={2} />
                        {isAr ? "تواصل" : "Contact"}
                      </Link>
                      <Link
                        href={s.href}
                        className="hukum-supplier__more"
                        aria-label={isAr ? `عرض ${s.name}` : `View ${s.name}`}
                      >
                        <ArrowRight size={14} strokeWidth={2.25} className="rtl:rotate-180" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
