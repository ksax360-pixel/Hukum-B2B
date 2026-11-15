/**
 * Payment providers — Demo activates plans without a card (dev / pre-MSP).
 * Set PAYMENT_PROVIDER=demo|none and optionally PAYMENT_API_KEY for external later.
 */

export interface PaymentProvider {
  name: string;
  isConfigured(): boolean;
  createCheckout(input: {
    amount: number;
    currency: string;
    customerId: string;
    meta?: Record<string, unknown>;
  }): Promise<{ checkoutUrl?: string; providerRef: string; status: string; mode?: string }>;
}

export class NullPaymentProvider implements PaymentProvider {
  name = "none";
  isConfigured() {
    return false;
  }
  async createCheckout(_input: {
    amount: number;
    currency: string;
    customerId: string;
    meta?: Record<string, unknown>;
  }): Promise<{ checkoutUrl?: string; providerRef: string; status: string }> {
    throw Object.assign(new Error("Payment provider not configured"), { status: 503 });
  }
}

/** In-process checkout that marks payment paid immediately — for Free upgrades & demo Gold/Premium. */
export class DemoPaymentProvider implements PaymentProvider {
  name = "demo";
  isConfigured() {
    return true;
  }
  async createCheckout(input: {
    amount: number;
    currency: string;
    customerId: string;
    meta?: Record<string, unknown>;
  }): Promise<{ checkoutUrl?: string; providerRef: string; status: string; mode: string }> {
    const ref = `demo_${Date.now()}_${String(input.meta?.plan || "plan")}`;
    console.info("[payments] demo checkout", ref, input.amount, input.currency, input.meta?.plan);
    return { providerRef: ref, status: "paid", mode: "demo" };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER || "demo").toLowerCase();
  // Explicit lock — production can set PAYMENT_PROVIDER=none until a gateway is live.
  if (name === "none" || name === "off" || name === "disabled") {
    return new NullPaymentProvider();
  }
  // Real gateway slot — until SDK adapters land, demo keeps Free/Gold/Premium testable.
  if (name === "moyasar" || name === "stripe" || name === "hyperpay") {
    if (!process.env.PAYMENT_API_KEY) return new DemoPaymentProvider();
    return new DemoPaymentProvider();
  }
  return new DemoPaymentProvider();
}
