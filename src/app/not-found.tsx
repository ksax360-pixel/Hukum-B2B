import Link from "next/link";

export default function RootNotFound() {
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
          <p className="hukum-empty__text" lang="ar" dir="rtl">
            الصفحة غير موجودة
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/en" className="hukum-btn hukum-btn--primary">
              Home
            </Link>
            <Link href="/ar" className="hukum-btn hukum-btn--secondary">
              العربية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
