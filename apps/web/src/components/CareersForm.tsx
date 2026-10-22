"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { trackEvent } from "@/lib/analytics";

/**
 * Careers application form.
 *
 * Applications use the existing contact delivery endpoint with a clearly
 * labelled message. There is no dedicated careers API yet, so the form only
 * reports success when the server confirms delivery. When mail is not
 * configured, it says so and points applicants to email instead.
 */

const POSITION_GROUPS = [
  {
    label: "Doctors and Dental Professionals",
    options: ["Dentist / Dental Surgeon", "Other qualified dental professional"],
  },
  {
    label: "Dental Support Staff",
    options: ["Dental Assistant", "Chairside Assistant", "Clinic Support Staff"],
  },
  {
    label: "Receptionist and Front Desk",
    options: ["Receptionist", "Front Desk Executive", "Patient Coordination and Appointment Scheduling"],
  },
] as const;

const POSITIONS = POSITION_GROUPS.flatMap(group => [...group.options]);

const LIMITS = {
  fullName: 100,
  phone: 30,
  email: 200,
  qualifications: 300,
  experience: 300,
  message: 900,
} as const;

type FieldName = "fullName" | "phone" | "email" | "position" | "qualifications" | "experience" | "message" | "consent";
type Errors = Partial<Record<FieldName, string>>;
type Outcome = "idle" | "success" | "unavailable" | "error";

interface ApplicationValues {
  fullName: string;
  phone: string;
  email: string;
  position: string;
  qualifications: string;
  experience: string;
  message: string;
  consent: boolean;
}

interface ContactResponse {
  status?: string;
  message?: string;
  reason?: string;
}

export function validateApplication(values: ApplicationValues): Errors {
  const errors: Errors = {};
  const fullName = values.fullName.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();
  const qualifications = values.qualifications.trim();
  const experience = values.experience.trim();
  const message = values.message.trim();

  if (fullName.length < 2) errors.fullName = "Please enter your full name.";
  else if (fullName.length > LIMITS.fullName) errors.fullName = `Please keep your name under ${LIMITS.fullName} characters.`;

  const digits = phone.replace(/\D/g, "");
  if (!phone) errors.phone = "Please enter a phone number.";
  else if (!/^[+()0-9\s.-]+$/.test(phone) || digits.length < 7) errors.phone = "Please enter a valid phone number.";
  else if (phone.length > LIMITS.phone) errors.phone = `Please keep your phone number under ${LIMITS.phone} characters.`;

  if (!email) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > LIMITS.email) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.position) errors.position = "Please select the position you are interested in.";
  else if (!POSITIONS.includes(values.position as (typeof POSITIONS)[number])) errors.position = "Please select a valid position.";

  if (qualifications.length < 2) errors.qualifications = "Please add your relevant qualifications or training.";
  else if (qualifications.length > LIMITS.qualifications) {
    errors.qualifications = `Please keep qualifications under ${LIMITS.qualifications} characters.`;
  }

  if (experience.length > LIMITS.experience) errors.experience = `Please keep experience under ${LIMITS.experience} characters.`;

  if (message.length < 10) errors.message = "Please write a short introduction (at least 10 characters).";
  else if (message.length > LIMITS.message) errors.message = `Please keep your introduction under ${LIMITS.message} characters.`;

  if (!values.consent) errors.consent = "Please confirm that the clinic may process your application.";

  return errors;
}

