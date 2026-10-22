"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function Composer({ patients }: { patients: { id: string; name: string; email: string | null; phone: string | null }[] }) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  async function submit(formData: FormData): Promise<void> {
    setLoading(true);
    setResult(null);
    const payload = {
      patientId: String(formData.get("patientId") ?? ""),
      channel: String(formData.get("channel") ?? "email"),
      message: String(formData.get("message") ?? ""),
      template: String(formData.get("template") ?? "general"),
    };
    const res = await fetch("/api/admin/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { status?: string; reason?: string };
    if (data.status === "SUCCESS") {
      setResult("Success — Communication sent successfully.");
      push("Message sent successfully.", "success");
    } else if (data.status === "NOT_CONFIGURED") {
      setResult(`Not configured — ${data.reason ?? "Provider not configured."}`);
      push("Messaging is not configured in this environment.", "info");
    } else {
      setResult(`Failed — ${data.reason ?? (res.ok ? "Failed" : `HTTP ${res.status}`)}`);
      push(data.reason ?? "The message could not be sent.", "error");
    }
    setLoading(false);
  }

  return (
    <form
      action={async (fd) => submit(fd)}
      className="space-y-4 max-w-xl"
    >
      <label className="block">
        <span className="text-sm">Recipient</span>
        <select name="patientId" required className="cd-input w-full">
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm">Channel</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="channel" value="email" defaultChecked /> Email
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="channel" value="sms" /> SMS
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="channel" value="whatsapp" /> WhatsApp
        </label>
      </fieldset>
      <label className="block">
        <span className="text-sm">Template</span>
        <select name="template" className="cd-input w-full">
          <option value="general">General Patient Message</option>
          <option value="appointment_confirmation">Appointment Confirmation</option>
          <option value="appointment_reminder">Appointment Reminder</option>
          <option value="appointment_cancellation">Appointment Cancellation</option>
          <option value="appointment_rescheduled">Appointment Rescheduled</option>
          <option value="welcome">Welcome</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm">Message</span>
        <textarea name="message" required rows={4} className="cd-input w-full" placeholder="Hi {{patientName}}, ..." />
      </label>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="cd-button cd-button-primary">
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
      {result ? (
        <div role="status" className="cd-muted text-sm">
          {result}
        </div>
      ) : null}
    </form>
  );
}
