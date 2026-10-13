import { ROLE_PERMISSION_MAP } from "./auth/permissions";
import { TEMPLATES, renderTemplate } from "./communications/templates";
import { isLocationAllowed } from "./auth/permissions";

describe("RBAC location isolation", () => {
  it("OWNER has all permissions", () => {
    expect(ROLE_PERMISSION_MAP.OWNER.length).toBe(19);
    expect(ROLE_PERMISSION_MAP.OWNER).toContain("audit:read");
  });
  it("LOCATION_ADMIN does not have organization:manage", () => {
    expect(ROLE_PERMISSION_MAP.LOCATION_ADMIN).not.toContain("organization:manage");
  });
  it("isLocationAllowed respects org-wide", () => {
    const orgWide = { isSuperAdmin: false, isOrgWide: true, locationIds: [] as string[] };
    expect(isLocationAllowed(orgWide, "any-id")).toBe(true);
    expect(isLocationAllowed(orgWide, null)).toBe(true);
  });
  it("isLocationAllowed restricts location-scoped", () => {
    const locScoped = { isSuperAdmin: false, isOrgWide: false, locationIds: ["loc-a"] };
    expect(isLocationAllowed(locScoped, "loc-a")).toBe(true);
    expect(isLocationAllowed(locScoped, "loc-b")).toBe(false);
    expect(isLocationAllowed(locScoped, null)).toBe(false);
  });
  it("superadmin bypasses location", () => {
    const superAdmin = { isSuperAdmin: true, isOrgWide: false, locationIds: [] as string[] };
    expect(isLocationAllowed(superAdmin, "any")).toBe(true);
  });
});

describe("communication templates", () => {
  it("renders appointment_confirmation with variables", () => {
    const { subject, body } = renderTemplate("appointment_confirmation", {
      patientName: "Asha",
      doctorName: "Dr. Yadav",
      appointmentDate: "2026-09-18",
      appointmentTime: "10:00",
      clinicName: "CityDental",
      clinicPhone: "+91 94151 92948",
    });
    expect(subject).toContain("CityDental");
    expect(body).toContain("Asha");
    expect(body).toContain("Dr. Yadav");
  });
  it("escapes HTML in variables", () => {
    const { body } = renderTemplate("general", { patientName: "<script>", clinicName: "CityDental", customMessage: "<b>hi</b>" } as never);
    expect(body).not.toContain("<script>");
    expect(body).toContain("&lt;script&gt;");
  });
  it("rejects unknown variable", () => {
    expect(() => renderTemplate("general", { unknownVar: "x" } as never)).toThrow();
  });
  it("defines all required templates", () => {
    expect(Object.keys(TEMPLATES)).toEqual(expect.arrayContaining(["appointment_confirmation", "appointment_reminder", "appointment_cancellation", "appointment_rescheduled", "welcome", "general"]));
  });
});

describe("communications provider status", () => {
  const orig = process.env;
  afterEach(() => { process.env = orig; jest.resetModules(); });
  it("returns NOT_CONFIGURED when COMMUNICATIONS_ENABLED=false", async () => {
    process.env.COMMUNICATIONS_ENABLED = "false";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_FROM = "from@example.com";
    const { getCommunicationStatus } = await import("./communications");
    const s = getCommunicationStatus();
    expect(s.enabled).toBe(false);
    expect(s.email).toBe("NOT_CONFIGURED");
  });
});
