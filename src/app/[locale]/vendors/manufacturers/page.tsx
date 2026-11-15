import { redirect } from "next/navigation";

/** Manufacturers live in the directory's type tab so filters, search and counts stay in one place. */
export default async function ManufacturersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/vendors?type=manufacturer`);
}
