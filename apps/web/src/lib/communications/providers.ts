import "server-only";

export type ProviderResult =
  | { status: "SUCCESS"; providerMessageId?: string }
  | { status: "FAILED"; reason: string }
  | { status: "NOT_CONFIGURED"; reason: string };

export interface CommunicationProvider {
  channel: "email" | "sms" | "whatsapp";
  send(params: { to: string; subject?: string; message: string }): Promise<ProviderResult>;
  isConfigured(): boolean;
}

function envEnabled(): boolean {
  return process.env.COMMUNICATIONS_ENABLED === "true";
}

// Email via SMTP (nodemailer). If not configured, returns NOT_CONFIGURED. Validates connection with timeout.
class EmailProvider implements CommunicationProvider {
  channel: "email" | "sms" | "whatsapp" = "email";
  isConfigured(): boolean {
    return !!process.env.SMTP_HOST && !!process.env.SMTP_FROM && envEnabled();
  }
  async send(params: { to: string; subject?: string; message: string }): Promise<ProviderResult> {
    if (!this.isConfigured()) return { status: "NOT_CONFIGURED", reason: "Email provider not configured (SMTP_HOST/SMTP_FROM or COMMUNICATIONS_ENABLED=false)." };
    const host = process.env.SMTP_HOST as string;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM as string;
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });
      await transporter.verify().catch(() => {
        // verify failure will be caught on send
      });
      const info = await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject ?? "CityDental Notification",
        text: params.message,
        html: `<p>${params.message.replaceAll("\n", "<br/>")}</p>`,
      });
      const id = (info as { messageId?: string }).messageId ?? undefined;
      return { status: "SUCCESS", providerMessageId: id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // never expose credentials
      return { status: "FAILED", reason: `Email failed: ${msg.slice(0, 200)}` };
    }
  }
}

function validatePhone(phone: string): boolean {
  return /^[0-9+()\-\s]{6,20}$/.test(phone);
}

class SmsProvider implements CommunicationProvider {
  channel: "email" | "sms" | "whatsapp" = "sms";
  isConfigured(): boolean {
    return !!process.env.SMS_PROVIDER && !!process.env.SMS_API_KEY && envEnabled();
  }
  async send(params: { to: string; message: string }): Promise<ProviderResult> {
    if (!this.isConfigured()) return { status: "NOT_CONFIGURED", reason: "SMS provider not configured (SMS_PROVIDER/SMS_API_KEY or COMMUNICATIONS_ENABLED=false)." };
    if (!validatePhone(params.to)) return { status: "FAILED", reason: "Invalid phone number" };
    const provider = process.env.SMS_PROVIDER as string;
    try {
      // Adapter contract: if real provider SDK is installed, call it here.
      // For now, return FAILED to avoid faking success until provider is wired.
      // Example: if provider === "twilio", use Twilio SDK with SMS_API_KEY/SMS_API_SECRET/SMS_FROM
      return { status: "FAILED", reason: `SMS provider ${provider} integration not yet implemented — no message was sent.` };
    } catch (e) {
      return { status: "FAILED", reason: e instanceof Error ? e.message : String(e) };
    }
  }
}

class WhatsappProvider implements CommunicationProvider {
  channel: "email" | "sms" | "whatsapp" = "whatsapp";
  isConfigured(): boolean {
    return !!process.env.WHATSAPP_PROVIDER && !!process.env.WHATSAPP_API_KEY && envEnabled();
  }
  async send(params: { to: string; message: string }): Promise<ProviderResult> {
    if (!this.isConfigured()) return { status: "NOT_CONFIGURED", reason: "WhatsApp provider not configured (WHATSAPP_PROVIDER/WHATSAPP_API_KEY or COMMUNICATIONS_ENABLED=false)." };
    if (!validatePhone(params.to)) return { status: "FAILED", reason: "Invalid WhatsApp number" };
    const provider = process.env.WHATSAPP_PROVIDER as string;
    try {
      return { status: "FAILED", reason: `WhatsApp provider ${provider} integration not yet implemented — no message was sent.` };
    } catch (e) {
      return { status: "FAILED", reason: e instanceof Error ? e.message : String(e) };
    }
  }
}

export function getProvider(channel: "email" | "sms" | "whatsapp"): CommunicationProvider {
  if (channel === "email") return new EmailProvider();
  if (channel === "sms") return new SmsProvider();
  return new WhatsappProvider();
}

export function getAllProviderStatus(): Record<string, "CONFIGURED" | "NOT_CONFIGURED"> {
  return {
    email: new EmailProvider().isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED",
    sms: new SmsProvider().isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED",
    whatsapp: new WhatsappProvider().isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED",
  };
}
