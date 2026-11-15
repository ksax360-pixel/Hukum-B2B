export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { CMSPage } from "@/modules/platform/platform.model";
import { t } from "@/lib/utils";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/blog", "ignored", undefined, { seoKey: "blog" });
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
    <main className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "المدونة" : "Blog"}
          title={isAr ? "رؤى B2B" : "B2B insights"}
          lead={isAr ? "أخبار المنصة، التجارة، والامتثال في المملكة." : "Platform updates, trade, and compliance in the Kingdom."}
          goldEyebrow
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 && (
          <div className="col-span-full empty-state">
            {isAr ? "لا توجد مقالات منشورة بعد." : "No published articles yet."}
          </div>
        )}
        {posts.map((post) => {
          const slug = (post.slug as { en?: string; ar?: string })?.en || String(post._id);
          return (
            <article key={String(post._id)} className="hukum-card flex flex-col gap-3 p-6">
              <h2 className="text-lg font-semibold leading-snug text-[var(--hukum-ink)]">
                {t(locale, post.title as { en?: string; ar?: string })}
              </h2>
              {t(locale, post.excerpt as { en?: string; ar?: string }) ? (
                <p className="line-clamp-3 text-sm text-[var(--hukum-muted)]">
                  {t(locale, post.excerpt as { en?: string; ar?: string })}
                </p>
              ) : null}
              <Link
                href={`/${locale}/blog/${slug}`}
                className="mt-auto text-sm font-medium text-[var(--hukum-green)] underline-offset-2 hover:underline"
              >
                {isAr ? "اقرأ المزيد" : "Read more"}
              </Link>
            </article>
          );
        })}
        </div>
      </div>
    </main>
  );
}
