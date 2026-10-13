"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPatientSchema, updatePatientSchema, type CreatePatientInput, type UpdatePatientInput } from "@citydental/validation";
import { ApiError } from "@/lib/api";
import { Badge, Button, ErrorState, Input } from "@/components/ui";

type PatientFormProps = {
  mode: "create";
  initialValues?: CreatePatientInput;
  onSave?: (values: CreatePatientInput) => Promise<void>;
} | {
  mode: "update";
  initialValues: UpdatePatientInput;
  onSave?: (values: UpdatePatientInput) => Promise<void>;
};

export function patientSaveError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "The server did not allow this change. Check your access with your administrator.";
    if (error.status === 409) return "The record could not be saved because it conflicts with existing data. Review the details and try again.";
    if (error.status === 404 || error.status >= 500) return "Patient saving is unavailable. Your changes have not been saved.";
  }
  return "The save could not be confirmed. Check your connection and review the record before retrying.";
}

/** Future onSave implementations must call the existing API client, not fetch/Prisma. */
export function PatientForm(props: PatientFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UpdatePatientInput>({
    resolver: zodResolver(props.mode === "create" ? createPatientSchema : updatePatientSchema),
    defaultValues: props.initialValues ?? {},
  });
  const optional = { setValueAs: (value: string) => value === "" ? undefined : value };
  const submit = handleSubmit(async values => {
    setMessage(null);
    setServerError(null);
    if (!props.onSave) {
      setMessage("Validation complete. The patient API is not connected; nothing has been saved. Details remain only in this form until you leave or reset it.");
    } else {
      try {
        if (props.mode === "create") await props.onSave(createPatientSchema.parse(values));
        else await props.onSave(updatePatientSchema.parse(values));
        reset(values);
        setMessage("Patient details saved.");
      } catch (error: unknown) {
        setServerError(patientSaveError(error));
      }
    }
    requestAnimationFrame(() => feedback.current?.focus());
  });
  return <form noValidate onSubmit={submit} aria-label={props.mode === "create" ? "Patient details" : "Update patient details"} className="space-y-5">
    {!props.onSave ? <Badge variant="warning">Contract-ready · Saving unavailable</Badge> : null}
    <p className="cd-muted text-sm">{props.mode === "create" ? "First and last names are required. Other fields are optional." : "Only supplied fields are submitted. Clearing a field omits it; it does not delete the stored value."}</p>
    <div ref={feedback} tabIndex={-1}>
      {message ? <p role="status">{message}</p> : null}
      {serverError ? <ErrorState title="Patient details were not saved" description={serverError} /> : null}
    </div>
    <fieldset disabled={isSubmitting} className="min-w-0 grid gap-5 md:grid-cols-2">
      <Input label="First name" required={props.mode === "create"} autoComplete="off" {...register("firstName", optional)} error={errors.firstName?.message} />
      <Input label="Last name" required={props.mode === "create"} autoComplete="off" {...register("lastName", optional)} error={errors.lastName?.message} />
      <Input label="Patient number" {...register("patientNumber", optional)} error={errors.patientNumber?.message} />
      <Input label="Date of birth" type="date" {...register("dateOfBirth", optional)} error={errors.dateOfBirth?.message} />
      <Input label="Email" type="email" autoComplete="off" {...register("email", optional)} error={errors.email?.message} />
      <Input label="Phone" type="tel" autoComplete="off" {...register("phone", optional)} error={errors.phone?.message} />
      <Input label="Address" {...register("addressLine1", optional)} error={errors.addressLine1?.message} />
      <Input label="City" {...register("city", optional)} error={errors.city?.message} />
      <Input label="State" {...register("state", optional)} error={errors.state?.message} />
      <Input label="Postal code" {...register("postalCode", optional)} error={errors.postalCode?.message} />
    </fieldset>
    <p className="cd-muted text-sm">Location selection is unavailable until a location lookup API is connected. No location has been selected by this page.</p>
    <div className="flex flex-wrap gap-3">
      <Button type="submit" isLoading={isSubmitting}>{isSubmitting ? "Saving…" : props.onSave ? "Save patient details" : "Check details (no save)"}</Button>
      <Button variant="secondary" disabled={isSubmitting} onClick={() => { reset(props.initialValues ?? {}); setMessage(null); setServerError(null); }}>Reset form</Button>
    </div>
  </form>;
}
