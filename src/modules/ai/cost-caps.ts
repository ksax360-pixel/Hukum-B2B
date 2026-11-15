/**
 * Per-user and per-feature daily cost caps (AI governance).
 * Costs estimated from token usage when provider does not bill us directly.
 */

const USD_PER_1K_PROMPT = Number(process.env.AI_USD_PER_1K_PROMPT || "0.00015");
const USD_PER_1K_COMPLETION = Number(process.env.AI_USD_PER_1K_COMPLETION || "0.0006");

export type AiFeature =
  | "search"
  | "catalogue_builder"
  | "verification"
  | "sourcing_agent"
  | "compare"
  | "quote_normaliser"
  | "quote_assistant"
  | "lead_matching"
  | "demand_insights"
  | "translate"
  | "moderate"
  | "general";

const FEATURE_DAILY_USD: Record<AiFeature, number> = {
  search: 2,
  catalogue_builder: 5,
  verification: 3,
  sourcing_agent: 4,
  compare: 2,
  quote_normaliser: 2,
  quote_assistant: 3,
  lead_matching: 1,
  demand_insights: 1,
  translate: 2,
  moderate: 1,
  general: 5,
};

const USER_DAILY_USD = Number(process.env.AI_USER_DAILY_CAP_USD || "15");

/** In-memory day bucket (process-local). Durable logs also used for audits. */
const spend = new Map<string, number>();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function bucket(userId: string | null | undefined, feature: AiFeature) {
  return `${dayKey()}|${userId || "anon"}|${feature}`;
}

function userBucket(userId: string | null | undefined) {
  return `${dayKey()}|${userId || "anon"}|__user__`;
}

export function estimateCostUsd(usage?: { promptTokens?: number; completionTokens?: number }) {
  const p = (usage?.promptTokens || 0) / 1000;
  const c = (usage?.completionTokens || 0) / 1000;
  return Math.round((p * USD_PER_1K_PROMPT + c * USD_PER_1K_COMPLETION) * 1e6) / 1e6;
}

export function checkCostCap(opts: {
  userId?: string | null;
  feature: AiFeature;
  estimatedAddUsd?: number;
}): { ok: boolean; reason?: string; remainingUserUsd: number; remainingFeatureUsd: number } {
  const featureCap = FEATURE_DAILY_USD[opts.feature] ?? FEATURE_DAILY_USD.general;
  const usedFeature = spend.get(bucket(opts.userId, opts.feature)) || 0;
  const usedUser = spend.get(userBucket(opts.userId)) || 0;
  const add = opts.estimatedAddUsd || 0;
  const remainingFeatureUsd = Math.max(0, featureCap - usedFeature);
  const remainingUserUsd = Math.max(0, USER_DAILY_USD - usedUser);
  if (usedFeature + add > featureCap) {
    return {
      ok: false,
      reason: `Feature daily cap reached (${opts.feature})`,
      remainingUserUsd,
      remainingFeatureUsd,
    };
  }
  if (usedUser + add > USER_DAILY_USD) {
    return {
      ok: false,
      reason: "User daily AI cost cap reached",
      remainingUserUsd,
      remainingFeatureUsd,
    };
  }
  return { ok: true, remainingUserUsd, remainingFeatureUsd };
}

export function recordSpend(opts: {
  userId?: string | null;
  feature: AiFeature;
  costUsd: number;
}) {
  const fKey = bucket(opts.userId, opts.feature);
  const uKey = userBucket(opts.userId);
  spend.set(fKey, (spend.get(fKey) || 0) + opts.costUsd);
  spend.set(uKey, (spend.get(uKey) || 0) + opts.costUsd);
}

export function featureCapsSnapshot() {
  return { userDailyUsd: USER_DAILY_USD, featureDailyUsd: { ...FEATURE_DAILY_USD } };
}
