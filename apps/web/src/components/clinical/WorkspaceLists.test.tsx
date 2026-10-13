import { renderToStaticMarkup } from "react-dom/server";
import type { AppointmentDto, DoctorDto, PatientDto } from "@citydental/types";
import {
  AppointmentWorkspace,
  DoctorWorkspace,
  PatientWorkspace,
  type WorkspaceState,
} from "./WorkspaceLists";

// Synthetic fixtures only; production pages render explicit unavailable states.
const patient: PatientDto = {
  id: "0f0a7a4d-71c2-4f61-9d21-0b6f9a2f4c10",
  organizationId: "1b6d3f52-8b7e-4c2a-9d84-2e6a1a0d5b21",
  primaryLocationId: null,
  patientNumber: "P-0001",
  firstName: "Ada",
  lastName: "Okoye",
  dateOfBirth: null,
  gender: null,
  email: "ada@example.test",
  phone: null,
  city: null,
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const doctor: DoctorDto = {
  id: "2c7e1f90-3b6a-4d28-9c11-5f4a0e8d7b32",
  organizationId: "1b6d3f52-8b7e-4c2a-9d84-2e6a1a0d5b21",
  primaryLocationId: null,
  firstName: "Ravi",
  lastName: "Menon",
  email: "ravi@example.test",
  phone: null,
  licenseNumber: null,
  qualifications: "BDS",
  specialties: ["Orthodontics"],
  status: "ACTIVE",
};

const appointment: AppointmentDto = {
  id: "test-appointment", organizationId: "test-org", locationId: "test-location",
  patientId: "test-patient", doctorId: null,
  scheduledStart: "2026-01-01T09:00:00+05:30", scheduledEnd: "2026-01-01T09:30:00+05:30",
  status: "SCHEDULED", source: "STAFF", reason: null, notes: null,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("appointment workspace states", () => {
  it("announces loading", () => {
    expect(render(AppointmentWorkspace, { status: "loading" })).toContain("Loading appointments");
  });
  it("distinguishes empty results", () => {
    expect(render(AppointmentWorkspace, { status: "ready", items: [] })).toContain("No appointments found");
  });
  it("renders DTO values without fabricated names or converted timezone", () => {
    const html = render(AppointmentWorkspace, { status: "ready", items: [appointment] });
    expect(html).toContain(appointment.scheduledStart);
    expect(html).toContain("test-patient");
    expect(html).toContain("test-location");
    expect(html).toContain("Not assigned");
    expect(html).toContain("SCHEDULED");
    expect(html).toContain('scope="col"');
  });
  it("announces an API error", () => {
    expect(render(AppointmentWorkspace, { status: "error" })).toContain("Unable to load appointments");
  });
  it("handles denied access", () => {
    expect(render(AppointmentWorkspace, { status: "denied" })).toContain("Access unavailable");
  });
  it("explicitly reports the unavailable integration", () => {
    const html = render(AppointmentWorkspace, { status: "unavailable" });
    expect(html).toContain("Appointments API unavailable");
    expect(html).not.toContain("test-patient");
  });
});

function render<T extends { id: string }>(
  Workspace: (props: { state: WorkspaceState<T> }) => JSX.Element,
  state: WorkspaceState<T>,
): string {
  return renderToStaticMarkup(<Workspace state={state} />);
}

describe("patient workspace states", () => {
  it("declares a contract-ready API as unavailable instead of showing data", () => {
    const html = render(PatientWorkspace, { status: "unavailable" });
    expect(html).toContain("Contract-ready · API unavailable");
    expect(html).toContain("no NestJS list endpoint is connected");
    expect(html).not.toContain("Ada");
  });

  it("renders loading, empty, error and access states", () => {
    expect(render(PatientWorkspace, { status: "loading" })).toContain('role="status"');
    expect(render(PatientWorkspace, { status: "error" })).toContain('role="alert"');
    expect(render(PatientWorkspace, { status: "denied" })).toContain("Access unavailable");
    expect(render(PatientWorkspace, { status: "ready", items: [] })).toContain("No patients found");
  });

  it("renders only contract-defined fields for real data", () => {
    const html = render(PatientWorkspace, { status: "ready", items: [patient] });
    expect(html).toContain("Ada Okoye");
    expect(html).toContain("P-0001");
    expect(html).toContain("ada@example.test");
    expect(html).toContain("<table");
    expect(html).toContain('scope="col"');
    // Fields that do not exist on PatientDto must never appear.
    expect(html).not.toContain("License");
    expect(html).not.toContain("Specialties");
  });

  it("marks search as disconnected while the list API is unavailable", () => {
    const html = render(PatientWorkspace, { status: "unavailable" });
    expect(html).toContain("disabled");
    expect(html).toContain("Search is not connected");
  });
});

describe("doctor workspace states", () => {
  it("announces loading", () => {
    expect(render(DoctorWorkspace, { status: "loading" })).toContain("Loading doctors");
  });
  it("announces API failures", () => {
    expect(render(DoctorWorkspace, { status: "error" })).toContain("Unable to load doctors");
  });
  it("handles server-denied access", () => {
    expect(render(DoctorWorkspace, { status: "denied" })).toContain("Access unavailable");
  });
  it("renders the unavailable state without fabricated team data", () => {
    const html = render(DoctorWorkspace, { status: "unavailable" });
    expect(html).toContain("Doctors API unavailable");
    expect(html).not.toContain("Ravi");
  });

  it("renders contract-defined doctor fields when data exists", () => {
    const html = render(DoctorWorkspace, { status: "ready", items: [doctor] });
    expect(html).toContain("Ravi Menon");
    expect(html).toContain("Orthodontics");
    expect(html).not.toContain("No doctors found");
  });

  it("renders the empty state distinctly from an unavailable API", () => {
    const html = render(DoctorWorkspace, { status: "ready", items: [] });
    expect(html).toContain("No doctors found");
    expect(html).not.toContain("API unavailable");
  });
});
