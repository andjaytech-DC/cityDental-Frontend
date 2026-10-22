"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { trackEvent } from "@/lib/analytics";

interface ContactResponse {
  status?: string;
  message?: string;
  reason?: string;
  fields?: Record<string, string[] | undefined>;
}

/**
 * Optional contact form. Delivery is server-side only; failures are reported
 * honestly instead of being shown as success.
 */
export function ContactForm() {
  const { push } = useToast();
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSending(true);
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          message: String(formData.get("message") ?? ""),
          company: String(formData.get("company") ?? ""),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as ContactResponse;

      if (response.ok && data.status === "SUCCESS") {
        form.reset();
        push(data.message ?? "Your message has been sent.", "success");
        trackEvent("contact_form_submit", { result: "success" });
        return;
      }

      if (data.fields) setFieldErrors(data.fields);
      push(data.reason ?? "The message could not be sent. Please try again or call the clinic.", "error");
      trackEvent("contact_form_submit", { result: data.status ?? `http_${response.status}` });
    } catch {
      push("The message could not be sent. Check your connection or call the clinic.", "error");
      trackEvent("contact_form_submit", { result: "network_error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="cd-contact-form" onSubmit={submit} noValidate={false}>
      <div className="cd-field-row">
        <div className="cd-field">
          <label htmlFor="contact-name">Your name *</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className="cd-input"
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
            aria-invalid={fieldErrors.name ? true : undefined}
          />
          {fieldErrors.name ? <p id="contact-name-error" className="cd-error-text text-xs">{fieldErrors.name[0]}</p> : null}
        </div>
        <div className="cd-field">
          <label htmlFor="contact-email">Email *</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            className="cd-input"
            aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
            aria-invalid={fieldErrors.email ? true : undefined}
          />
          {fieldErrors.email ? <p id="contact-email-error" className="cd-error-text text-xs">{fieldErrors.email[0]}</p> : null}
        </div>
      </div>

      <div className="cd-field">
        <label htmlFor="contact-phone">Phone (optional)</label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          className="cd-input"
          aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined}
          aria-invalid={fieldErrors.phone ? true : undefined}
        />
        {fieldErrors.phone ? <p id="contact-phone-error" className="cd-error-text text-xs">{fieldErrors.phone[0]}</p> : null}
      </div>

      <div className="cd-field">
        <label htmlFor="contact-message">How can we help? *</label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="cd-input"
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          aria-invalid={fieldErrors.message ? true : undefined}
        />
        {fieldErrors.message ? <p id="contact-message-error" className="cd-error-text text-xs">{fieldErrors.message[0]}</p> : null}
      </div>

      <div className="cd-honeypot" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <button type="submit" className="cd-button cd-button-primary" disabled={sending}>
          {sending ? "Sending…" : "Send message"}
        </button>
      </div>

      <p className="cd-form-note">
        Please do not include medical records or sensitive health details in this form. For urgent concerns, call the clinic.
      </p>
    </form>
  );
}
