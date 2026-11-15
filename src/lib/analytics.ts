import { AnalyticsEvent } from "@/modules/platform/platform.model";
import { connectDB } from "@/lib/db";

export type AnalyticsPayload = {
  type: string;
  productId?: string;
  vendorId?: string;
  userId?: string;
  meta?: Record<string, unknown>;
};

export async function recordAnalyticsEvent(payload: AnalyticsPayload) {
  await connectDB();
  await AnalyticsEvent.create({
    type: payload.type,
    productId: payload.productId || undefined,
    vendorId: payload.vendorId || undefined,
    userId: payload.userId || undefined,
    meta: {
      ...payload.meta,
      recordedAt: new Date().toISOString(),
    },
  });
}
