import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { suggest } from "@/modules/search/smart-search";

/** GET /api/search/suggest?q=…&locale=en — grouped suggestions for the search box. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = String(sp.get("q") || "").trim().slice(0, 120);
  const locale = sp.get("locale") === "ar" ? "ar" : "en";
  if (q.length < 2) return ok({ understood: null, products: [], categories: [], suppliers: [] });
  try {
    await connectDB();
    return ok(await suggest(q, locale));
  } catch (e) {
    console.error("[search/suggest]", e);
    return fail("Search is unavailable right now", 500);
  }
}
