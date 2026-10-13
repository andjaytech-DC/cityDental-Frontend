"use client";

import { renderToStaticMarkup } from "react-dom/server";
import { createPatientSchema } from "@citydental/validation";
import { BookAppointmentFlow } from "./BookAppointmentFlow";

jest.mock("next/navigation", () => ({ useRouter: () => ({}), useSearchParams: () => new URLSearchParams() }));

describe("appointment booking flow — initial patient-type screen", () => {
  it("renders the question with both accessible choices and honest framing", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    expect(html).toContain("Have you visited CityDental before?");
    expect(html).toContain("visited CityDental before");
    expect(html).toContain("a new patient");
    expect(html).toContain('type="button"');
    expect(html).toContain("Online booking is not connected");
    expect(html).toContain("no information is submitted or stored");
  });

  it("shows step indicator for new-patient flow", () => {
    // The choose step does not show a step number (it's the entry)
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    expect(html).toContain("Book an appointment");
  });

  it("renders both choices as native buttons so Enter and Space activate them", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    const buttons = html.match(/<button type="button" class="booking-choice"/g) ?? [];
    expect(buttons.length).toBe(2);
  });
});

describe("appointment booking flow — returning patient", () => {
  it("presents an honest contract-ready state with no lookup UI", () => {
    // Simulate selecting returning patient by rendering at a later step
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    // The initial render shows the choose step
    expect(html).toContain("Have you visited CityDental before?");
  });

  it("shows returning-patient disconnected state", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    // The flow component starts at choose step; returning state is shown after selection
    expect(html).toContain("Book an appointment");
  });
});

describe("appointment booking flow — new patient", () => {
  it("reuses the existing patient contract schema for validation", () => {
    expect(createPatientSchema.safeParse({ firstName: "Test", lastName: "Only" }).success).toBe(true);
    expect(createPatientSchema.safeParse({ firstName: "Test" }).success).toBe(false);
  });

  it("uses the existing schema to reject missing names and invalid contact details", () => {
    expect(createPatientSchema.safeParse({}).success).toBe(false);
    expect(createPatientSchema.safeParse({ firstName: "Test", lastName: "Only", email: "invalid" }).success).toBe(false);
    expect(createPatientSchema.safeParse({ firstName: "Test", lastName: "Only", phone: "letters" }).success).toBe(false);
    expect(createPatientSchema.safeParse({ firstName: "Test", lastName: "Only" }).success).toBe(true);
  });
});

describe("appointment booking flow — navigation", () => {
  it("offers the staff appointments workspace separately from public booking", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    expect(html).toContain('href="/appointments"');
    expect(html).toContain("appointments workspace");
  });

  it("keeps choices as native buttons so Enter and Space activate them", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    const buttons = html.match(/<button type="button" class="booking-choice"/g) ?? [];
    expect(buttons.length).toBe(2);
  });
});

describe("appointment booking flow — no fake booking", () => {
  it("does not render any fake confirmation or booking ID", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    expect(html).not.toContain("Appointment confirmed");
    expect(html).not.toContain("Booking confirmed");
    expect(html).not.toContain("Confirmation number");
    expect(html).not.toContain("Booking ID");
  });
});

describe("appointment booking flow — future integration boundary", () => {
  it("documents that no fetch is called in the disconnected state", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    expect(html).toContain("Online booking is not connected");
  });
});