export function CareersForm() {
  const { push } = useToast();
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const [feedback, setFeedback] = useState("");

  function clearFieldError(event: FormEvent<HTMLFormElement>): void {
    const target = event.target as HTMLInputElement;
    const name = target.name as FieldName;
    if (name && errors[name]) {
      setErrors(current => ({ ...current, [name]: undefined }));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const values: ApplicationValues = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      position: String(formData.get("position") ?? ""),
      qualifications: String(formData.get("qualifications") ?? ""),
      experience: String(formData.get("experience") ?? ""),
      message: String(formData.get("message") ?? ""),
      consent: formData.get("consent") === "yes",
    };

    const nextErrors = validateApplication(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setOutcome("error");
      setFeedback("Please check the highlighted fields and try again.");
      const first = Object.keys(nextErrors)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setSending(true);
    setOutcome("idle");
    setFeedback("");

    const composedMessage = [
      "CAREERS APPLICATION",
      `Position of interest: ${values.position}`,
      `Qualifications: ${values.qualifications.trim()}`,
      `Experience: ${values.experience.trim() || "Not provided"}`,
      "Consent to process application: yes",
      "",
      "Introduction:",
      values.message.trim(),
    ].join("\n");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          message: composedMessage,
          company: String(formData.get("company") ?? ""),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as ContactResponse;

      if (response.ok && data.status === "SUCCESS") {
        form.reset();
        setErrors({});
        setOutcome("success");
        setFeedback(
          "Thank you — your application has been sent to the CityDental team. The clinic will contact you if your application matches an approved role."
        );
        push("Your application has been sent.", "success");
        trackEvent("careers_application_submit", { result: "success" });
        return;
      }

      if (response.status === 503 || data.status === "NOT_CONFIGURED") {
        setOutcome("unavailable");
        setFeedback(
          "Online applications are not connected yet. Please email your CV and a short introduction to citydentalEtah@gmail.com, or call +91 94151 92948."
        );
        push("Online applications aren't connected yet. Please email the clinic.", "error");
        trackEvent("careers_application_submit", { result: "not_configured" });
        return;
      }

      setOutcome("error");
      setFeedback(data.reason ?? "Your application could not be sent. Please try again or email the clinic.");
      push(data.reason ?? "Your application could not be sent. Please try again or email the clinic.", "error");
      trackEvent("careers_application_submit", { result: data.status ?? `http_${response.status}` });
    } catch {
      setOutcome("error");
      setFeedback("Your application could not be sent. Check your connection or email the clinic directly.");
      push("Your application could not be sent. Please try again or email the clinic.", "error");
      trackEvent("careers_application_submit", { result: "network_error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="cd-contact-form careers-form" onSubmit={submit} onChange={clearFieldError} noValidate>
      <p className="cd-form-note">Fields marked * are required. We use these details only to review your application.</p>

      <div className="cd-field-row">
        <div className="cd-field">
          <label htmlFor="careers-fullName">Full name *</label>
          <input
            id="careers-fullName"
            name="fullName"
            type="text"
            required
            maxLength={LIMITS.fullName}
            autoComplete="name"
            className="cd-input"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? "careers-fullName-error" : undefined}
          />
          {errors.fullName ? <p id="careers-fullName-error" className="cd-error-text text-xs">{errors.fullName}</p> : null}
        </div>
        <div className="cd-field">
          <label htmlFor="careers-phone">Phone number *</label>
          <input
            id="careers-phone"
            name="phone"
            type="tel"
            required
            maxLength={LIMITS.phone}
            autoComplete="tel"
            inputMode="tel"
            className="cd-input"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "careers-phone-error" : undefined}
          />
          {errors.phone ? <p id="careers-phone-error" className="cd-error-text text-xs">{errors.phone}</p> : null}
        </div>
      </div>

      <div className="cd-field-row">
        <div className="cd-field">
          <label htmlFor="careers-email">Email address *</label>
          <input
            id="careers-email"
            name="email"
            type="email"
            required
            maxLength={LIMITS.email}
            autoComplete="email"
            className="cd-input"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "careers-email-error" : undefined}
          />
          {errors.email ? <p id="careers-email-error" className="cd-error-text text-xs">{errors.email}</p> : null}
        </div>
        <div className="cd-field">
          <label htmlFor="careers-position">Position of interest *</label>
          <select
            id="careers-position"
            name="position"
            required
            defaultValue=""
            className="cd-input"
            aria-invalid={errors.position ? true : undefined}
            aria-describedby={errors.position ? "careers-position-error" : undefined}
          >
            <option value="">Select a position</option>
            {POSITION_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.position ? <p id="careers-position-error" className="cd-error-text text-xs">{errors.position}</p> : null}
        </div>
      </div>

      <div className="cd-field">
        <label htmlFor="careers-qualifications">Relevant qualifications *</label>
        <textarea
          id="careers-qualifications"
          name="qualifications"
          required
          rows={3}
          maxLength={LIMITS.qualifications}
          className="cd-input"
          aria-invalid={errors.qualifications ? true : undefined}
          aria-describedby={errors.qualifications ? "careers-qualifications-error" : "careers-qualifications-hint"}
        />
        <p id="careers-qualifications-hint" className="cd-form-note">Qualifications, training or certifications relevant to the role.</p>
        {errors.qualifications ? <p id="careers-qualifications-error" className="cd-error-text text-xs">{errors.qualifications}</p> : null}
      </div>

      <div className="cd-field">
        <label htmlFor="careers-experience">Experience (optional)</label>
        <textarea
          id="careers-experience"
          name="experience"
          rows={2}
          maxLength={LIMITS.experience}
          className="cd-input"
          aria-invalid={errors.experience ? true : undefined}
          aria-describedby={errors.experience ? "careers-experience-error" : "careers-experience-hint"}
        />
        <p id="careers-experience-hint" className="cd-form-note">Share relevant experience only if you have it. This is not a requirement.</p>
        {errors.experience ? <p id="careers-experience-error" className="cd-error-text text-xs">{errors.experience}</p> : null}
      </div>

      <div className="cd-field">
        <label htmlFor="careers-message">Short introduction *</label>
        <textarea
          id="careers-message"
          name="message"
          required
          rows={5}
          maxLength={LIMITS.message}
          className="cd-input"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "careers-message-error" : "careers-message-hint"}
        />
        <p id="careers-message-hint" className="cd-form-note">Tell us briefly why you would like to join City Dental.</p>
        {errors.message ? <p id="careers-message-error" className="cd-error-text text-xs">{errors.message}</p> : null}
      </div>

      <div className="cd-honeypot" aria-hidden="true">
        <label htmlFor="careers-company">Company</label>
        <input id="careers-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="cd-field careers-consent">
        <label htmlFor="careers-consent">
          <input
            id="careers-consent"
            name="consent"
            type="checkbox"
            value="yes"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "careers-consent-error" : undefined}
          />
          <span>
            I consent to CityDental using the details in this application to review my suitability for the selected
            role. *
          </span>
        </label>
        {errors.consent ? <p id="careers-consent-error" className="cd-error-text text-xs">{errors.consent}</p> : null}
      </div>

      {feedback ? (
        <div
          className={`careers-feedback careers-feedback-${outcome}`}
          role={outcome === "success" ? "status" : "alert"}
        >
          {feedback}
        </div>
      ) : null}

      <div>
        <button type="submit" className="cd-button cd-button-primary" disabled={sending}>
          {sending ? "Sending…" : "Submit application"}
        </button>
      </div>

      <p className="cd-form-note">
        Resume upload is not available online yet. After submitting, you can email your CV to
        {" "}<a href="mailto:citydentalEtah@gmail.com">citydentalEtah@gmail.com</a> with the subject
        {" "}&ldquo;Careers — your name&rdquo;. Submitting an application does not guarantee an interview or position.
      </p>
    </form>
  );
}
