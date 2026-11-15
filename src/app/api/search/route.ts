import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { searchEngine } from "@/modules/search/search.engine";
import { parseSearchParams } from "@/modules/rfqs/matching.service";
import { SearchHistory } from "@/modules/platform/platform.model";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const type = sp.get("type") || "products";
    const filters = parseSearchParams(sp);
    const result = type === "vendors" ? await searchEngine.searchVendors(filters) : await searchEngine.searchProducts(filters);

    const session = await getSession();
    if (filters.q) {
      await SearchHistory.create({
        userId: session?.id,
        query: filters.q,
        locale: filters.locale,
        filters,
        resultsCount: result.total,
      });
    }

    return ok(result);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
