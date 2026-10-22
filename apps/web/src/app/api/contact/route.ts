import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/communications/providers";

export const runtime = "nodejs";

/**
 * Public contact form -> SMTP notification to the practice.
 *
 * Truthful behaviour: when SMTP is not configured the route returns 503 and
 * says so. It never reports a delivered message it did not send.
 */
const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please include a little more detail.").max(2000),
  // Honeypot: real users never fill this hidden field.
  company: z.string().max(0).optional().or(z.literal("")),
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/** Strip angle brackets so submitted text cannot inject markup into the email HTML. */
function sanitize(value: string): string {
  return value.replace(/[<>]/g, "").replace(/\r\n/g, "\n").trim();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { status: "FAILED", reason: "Too many messages. Please try again later or call the clinic." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "FAILED", reason: "Invalid request." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "FAILED",
        reason: "Please check the highlighted fields.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Silently discard honeypot submissions: bots get no signal, no mail is sent.
  if (parsed.data.company) {
    return NextResponse.json({ status: "IGNORED" }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const to = process.env.CONTACT_TO_EMAIL ?? process.env.SMTP_FROM;
  const provider = getProvider("email");
  if (!to || !provider.isConfigured()) {
    return NextResponse.json(
      {
        status: "NOT_CONFIGURED",
        reason: "Message delivery is not configured yet. Please call or email the clinic using the details on this page.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { name, email, phone, message } = parsed.data;
  const composed = [
    "New website enquiry",
    `Name: ${sanitize(name)}`,
    `Email: ${sanitize(email)}`,
    `Phone: ${phone ? sanitize(phone) : "not provided"}`,
    "",
    sanitize(message),
  ].join("\n");

  const result = await provider.send({
    to,
    subject: `Website enquiry from ${sanitize(name)}`,
    message: composed,
  });

  if (result.status === "SUCCESS") {
    return NextResponse.json(
      { status: "SUCCESS", message: "Thank you — your message has been sent. We will reply as soon as we can." },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      status: result.status,
      reason:
        result.status === "NOT_CONFIGURED"
          ? "Message delivery is not configured yet. Please call or email the clinic."
          : "The message could not be sent. Please try again or call the clinic.",
    },
    { status: result.status === "NOT_CONFIGURED" ? 503 : 502, headers: { "Cache-Control": "no-store" } }
  );
}
