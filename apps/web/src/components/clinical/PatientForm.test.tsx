import { renderToStaticMarkup } from "react-dom/server";
import { createPatientSchema, updatePatientSchema } from "@citydental/validation";
import { PatientForm, patientSaveError } from "./PatientForm";
import { ApiError } from "@/lib/api";

describe("patient form", () => {
  it("renders required identity and accessible optional contact fields", () => {
    const html = renderToStaticMarkup(<PatientForm mode="create" />);
    expect(html).toContain('aria-label="Patient details"');
    expect(html).toContain('name="firstName"');
    expect(html).toContain('name="lastName"');
    expect(html).toContain('type="email"');
    expect(html).toContain('type="date"');
    expect(html).toContain("Check details (no save)");
    expect(html).toContain("Saving unavailable");
  });
  it("uses the existing schema to reject missing names and invalid contact details", () => {
    expect(createPatientSchema.safeParse({}).success).toBe(false);
    expect(createPatientSchema.safeParse({ firstName: "Test", lastName: "Only", email: "invalid" }).success).toBe(false);
    expect(createPatientSchema.safeParse({ firstName: "Test", lastName: "Only", phone: "letters" }).success).toBe(false);
    expect(createPatientSchema.safeParse({ firstName: "Test", lastName: "Only" }).success).toBe(true);
  });
  it("reuses the partial update contract without requiring unchanged fields", () => {
    expect(updatePatientSchema.safeParse({ city: "Test city" }).success).toBe(true);
    const html = renderToStaticMarkup(<PatientForm mode="update" initialValues={{ city: "Test city" }} />);
    expect(html).toContain('aria-label="Update patient details"');
    expect(html).toContain('name="city"');
    expect(html).toContain("it does not delete the stored value");
  });
  it.each([401, 403, 404, 409, 500])("provides a safe error presentation for HTTP %s", status => {
    const message = patientSaveError(new ApiError(status, "private backend detail"));
    expect(message.length).toBeGreaterThan(20);
    expect(message).not.toContain("private backend detail");
  });
  it("does not claim a save after a transport failure", () => {
    expect(patientSaveError(new TypeError("network"))).toContain("could not be confirmed");
  });
});
