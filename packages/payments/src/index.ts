export type PaymentMethod = "cash" | "card" | "bank_transfer" | "other";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded" | "partially_refunded";

export interface PaymentRequest {
  orderId: string;
  amount: string;
  method: PaymentMethod;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  provider: string;
  status: PaymentStatus;
  providerReference?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(request: PaymentRequest): Promise<PaymentResult>;
  refundPayment(input: { orderId: string; amount: string; providerReference?: string | null; idempotencyKey?: string | null }): Promise<PaymentResult>;
}

export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";
  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    return { provider: this.name, status: "paid", providerReference: request.idempotencyKey ?? undefined };
  }
  async refundPayment(input: { orderId: string; amount: string; providerReference?: string | null; idempotencyKey?: string | null }): Promise<PaymentResult> {
    return { provider: this.name, status: "refunded", providerReference: input.providerReference ?? input.idempotencyKey ?? undefined };
  }
}

export function getPaymentProvider(name = "manual"): PaymentProvider {
  if (name === "manual") return new ManualPaymentProvider();
  throw new Error(`Unsupported payment provider: ${name}`);
}