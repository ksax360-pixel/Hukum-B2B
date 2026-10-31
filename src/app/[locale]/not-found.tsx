import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-custom section max-w-xl text-center space-y-4">
      <p className="label-caps">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-[var(--muted)]">This URL is not available. It may have been moved or unpublished.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/en" className="btn-primary">
          Home
        </Link>
        <Link href="/en/products" className="btn-secondary">
          Search products
        </Link>
        <Link href="/en/categories" className="btn-ghost">
          Categories
        </Link>
      </div>
    </div>
  );
}
