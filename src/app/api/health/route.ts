import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const checks: Record<string, string> = {
    api: "ok",
    database: "unknown",
    ai: process.env.AI_API_KEY ? "configured" : "not_configured",
    storage: process.env.STORAGE_PROVIDER || "local",
    payments: process.env.PAYMENT_PROVIDER || "none",
  };
  try {
    await connectDB();
    checks.database = "ok";
    return ok({ checks, timestamp: new Date().toISOString() });
  } catch (e) {
    checks.database = "error";
    return fail("Database unavailable", 503, (e as Error).message);
  }
}
