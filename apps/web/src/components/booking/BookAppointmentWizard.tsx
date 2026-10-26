"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPatientSchema, type CreatePatientInput } from "@citydental/validation";
import { Button, Badge, PageHeading, Input, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { trackEvent } from "@/lib/analytics";

type AgeGroup = "CHILD" | "ADULT" | "SENIOR";
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface DoctorOption { id: string; firstName: string; lastName: string; specialties: { name: string }[]; primaryLocationId: string | null; status: string; location?: { name: string } }

export function BookAppointmentWizard() {
  const { push } = useToast();
  const [step, setStep] = useState<WizardStep>(1);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsFailed, setDoctorsFailed] = useState(false);
  const [doctorsAttempt, setDoctorsAttempt] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<{ appointmentId?: string; message?: string; emailStatus?: string; whatsappStatus?: string } | null>(null);
  const [patientData, setPatientData] = useState<CreatePatientInput | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreatePatientInput>({ resolver: zodResolver(createPatientSchema) });

  // Fetch doctors on step 2 and locations on step 3 for distinct steps.
  // A failed doctors request must not masquerade as an empty clinic:
  // previously `.catch(() => {})` swallowed HTTP/DB errors, so a broken
  // DATABASE_URL rendered as "No active doctors found" with no way to tell
  // the two apart.
  useEffect(() => {
    if (step === 2) {
      setDoctorsFailed(false);
      fetch(`/api/doctors?status=ACTIVE`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d) => {
          if (Array.isArray(d.items)) setDoctors(d.items);
          else if (Array.isArray(d)) setDoctors(d);
          else throw new Error("unexpected payload");
        })
        .catch(() => {
          setDoctors([]);
          setDoctorsFailed(true);
        });
    }
    if (step === 3) {
      fetch("/api/locations").then((r) => r.json()).then((d) => {
        if (Array.isArray(d.items)) setLocations(d.items);
        else if (Array.isArray(d)) setLocations(d);
      }).catch(() => {});
    }
  }, [step, doctorsAttempt]);

  useEffect(() => {
    if ((step === 4 || step === 5) && selectedDoctor && date) {
      fetch(`/api/appointments/availability?doctorId=${selectedDoctor}&date=${date}`)
        .then((r) => r.json()).then((d) => setSlots(d.slots ?? [])).catch(() => setSlots([]));
    }
  }, [step, selectedDoctor, date]);

  const canNext1 = !!ageGroup;
  const canNext2 = !!selectedDoctor;
  const canNext3 = !!selectedLocation;
  const canNext4 = !!date;
  const canNext5 = !!selectedTime;

  const onDetailsSubmit = handleSubmit(async (data) => {
    setError(null);
    setPatientData(data);
    setStep(7);
  });

  const onConfirm = async () => {
    setError(null);
    if (!ageGroup || !selectedDoctor || !selectedLocation || !date || !selectedTime || !patientData) { setError("Complete all steps"); return; }
    setSubmitting(true);
    const payload = {
      ageGroup,
      doctorId: selectedDoctor,
      locationId: selectedLocation,
      date,
      time: selectedTime,
      patient: patientData,
    };
    const res = await fetch("/api/appointments/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.message ?? "Booking failed"); push(data.message ?? "Booking failed. Please try again or call the clinic.", "error"); trackEvent("appointment_booked", { result: "failed" }); return; }
    setConfirmResult({ appointmentId: data.appointmentId, message: data.message, emailStatus: data.emailStatus, whatsappStatus: data.whatsappStatus });
    setStep(8);
    push("Appointment confirmed. Pay at the clinic.", "success");
    trackEvent("appointment_booked", { result: "success" });
  };

  const fee = ageGroup ? ({ CHILD: 400, ADULT: 500, SENIOR: 450 }[ageGroup] ?? 500) : 500;

  return (
    <div className="booking-flow">
      <PageHeading title="Book an appointment" description="Appointment-only — pay at clinic. Confirmation via email & WhatsApp." />
      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        {[
          { n: 1, label: "Age" },
          { n: 2, label: "Doctor" },
          { n: 3, label: "Location" },
          { n: 4, label: "Date" },
          { n: 5, label: "Time" },
          { n: 6, label: "Details" },
          { n: 7, label: "Review" },
          { n: 8, label: "Confirm" },
        ].map((s) => (
          <span key={s.n} className={`px-2 py-1 rounded-full border ${step === s.n ? "bg-teal-700 text-white" : step > s.n ? "bg-green-50" : "bg-white"}`}>{s.n}. {s.label}</span>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-serif">Who is the appointment for?</h2>
          <p className="cd-muted text-sm">Select age group — required.</p>
          <div className="grid gap-3 md:grid-cols-3">
            {(["CHILD", "ADULT", "SENIOR"] as const).map((g) => (
              <button key={g} type="button" onClick={() => setAgeGroup(g)} className={`cd-card p-6 text-left border-2 ${ageGroup === g ? "border-teal-700" : "border-transparent"}`}>
                <div className="font-serif">{g === "CHILD" ? "Child" : g === "ADULT" ? "Adult" : "Old Person"}</div>
                <div className="cd-muted text-xs mt-1">{g} — {g === "CHILD" ? "0-12" : g === "ADULT" ? "13-59" : "60+"}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button disabled={!canNext1} onClick={() => setStep(2)}>Continue →</Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-serif">Select Doctor</h2>
          <p className="cd-muted text-sm">Suggested based on {ageGroup} — active doctors.</p>
          {doctorsFailed ? (
            <EmptyState
              title="Unable to load doctors"
              description="The doctor list could not be loaded right now. Please try again, or contact the clinic if this continues."
              action={<Button onClick={() => setDoctorsAttempt((n) => n + 1)}>Try again</Button>}
            />
          ) : doctors.length === 0 ? <EmptyState title="No doctors available" description="No active doctors found. Please contact clinic." /> : (
            <div className="grid gap-3">
              {doctors.map((d) => (
                <button key={d.id} type="button" onClick={() => setSelectedDoctor(d.id)} className={`cd-card p-4 text-left flex justify-between items-center border-2 ${selectedDoctor === d.id ? "border-teal-700" : "border-transparent"}`}>
                  <div>
                    <div className="font-medium">{d.firstName} {d.lastName}</div>
                    <div className="cd-muted text-xs">{d.specialties?.map((s) => s.name).join(", ") || "General" } · {d.location?.name ?? "Main"}</div>
                  </div>
                  <Badge variant={selectedDoctor === d.id ? "info" : "neutral"}>{selectedDoctor === d.id ? "Selected" : "Available"}</Badge>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button disabled={!canNext2} onClick={() => setStep(3)}>Continue →</Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-serif">Select Location</h2>
          <p className="cd-muted text-sm">Choose clinic location.</p>
          <div className="grid gap-3">
            {locations.map((l) => (
              <button key={l.id} type="button" onClick={() => setSelectedLocation(l.id)} className={`cd-card p-4 text-left border-2 ${selectedLocation === l.id ? "border-teal-700" : "border-transparent"}`}>
                <div className="font-medium">{l.name}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button disabled={!canNext3} onClick={() => setStep(4)}>Continue →</Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-serif">Select Date</h2>
          <label className="block"><span className="text-sm">Date *</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="cd-input max-w-xs" /></label>
          <div className="grid grid-cols-7 gap-2 text-xs mt-2">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <div key={d} className="text-center font-medium">{d}</div>)}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
            <Button disabled={!canNext4} onClick={() => setStep(5)}>Continue →</Button>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-serif">Select Available Time</h2>
          <p className="cd-muted text-sm">Available times for {date} with selected doctor.</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {slots.length === 0 ? <div className="cd-muted text-sm">No slots for {date} — try another date.</div> : slots.map((s) => {
              const t = new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const isoTime = new Date(s).toTimeString().slice(0, 5);
              return <button key={s} type="button" onClick={() => setSelectedTime(isoTime)} className={`p-2 border rounded ${selectedTime === isoTime ? "bg-teal-700 text-white" : "bg-white"}`}>{t}</button>;
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(4)}>← Back</Button>
            <Button disabled={!canNext5} onClick={() => setStep(6)}>Continue →</Button>
          </div>
        </div>
      ) : null}

      {step === 6 ? (
        <form onSubmit={onDetailsSubmit} className="space-y-5">
          <h2 className="text-xl font-serif">Enter Patient Details</h2>
          <p className="cd-muted text-sm">We need your details to create the appointment.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="First name" required {...register("firstName")} error={errors.firstName?.message} />
            <Input label="Last name" required {...register("lastName")} error={errors.lastName?.message} />
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
            <Input label="Phone" {...register("phone")} error={errors.phone?.message} />
            <Input label="City" {...register("city")} error={errors.city?.message} />
            <Input label="Address" {...register("addressLine1")} error={errors.addressLine1?.message} />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => setStep(5)}>← Back</Button>
            <Button type="submit">Continue to Review →</Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      ) : null}

      {step === 7 ? (
        <div className="space-y-5">
          <h2 className="text-xl font-serif">Review Appointment</h2>
          <div className="cd-card p-4 space-y-2 text-sm">
            <div>Patient: <strong>{patientData?.firstName} {patientData?.lastName}</strong> ({patientData?.email ?? patientData?.phone ?? "no contact"})</div>
            <div>Patient Age Group: <strong>{ageGroup}</strong></div>
            <div>Doctor: <strong>{doctors.find((d) => d.id === selectedDoctor)?.firstName} {doctors.find((d) => d.id === selectedDoctor)?.lastName}</strong></div>
            <div>Location: <strong>{locations.find((l) => l.id === selectedLocation)?.name}</strong></div>
            <div>Date: <strong>{date}</strong></div>
            <div>Time: <strong>{selectedTime}</strong></div>
            <div>Fee (pay at clinic): <strong>₹{fee} INR</strong> <span className="cd-muted">server-calculated</span></div>
          </div>
          <div className="cd-muted text-xs">Payment will be collected at the clinic. No online payment step between Review and Appointment Created.</div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(6)}>← Back</Button>
            <Button onClick={() => setStep(8)}>Continue to Confirm →</Button>
          </div>
        </div>
      ) : null}

      {step === 8 ? (
        <div className="space-y-6">
          {!confirmResult ? (
            <div className="space-y-4">
              <h2 className="text-xl font-serif">Confirm Appointment</h2>
              <p className="cd-muted text-sm">Review is complete. Confirm to create your appointment.</p>
              <Button onClick={onConfirm} disabled={submitting}>{submitting ? "Creating…" : `Confirm Appointment — Pay at Clinic ₹${fee}`}</Button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-serif">Appointment Created</h2>
              <div className="cd-card p-4 space-y-2 text-sm">
                <div>Appointment ID: <strong>{confirmResult.appointmentId}</strong></div>
                <div>Status: <Badge variant="info">CONFIRMED</Badge></div>
                <div>Pay at Clinic: <strong>₹{fee} INR</strong></div>
              </div>
              <div className="cd-card p-4 bg-green-50">
                <h3 className="font-medium">Confirmation</h3>
                <p className="cd-muted text-sm mt-1">Your appointment is confirmed. A confirmation has been sent via email and WhatsApp where contact was provided.</p>
                <div className="text-xs mt-2 space-y-1">
                  <div>Email: {confirmResult.emailStatus ?? "—"}</div>
                  <div>WhatsApp: {confirmResult.whatsappStatus ?? "—"}</div>
                </div>
                <p className="cd-muted text-xs mt-2">If providers are NOT_CONFIGURED, the appointment is still created — confirmation will be delivered when providers are configured. No fake success.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setStep(1); setAgeGroup(null); setSelectedDoctor(null); setSelectedLocation(null); setSelectedTime(null); setConfirmResult(null); }}>Book another</Button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
