export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type LocalAccessStatus =
  | "unknown"
  | "checkout-created"
  | "checkout-completed"
  | "granted"
  | "revoked";

export interface CheckoutRecord {
  requestId: string;
  checkoutId: string;
  checkoutUrl: string;
  productId: string;
  customerEmail: string | null;
  createdAt: string;
  status: string;
}

export interface SuccessRecord {
  seenAt: string;
  params: Record<string, string>;
}

export interface WebhookEventRecord {
  webhookId: string;
  eventName: string;
  seenAt: string;
  customerEmail: string | null;
  productId: string | null;
  subscriptionId: string | null;
  transactionId: string | null;
  status: string | null;
  payload: unknown;
}

export interface AppState {
  localAccessStatus: LocalAccessStatus;
  lastCheckout: CheckoutRecord | null;
  lastSuccess: SuccessRecord | null;
  lastWebhook: WebhookEventRecord | null;
  lastUpdatedAt: string;
}

export interface CheckoutRequestBody {
  email?: string;
  productId?: string;
  units?: number;
}

export interface RuntimeConfig {
  apiKey: string | null;
  webhookSecret: string | null;
  productId: string | null;
  testCustomerEmail: string | null;
  appUrl: string;
  demoUserId: string;
  port: number;
  testMode: boolean;
}

