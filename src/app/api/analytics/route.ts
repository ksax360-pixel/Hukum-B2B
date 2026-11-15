import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { recordAnalyticsEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = (await req.json()) as {
      type?: string;
      productId?: string;
      vendorId?: string;
      userId?: string;
      meta?: Record<string, unknown>;
    };

    if (!body.type || typeof body.type !== "string") {
      return fail("type is required", 400);
    }

    const ua = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";
    const isBot = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit/i.test(ua);

    await recordAnalyticsEvent({
      type: body.type,
      productId: body.productId,
      vendorId: body.vendorId,
      userId: body.userId,
      meta: {
        ...(body.meta || {}),
        userAgent: ua,
        referer,
        device: /Mobile|Android|iPhone/i.test(ua) ? "mobile" : "desktop",
        bot: isBot,
      },
    });

    return ok({ recorded: true });
  } catch (e) {
    const err = e as Error;
    return fail(err.message || "Failed to record event", 500);
  }
}
