import "server-only";
import { prisma } from "@/lib/db";
import { getPaymentProvider, isPaymentsEnabled } from "./provider";
import { writeAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";

const FEE_MAP: Record<string, number> = { CHILD: 400, ADULT: 500, SENIOR: 450 };

export function calculateFee(ageGroup: string): number {
  return FEE_MAP[ageGroup] ?? 500;
}

export async function createPaymentOrder(params: {
  organizationId: string;
  patientId: string;
  appointmentId: string;
  ageGroup: string;
  method: "ONLINE" | "UPI" | "UPI_QR";
  actorId?: string;
}) {
  if (!isPaymentsEnabled()) throw new Error("NOT_CONFIGURED");
  const provider = getPaymentProvider();
  if (!provider.isConfigured()) throw new Error("NOT_CONFIGURED");
  const amount = calculateFee(params.ageGroup);
  const currency = process.env.PAYMENT_CURRENCY ?? "INR";
  // Verify appointment belongs to org/patient and is pending payment (SCHEDULED)
  const appointment = await prisma.appointment.findFirst({ where: { id: params.appointmentId, organizationId: params.organizationId, patientId: params.patientId } });
  if (!appointment) throw new Error("NOT_FOUND");
  if (appointment.status !== "SCHEDULED") throw new Error("CONFLICT");
  // Create pending payment
  const receipt = `rcpt_${params.appointmentId.slice(0, 8)}_${Date.now()}`;
  const order = await provider.createOrder({ amount, currency, receipt, notes: { appointmentId: params.appointmentId } });
  const payment = await prisma.payment.create({
    data: {
      organizationId: params.organizationId,
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      amount: new Prisma.Decimal(amount),
      currency,
      status: "PENDING",
      method: params.method,
      provider: provider.name as never,
      providerOrderId: order.orderId,
    },
  });
  await writeAudit({ organizationId: params.organizationId, actorUserId: params.actorId ?? null, action: "CREATE", resourceType: "Payment", resourceId: payment.id, metadata: { amount, provider: provider.name, orderId: order.orderId } });
  return { payment, order };
}

export async function verifyAndConfirmPayment(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  amount?: number;
  currency?: string;
}) {
  const provider = getPaymentProvider();
  const verify = await provider.verifyPayment({ orderId: params.orderId, paymentId: params.paymentId, signature: params.signature });
  if (!verify.verified) throw new Error("VERIFICATION_FAILED");
  const payment = await prisma.payment.findUnique({ where: { providerOrderId: params.orderId } });
  if (!payment) throw new Error("NOT_FOUND");
  if (params.amount && Number(payment.amount) !== params.amount) throw new Error("AMOUNT_MISMATCH");
  if (params.currency && payment.currency !== params.currency) throw new Error("CURRENCY_MISMATCH");
  // Idempotency: if already PAID, return
  if (payment.status === "PAID") return payment;
  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.update({ where: { id: payment.id }, data: { status: "PAID", providerPaymentId: params.paymentId, paidAt: new Date() } });
    await tx.appointment.update({ where: { id: payment.appointmentId }, data: { status: "CONFIRMED" } });
    return p;
  });
  await writeAudit({ organizationId: payment.organizationId, action: "UPDATE", resourceType: "Payment", resourceId: payment.id, metadata: { status: "PAID" } });
  return updated;
}

export async function handleWebhook(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  status: string;
  amount?: number;
  currency?: string;
}) {
  const payment = await prisma.payment.findUnique({ where: { providerOrderId: params.orderId } });
  if (!payment) throw new Error("NOT_FOUND");
  // Duplicate protection: if already final, ignore
  if (["PAID", "REFUNDED", "CANCELLED"].includes(payment.status)) return payment;
  if (params.status === "captured" || params.status === "PAID") {
    return verifyAndConfirmPayment({ orderId: params.orderId, paymentId: params.paymentId, signature: params.signature, amount: params.amount, currency: params.currency });
  }
  // Failed
  const failed = await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: params.status, providerPaymentId: params.paymentId } });
  await writeAudit({ organizationId: payment.organizationId, action: "UPDATE", resourceType: "Payment", resourceId: payment.id, metadata: { status: "FAILED" } });
  return failed;
}
