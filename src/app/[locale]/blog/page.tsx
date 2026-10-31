export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { CMSPage } from "@/modules/platform/platform.model";
import { t } from "@/lib/utils";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/blog",
    isAr ? "الموارد | Hukum" : "Resources | Hukum",
    isAr ? "أدلة ومقالات حول التجارة والمشتريات." : "Guides and articles on B2B trade and procurement."
  );
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  let posts: Array<Record<string, unknown>> = [];

  try {
    await connectDB();
    posts = await CMSPage.find({ status: "published", type: "blog" }).sort({ createdAt: -1 }).limit(24).lean();
  } catch {
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${base}/api/platform?resource=cms&type=blog`, { next: { revalidate: 60 } });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) posts = json.data;
    } catch {
      /* offline */
    }
  }

  return (
    <div className="container-custom section">
      <div className="mb-10 space-y-3 max-w-2xl">
        <p className="label-caps">{isAr ? "المدونة" : "Blog"}</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--ink)]">
          {isAr ? "رؤى B2B" : "B2B insights"}
        </h1>
        <p className="text-[var(--muted)]">
          {isAr ? "أخبار المنصة، التجارة، والامتثال في المملكة." : "Platform updates, trade, and compliance in the Kingdom."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length === 0 && (
          <div className="col-span-full empty-state">
            {isAr ? "لا توجد مقالات منشورة بعد." : "No published articles yet."}
          </div>
        )}
        {posts.map((post) => {
          const slug = (post.slug as { en?: string; ar?: string })?.en || String(post._id);
          return (
            <article key={String(post._id)} className="surface-card p-6 flex flex-col gap-3">
              <h2 className="text-lg font-semibold leading-snug">
                {t(locale, post.title as { en?: string; ar?: string })}
              </h2>
              {t(locale, post.excerpt as { en?: string; ar?: string }) ? (
                <p className="text-sm text-[var(--muted)] line-clamp-3">
                  {t(locale, post.excerpt as { en?: string; ar?: string })}
                </p>
              ) : null}
              <Link
                href={`/${locale}/blog/${slug}`}
                className="text-sm text-[var(--accent)] font-medium mt-auto hover:underline underline-offset-2"
              >
                {isAr ? "اقرأ المزيد" : "Read more"}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
