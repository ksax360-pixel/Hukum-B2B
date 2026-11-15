"use client";

export type NetworkNameplate = {
  id: string;
  short: string;
  name: string;
  href?: string;
};

/** Live marketplace names only — never fake enterprise logos (Risk Register C3). */
export function LogoMarquee({
  locale = "en",
  items,
}: {
  locale?: string;
  items: NetworkNameplate[];
}) {
  if (!items.length) {
    return (
      <p className="home-logo-marquee__lead text-center text-sm text-[var(--muted)] px-4">
        {locale === "ar"
          ? "لا يوجد موردون موثّقون معروضون بعد — الشارات تُمنح بعد تحقق إداري حقيقي."
          : "No verified suppliers to show yet — badges are granted only after real admin checks."}
      </p>
    );
  }

  const row = items.length >= 6 ? [...items, ...items] : Array.from({ length: 4 }, () => items).flat();

  return (
    <div
      className="home-logo-marquee"
      aria-label={locale === "ar" ? "موردون موثّقون على Hukum" : "Verified suppliers on Hukum"}
    >
      <div className="home-logo-marquee__track">
        {row.map((logo, i) =>
          logo.href ? (
            <a
              key={`${logo.id}-${i}`}
              href={logo.href}
              className="home-logo-marquee__nameplate"
              title={logo.name}
              tabIndex={i >= items.length ? -1 : 0}
              aria-hidden={i >= items.length}
            >
              {logo.short}
            </a>
          ) : (
            <span
              key={`${logo.id}-${i}`}
              className="home-logo-marquee__nameplate"
              title={logo.name}
              aria-hidden={i >= items.length}
            >
              {logo.short}
            </span>
          )
        )}
      </div>
    </div>
  );
}
