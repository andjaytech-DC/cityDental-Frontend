import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/payments/service";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  const { orderId, paymentId, signature, status, amount, currency } = body as { orderId?: string; paymentId?: string; signature?: string; status?: string; amount?: number; currency?: string };
  if (!orderId || !paymentId || !signature) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

  // Idempotency: if payment already has same providerPaymentId, return early
  const existing = await prisma.payment.findFirst({ where: { providerPaymentId: paymentId } });
  if (existing) return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });

  try {
    const payment = await handleWebhook({ orderId, paymentId, signature, status: status ?? "captured", amount, currency });
    await writeAudit({ organizationId: payment.organizationId, action: "UPDATE", resourceType: "Payment", resourceId: payment.id, metadata: { webhook: status } });
    return NextResponse.json({ ok: true, status: payment.status }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
