export const TEMPLATES = {
  appointment_confirmation: {
    name: "Appointment Confirmation",
    subject: "Appointment confirmed — {{clinicName}}",
    body: "Hi {{patientName}}, your appointment with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}} at {{clinicName}} ({{clinicPhone}}) is confirmed.",
  },
  appointment_reminder: {
    name: "Appointment Reminder",
    subject: "Reminder — {{clinicName}}",
    body: "Hi {{patientName}}, reminder for your appointment on {{appointmentDate}} at {{appointmentTime}} with {{doctorName}} at {{clinicName}}.",
  },
  appointment_cancellation: {
    name: "Appointment Cancellation",
    subject: "Appointment cancelled — {{clinicName}}",
    body: "Hi {{patientName}}, your appointment on {{appointmentDate}} at {{appointmentTime}} has been cancelled. Call {{clinicPhone}} for assistance.",
  },
  appointment_rescheduled: {
    name: "Appointment Rescheduled",
    subject: "Appointment rescheduled — {{clinicName}}",
    body: "Hi {{patientName}}, your appointment has been rescheduled to {{appointmentDate}} at {{appointmentTime}} with {{doctorName}}.",
  },
  welcome: {
    name: "Welcome",
    subject: "Welcome to {{clinicName}}",
    body: "Hi {{patientName}}, welcome to {{clinicName}}. We're here for your care.",
  },
  general: {
    name: "General Patient Message",
    subject: "{{clinicName}} — Message",
    body: "Hi {{patientName}}, {{customMessage}}",
  },
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

const ALLOWED_VARS = new Set(["patientName", "doctorName", "appointmentDate", "appointmentTime", "clinicName", "clinicPhone", "customMessage"]);

export function renderTemplate(key: TemplateKey, vars: Record<string, string>): { subject: string; body: string } {
  const t = TEMPLATES[key];
  if (!t) throw new Error("UNKNOWN_TEMPLATE");
  // validate vars keys are allowed and escape HTML
  for (const k of Object.keys(vars)) if (!ALLOWED_VARS.has(k)) throw new Error(`Invalid variable ${k}`);
  const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  let subject: string = t.subject;
  let body: string = t.body;
  for (const [k, v] of Object.entries(vars)) {
    const safe = esc(v);
    subject = subject.replaceAll(`{{${k}}}`, safe) as string;
    body = body.replaceAll(`{{${k}}}`, safe) as string;
  }
  // leave unresolved placeholders as empty
  subject = subject.replaceAll(/\{\{[^}]+\}\}/g, "") as string;
  body = body.replaceAll(/\{\{[^}]+\}\}/g, "") as string;
  return { subject, body };
}
