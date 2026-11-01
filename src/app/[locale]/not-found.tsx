import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <div className="hukum-empty" style={{ paddingBlock: "clamp(3rem, 8vw, 5rem)" }}>
          <p className="hukum-page-header__eyebrow hukum-page-header__eyebrow--gold" style={{ marginBottom: 0 }}>
            <span className="hukum-page-header__eyebrow-rule" aria-hidden />
            <span>404</span>
          </p>
          <h1 className="hukum-empty__title" style={{ fontSize: "clamp(1.65rem, 3vw, 2.1rem)" }}>
            Page not found
          </h1>
          <p className="hukum-empty__text">
            This URL is not available. It may have been moved or unpublished.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/en" className="hukum-btn hukum-btn--primary">
              Home
            </Link>
            <Link href="/en/products" className="hukum-btn hukum-btn--secondary">
              Search products
            </Link>
            <Link href="/en/categories" className="hukum-btn hukum-btn--ghost">
              Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
