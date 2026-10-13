import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAndConfirmPayment } from "@/lib/payments/service";

const schema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
  amount: z.number().optional(),
  currency: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  try {
    const payment = await verifyAndConfirmPayment(parsed.data);
    return NextResponse.json({ status: "PAID", paymentId: payment.id }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "VERIFICATION_FAILED") return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
    if (msg === "AMOUNT_MISMATCH" || msg === "CURRENCY_MISMATCH") return NextResponse.json({ message: msg }, { status: 400 });
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
