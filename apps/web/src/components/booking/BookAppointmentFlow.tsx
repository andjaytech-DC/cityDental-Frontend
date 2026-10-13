"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPatientSchema, type CreatePatientInput } from "@citydental/validation";
import { Badge, Button, EmptyState, PageHeading, Input } from "@/components/ui";

type FlowStep = "choose" | "returning" | "new-form" | "review" | "final";

const stepLabel = (step: FlowStep): string => {
  if (step === "choose") return "Step 1 of 3";
  if (step === "returning" || step === "new-form") return "Step 2 of 3";
  if (step === "review") return "Step 3 of 3";
  return "";
};

/**
 * Presentation-only patient booking entry flow.
 *
 * No patient lookup, availability, or booking endpoint exists.
 * All patient information stays in React component state for the
 * active page session only and is never persisted in browser storage.
 *
 * Future integration: Next.js booking UI → API client → NestJS
 * appointment/availability service → Prisma/PostgreSQL.
 */
export function BookAppointmentFlow() {
  const [step, setStep] = useState<FlowStep>("choose");
  const [patientType, setPatientType] = useState<"returning" | "new" | null>(null);
  const [patientData, setPatientData] = useState<CreatePatientInput | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {},
  });

  const isReturning = step === "returning";
  const isNewForm = step === "new-form";
  const isReview = step === "review";
  const isFinal = step === "final";

  const goBack = () => {
    if (isReview) {
      reset(patientData ?? {});
      setStep("new-form");
    } else if (isNewForm || isReturning) {
      setStep("choose");
      setPatientType(null);
      setPatientData(null);
      reset({});
    } else {
      setStep("choose");
    }
  };

  const startOver = () => {
    setStep("choose");
    setPatientType(null);
    setPatientData(null);
    reset({});
  };

  const selectPatientType = (type: "returning" | "new") => {
    setPatientType(type);
    if (type === "returning") {
      setStep("returning");
    } else {
      setStep("new-form");
    }
  };

  const onFormSubmit = handleSubmit((values: CreatePatientInput) => {
    const parsed = createPatientSchema.safeParse(values);
    if (parsed.success) {
      setPatientData(parsed.data);
      setStep("review");
    }
  });

  const submitFinal = () => {
    setStep("final");
  };

  return (
    <div className="booking-flow">
      <PageHeading
        title="Book an appointment"
        description="A thoughtful beginning — no information is submitted or stored."
      />
      <div tabIndex={-1} className="booking-step">
        {(isNewForm || isReview || isReturning) ? (
          <p className="eyebrow"><span className="eyebrow-line" /> {stepLabel(step)}</p>
        ) : null}

        {step === "choose" ? (
          <>
            <p className="eyebrow"><span className="eyebrow-line" /> Appointments</p>
            <h2>Have you visited CityDental before?</h2>
            <p className="cd-muted booking-intro">This helps us point you to the right next step.</p>
            <fieldset className="booking-choices">
              <legend className="sr-only">Have you visited CityDental before?</legend>
              <button type="button" className="booking-choice" onClick={() => selectPatientType("returning")}>
                <span className="choice-title">I&#39;ve visited CityDental before</span>
                <span className="choice-sub">I&#39;m a returning patient</span>
              </button>
              <button type="button" className="booking-choice" onClick={() => selectPatientType("new")}>
                <span className="choice-title">I&#39;m a new patient</span>
                <span className="choice-sub">I&#39;m visiting CityDental for the first time</span>
              </button>
            </fieldset>
          </>
        ) : null}

        {isReturning ? (
          <>
            <Badge variant="warning">Contract-ready · Patient lookup not connected</Badge>
            <h2>Returning patient</h2>
            <EmptyState
              title="Returning-patient access is not connected yet"
              description="Identifying an existing patient requires a secure lookup with the practice's systems, which is not available on this website. No information has been requested or verified. Please contact the practice to arrange your visit."
            />
            <div className="booking-actions">
              <Button variant="secondary" onClick={goBack}>← Back</Button>
              <Button variant="ghost" onClick={startOver}>Start over</Button>
              <Link href="/" className="cd-button cd-button-ghost">Back to home</Link>
            </div>
          </>
        ) : null}

        {isNewForm ? (
          <>
            <Badge variant="warning">Contract-ready · Saving unavailable</Badge>
            <h2>New patient</h2>
            <p className="cd-muted booking-intro">
              Complete your details below. Field validation uses the practice&#39;s existing patient contract, but nothing is submitted or saved — online booking is not connected.
            </p>
            <form noValidate onSubmit={onFormSubmit} className="booking-form space-y-5" aria-label="Patient details">
              <div className="min-w-0 grid gap-5 md:grid-cols-2">
                <Input label="First name" required autoComplete="off" {...register("firstName")} error={errors.firstName?.message} />
                <Input label="Last name" required autoComplete="off" {...register("lastName")} error={errors.lastName?.message} />
                <Input label="Date of birth" type="date" {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
                <Input label="Email" type="email" autoComplete="off" {...register("email")} error={errors.email?.message} />
                <Input label="Phone" type="tel" autoComplete="off" {...register("phone")} error={errors.phone?.message} />
                <Input label="Address" {...register("addressLine1")} error={errors.addressLine1?.message} />
                <Input label="City" {...register("city")} error={errors.city?.message} />
                <Input label="State" {...register("state")} error={errors.state?.message} />
                <Input label="Postal code" {...register("postalCode")} error={errors.postalCode?.message} />
              </div>
              <p className="cd-muted text-sm">Location selection is unavailable until a location lookup API is connected. No location has been selected.</p>
              <div className="booking-actions">
                <Button type="submit" isLoading={isSubmitting}>Check details (no save)</Button>
                <Button variant="secondary" type="button" onClick={() => { reset({}); }}>Reset form</Button>
                <Button variant="ghost" type="button" onClick={goBack}>← Back</Button>
              </div>
            </form>
          </>
        ) : null}

        {isReview && patientData ? (
          <>
            <Badge variant="info">Review your details</Badge>
            <h2>Review your information</h2>
            <p className="cd-muted booking-intro">Please confirm the details below before proceeding.</p>
            <div className="cd-card" style={{ marginTop: "1.5rem" }}>
              <div className="cd-card-body">
                <dl className="profile-grid profile-fields">
                  <dt>First name</dt>
                  <dd>{patientData.firstName}</dd>
                  <dt>Last name</dt>
                  <dd>{patientData.lastName}</dd>
                  {patientData.dateOfBirth ? (
                    <>
                      <dt>Date of birth</dt>
                      <dd>{patientData.dateOfBirth}</dd>
                    </>
                  ) : null}
                  {patientData.email ? (
                    <>
                      <dt>Email</dt>
                      <dd>{patientData.email}</dd>
                    </>
                  ) : null}
                  {patientData.phone ? (
                    <>
                      <dt>Phone</dt>
                      <dd>{patientData.phone}</dd>
                    </>
                  ) : null}
                  {patientData.addressLine1 ? (
                    <>
                      <dt>Address</dt>
                      <dd>{patientData.addressLine1}</dd>
                    </>
                  ) : null}
                  {patientData.city ? (
                    <>
                      <dt>City</dt>
                      <dd>{patientData.city}</dd>
                    </>
                  ) : null}
                  {patientData.state ? (
                    <>
                      <dt>State</dt>
                      <dd>{patientData.state}</dd>
                    </>
                  ) : null}
                  {patientData.postalCode ? (
                    <>
                      <dt>Postal code</dt>
                      <dd>{patientData.postalCode}</dd>
                    </>
                  ) : null}
                </dl>
              </div>
            </div>
            <div className="booking-actions">
              <Button variant="secondary" onClick={() => setStep("new-form")}>Edit</Button>
              <Button variant="secondary" onClick={goBack}>← Back</Button>
              <Button onClick={submitFinal}>Review — appointment not submitted</Button>
            </div>
          </>
        ) : null}

        {isFinal ? (
          <>
            <Badge variant="warning">Appointment not submitted</Badge>
            <h2>Your appointment request has not been submitted yet.</h2>
            <EmptyState
              title="Online booking is not connected"
              description="Your appointment request has not been submitted yet. Online booking will be connected to CityDental when the appointment service is available. No appointment has been created, confirmed, or scheduled by this page."
            />
            <div className="booking-actions">
              <Button variant="secondary" onClick={startOver}>Start over</Button>
              <Link href="/" className="cd-button cd-button-ghost">Return to homepage</Link>
            </div>
          </>
        ) : null}
      </div>
      <p className="cd-muted booking-footnote">Online booking is not connected. Nothing on this page confirms an appointment.</p>
      <Link href="/appointments" className="text-link">Practice staff: appointments workspace ↗</Link>
    </div>
  );
}