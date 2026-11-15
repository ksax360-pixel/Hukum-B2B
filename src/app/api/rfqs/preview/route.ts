import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { matchVendorsForRfq } from "@/modules/rfqs/matching.service";

/**
 * GET /api/rfqs/preview?q=&categoryId=&city=&productId=
 * How many suppliers a request would reach, before it is sent (D18). Counts only — no supplier
 * names, so it can't be used to scrape who sells what.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = String(sp.get("q") || "").trim().slice(0, 160);
  const categoryId = sp.get("categoryId") || undefined;
  const productId = sp.get("productId") || undefined;
  const city = String(sp.get("city") || "").slice(0, 40) || undefined;
  if (!q && !categoryId && !productId) return ok({ suppliers: 0, verified: 0, inCity: 0 });
  try {
    await connectDB();
    const matches = await matchVendorsForRfq({ categoryId, productId, city, textHints: q ? [q] : [] });
    return ok({
      suppliers: matches.length,
      verified: matches.filter((m) => m.reasons.includes("Verified vendor")).length,
      inCity: city ? matches.filter((m) => m.reasons.some((r) => r.includes(city))).length : 0,
    });
  } catch (e) {
    console.error("[rfqs/preview]", e);
    return fail("Preview unavailable", 500);
  }
}
