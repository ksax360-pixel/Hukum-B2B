import { redirect } from "next/navigation";

/** Folded into /buyer/settings to keep the buyer workspace short. */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale === "ar" ? "ar" : "en"}/buyer/settings`);
}
