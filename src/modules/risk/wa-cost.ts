/**
 * WhatsApp cost ledger (risk register H5) — template discipline + per-conversation cost.
 * Durable daily total via AnalyticsEvent (survives restarts / multi-instance).
 */

import { connectDB } from "@/lib/db";
import { AnalyticsEvent } from "@/modules/platform/platform.model";

/** Meta-style estimates (USD) — override via env. */
const COST_FREEFORM = Number(process.env.WA_USD_FREEFORM || "0.005");
const COST_TEMPLATE = Number(process.env.WA_USD_TEMPLATE || "0.03");
const DAILY_WA_USD_CAP = Number(process.env.WA_DAILY_USD_CAP || "25");

/** Process-local cache warmed from DB. */
const spend = new Map<string, number>();
const spendLoaded = new Set<string>();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function estimateWaCostUsd(mode: "freeform" | "template" | "stub") {
  if (mode === "stub") return 0;
  return mode === "template" ? COST_TEMPLATE : COST_FREEFORM;
}

async function ensureDayLoaded(k: string) {
  if (spendLoaded.has(k)) return;
  await connectDB();
  const start = new Date(`${k}T00:00:00.000Z`);
  const end = new Date(`${k}T23:59:59.999Z`);
  const rows = await AnalyticsEvent.find({
    type: "wa_message_sent",
    createdAt: { $gte: start, $lte: end },
  })
    .select("meta")
    .lean()
    .catch(() => []);
  let total = 0;
  for (const row of rows as Array<{ meta?: { estimatedUsd?: number } }>) {
    total += Number(row.meta?.estimatedUsd || 0);
  }
  spend.set(k, Math.max(spend.get(k) || 0, total));
  spendLoaded.add(k);
}

export async function checkWaCostCap(
  addUsd: number
): Promise<{ ok: boolean; remaining: number; reason?: string }> {
  const k = dayKey();
  await ensureDayLoaded(k);
  const used = spend.get(k) || 0;
  if (used + addUsd > DAILY_WA_USD_CAP) {
    return {
      ok: false,
      remaining: Math.max(0, DAILY_WA_USD_CAP - used),
      reason: `WhatsApp daily cost cap reached (USD ${DAILY_WA_USD_CAP}). Prefer templates sparingly.`,
    };
  }
  return { ok: true, remaining: Math.max(0, DAILY_WA_USD_CAP - used - addUsd) };
}

export async function recordWaSend(opts: {
  toHash?: string;
  mode: "freeform" | "template" | "stub";
  templateName?: string;
  messageId?: string;
  userId?: string;
}) {
  const usd = estimateWaCostUsd(opts.mode);
  const cap = await checkWaCostCap(usd);
  if (!cap.ok && opts.mode !== "stub") {
    throw Object.assign(new Error(cap.reason || "WA cost cap"), { status: 429 });
  }
  const k = dayKey();
  spend.set(k, (spend.get(k) || 0) + usd);

  await connectDB();
  await AnalyticsEvent.create({
    type: "wa_message_sent",
    userId: opts.userId || undefined,
    meta: {
      mode: opts.mode,
      templateName: opts.templateName,
      messageId: opts.messageId,
      toHash: opts.toHash,
      estimatedUsd: usd,
      dayKey: k,
    },
  }).catch(() => undefined);

  return { usd, remaining: cap.remaining };
}

export function getWaSpendToday() {
  return spend.get(dayKey()) || 0;
}
