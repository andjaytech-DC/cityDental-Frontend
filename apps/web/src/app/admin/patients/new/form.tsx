"use client";
import { useFormState, useFormStatus } from "react-dom";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="cd-button cd-button-primary">
      {pending ? "Saving…" : "Create patient"}
    </button>
  );
}

export function CreatePatientForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-serif">New patient</h1>
      <p className="cd-muted text-sm">First and last names are required. Other fields validated server-side via shared Zod.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm">First name *</span>
          <input name="firstName" required className="cd-input w-full" autoComplete="off" />
        </label>
        <label className="block">
          <span className="text-sm">Last name *</span>
          <input name="lastName" required className="cd-input w-full" autoComplete="off" />
        </label>
        <label className="block">
          <span className="text-sm">Phone</span>
          <input name="phone" className="cd-input w-full" type="tel" />
        </label>
        <label className="block">
          <span className="text-sm">Email</span>
          <input name="email" className="cd-input w-full" type="email" />
        </label>
        <label className="block">
          <span className="text-sm">City</span>
          <input name="city" className="cd-input w-full" />
        </label>
        <label className="block">
          <span className="text-sm">Patient number</span>
          <input name="patientNumber" className="cd-input w-full" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm">Address</span>
          <input name="addressLine1" className="cd-input w-full" />
        </label>
      </div>
      <Submit />
    </form>
  );
}
