/**
 * Single AI gateway — logs prompts/outputs/model/tokens/cost,
 * enforces PII minimize + cost caps, supports search-only fallback.
 */
import { Schema, models, model } from "mongoose";
import { aiProvider, type ChatMessage, type AICompletionResult } from "./provider";
import { minimizeMessages } from "./pii-minimize";
import {
  checkCostCap,
  estimateCostUsd,
  recordSpend,
  type AiFeature,
  featureCapsSnapshot,
} from "./cost-caps";

const AIGatewayLogSchema = new Schema(
  {
    feature: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    model: String,
    promptPreview: String,
    outputPreview: String,
    promptTokens: Number,
    completionTokens: Number,
    costUsd: Number,
    redactions: Number,
    status: { type: String, enum: ["ok", "capped", "error", "fallback"], default: "ok" },
    error: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const AIGatewayLog = models.AIGatewayLog || model("AIGatewayLog", AIGatewayLogSchema);

export type GatewayCompleteOpts = {
  feature: AiFeature;
  userId?: string | null;
  messages: ChatMessage[];
  temperature?: number;
  /** When model fails / uncapped — caller may use search-only mode */
  allowFallback?: boolean;
  meta?: Record<string, unknown>;
};

export type GatewayResult = AICompletionResult & {
  costUsd: number;
  redactions: number;
  fallback?: boolean;
  capped?: boolean;
};

async function persistLog(row: Record<string, unknown>) {
  try {
    await AIGatewayLog.create(row);
  } catch {
    /* logging must not break product */
  }
}

/**
 * All model calls should go through this gateway.
 */
export async function gatewayComplete(opts: GatewayCompleteOpts): Promise<GatewayResult> {
  const cap = checkCostCap({ userId: opts.userId, feature: opts.feature, estimatedAddUsd: 0.002 });
  if (!cap.ok) {
    await persistLog({
      feature: opts.feature,
      userId: opts.userId || undefined,
      status: "capped",
      error: cap.reason,
      meta: opts.meta,
    });
    throw Object.assign(new Error(cap.reason || "AI cost cap"), {
      status: 429,
      code: "AI_COST_CAP",
      fallbackSearchOnly: true,
    });
  }

  if (!aiProvider.isConfigured()) {
    await persistLog({
      feature: opts.feature,
      userId: opts.userId || undefined,
      status: "fallback",
      error: "AI_NOT_CONFIGURED",
      meta: opts.meta,
    });
    throw Object.assign(new Error("AI provider not configured — use search-only fallback"), {
      status: 503,
      code: "AI_NOT_CONFIGURED",
      fallbackSearchOnly: true,
    });
  }

  const minimized = minimizeMessages(opts.messages);
  const lastUser = [...minimized.messages].reverse().find((m) => m.role === "user");

  try {
    const result = await aiProvider.complete(minimized.messages, { temperature: opts.temperature });
    const costUsd = estimateCostUsd(result.usage);
    recordSpend({ userId: opts.userId, feature: opts.feature, costUsd });
    await persistLog({
      feature: opts.feature,
      userId: opts.userId || undefined,
      model: result.model,
      promptPreview: (lastUser?.content || "").slice(0, 500),
      outputPreview: (result.content || "").slice(0, 500),
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      costUsd,
      redactions: minimized.redactions,
      status: "ok",
      meta: opts.meta,
    });
    return { ...result, costUsd, redactions: minimized.redactions };
  } catch (e) {
    const err = e as Error & { status?: number; code?: string; fallbackSearchOnly?: boolean };
    if (err.code === "AI_COST_CAP" || err.fallbackSearchOnly) throw err;
    await persistLog({
      feature: opts.feature,
      userId: opts.userId || undefined,
      status: opts.allowFallback !== false ? "fallback" : "error",
      error: err.message,
      meta: opts.meta,
    });
    throw Object.assign(new Error(err.message || "AI gateway error"), {
      status: err.status || 502,
      code: "AI_GATEWAY_ERROR",
      fallbackSearchOnly: opts.allowFallback !== false,
    });
  }
}

export function gatewayStatus() {
  return {
    configured: aiProvider.isConfigured(),
    model: process.env.AI_MODEL || "gpt-4o-mini",
    caps: featureCapsSnapshot(),
    piiMinimize: true,
    searchOnlyFallback: true,
  };
}
