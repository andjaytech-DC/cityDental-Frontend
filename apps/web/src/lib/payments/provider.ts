import "server-only";

export type PaymentStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "ONLINE" | "UPI" | "UPI_QR";
export type PaymentProviderName = "RAZORPAY" | "STRIPE" | "PHONEPE" | "CASHFREE" | "PAYU" | "MOCK";

export interface PaymentOrder {
  orderId: string;
  amount: number; // in INR paise? but Decimal stored as INR
  currency: string;
  checkoutUrl?: string;
  qrCode?: string; // data URI or UPI string
  provider: PaymentProviderName;
  metadata?: Record<string, string>;
}

export interface VerifyResult {
  verified: boolean;
  providerPaymentId?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
}

export interface PaymentProvider {
  name: PaymentProviderName;
  isConfigured(): boolean;
  createOrder(params: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }): Promise<PaymentOrder>;
  verifyPayment(params: { orderId: string; paymentId: string; signature: string }): Promise<VerifyResult>;
  getPaymentStatus(orderId: string): Promise<PaymentStatus>;
  refundPayment(paymentId: string, amount?: number): Promise<VerifyResult>;
}

function envEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === "true";
}

class MockProvider implements PaymentProvider {
  name: PaymentProviderName = "MOCK";
  isConfigured(): boolean { return envEnabled() && !!process.env.PAYMENT_PROVIDER; }
  async createOrder(params: { amount: number; currency: string; receipt: string }): Promise<PaymentOrder> {
    if (!this.isConfigured()) throw new Error("NOT_CONFIGURED");
    // In mock, we don't actually call provider — return fake order with QR for UPI
    const orderId = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const upiString = `upi://pay?pa=citydental@upi&pn=CityDental&am=${params.amount}&cu=${params.currency}&tr=${orderId}`;
    // Generate QR as data URI placeholder (not fake success — just order creation, payment still PENDING)
    return { orderId, amount: params.amount, currency: params.currency, provider: "MOCK", qrCode: upiString, metadata: { receipt: params.receipt } };
  }
  async verifyPayment(): Promise<VerifyResult> { return { verified: false, failureReason: "Mock verify not implemented" }; }
  async getPaymentStatus(): Promise<PaymentStatus> { return "PENDING"; }
  async refundPayment(): Promise<VerifyResult> { return { verified: false, failureReason: "Mock refund not implemented" }; }
}

class RazorpayProvider implements PaymentProvider {
  name: PaymentProviderName = "RAZORPAY";
  isConfigured(): boolean { return envEnabled() && process.env.PAYMENT_PROVIDER === "RAZORPAY" && !!process.env.PAYMENT_KEY_ID && !!process.env.PAYMENT_KEY_SECRET; }
  async createOrder(params: { amount: number; currency: string; receipt: string }): Promise<PaymentOrder> {
    if (!this.isConfigured()) throw new Error("NOT_CONFIGURED");
    // Real implementation would use razorpay SDK: new Razorpay({key_id, key_secret}).orders.create({amount: amount*100, currency, receipt})
    // For now, return mock order but mark provider as RAZORPAY — verification via webhook signature will be real when credentials present
    const orderId = `order_rzp_${Date.now()}`;
    return { orderId, amount: params.amount, currency: params.currency, provider: "RAZORPAY", checkoutUrl: `https://checkout.razorpay.com/v1/checkout.html?order_id=${orderId}`, metadata: { receipt: params.receipt } };
  }
  async verifyPayment(params: { orderId: string; paymentId: string; signature: string }): Promise<VerifyResult> {
    try {
      const crypto = await import("crypto");
      const expected = crypto.createHmac("sha256", process.env.PAYMENT_KEY_SECRET as string).update(`${params.orderId}|${params.paymentId}`).digest("hex");
      const verified = expected === params.signature;
      return verified ? { verified: true, providerPaymentId: params.paymentId } : { verified: false, failureReason: "Invalid signature" };
    } catch (e) { return { verified: false, failureReason: String(e) }; }
  }
  async getPaymentStatus(): Promise<PaymentStatus> { return "PENDING"; }
  async refundPayment(): Promise<VerifyResult> { return { verified: false, failureReason: "Not implemented" }; }
}

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER ?? "MOCK").toUpperCase() as PaymentProviderName;
  if (name === "RAZORPAY") return new RazorpayProvider();
  // Extend for STRIPE, PHONEPE etc. when configured
  return new MockProvider();
}

export function isPaymentsEnabled(): boolean { return envEnabled(); }
export function getPaymentStatusConfig(): { enabled: boolean; provider: string; currency: string } {
  return { enabled: isPaymentsEnabled(), provider: process.env.PAYMENT_PROVIDER ?? "NOT_CONFIGURED", currency: process.env.PAYMENT_CURRENCY ?? "INR" };
}
