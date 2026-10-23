import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "./page";
import WorkspacePage from "./workspace/page";
import { AppointmentWorkspace } from "@/components/clinical/WorkspaceLists";
import * as UI from "@/components/ui";

describe("frontend foundation", () => {
  it("preserves the former overview at the workspace route", () => {
    const html = renderToStaticMarkup(<WorkspacePage />);
    expect(html).toContain("Your practice, in one place");
    expect(html).toContain("Patients");
  });

  it("renders the redesigned public homepage with verified service and team information", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('id="hero-title"');
    expect(html).toContain("Healthy smiles");
    expect(html).toContain("brighter life");
    expect(html).toContain('href="/book-appointment"');
    expect(html).toContain('href="/services"');
    expect(html).toContain("clinic-hero.jpg");
    expect(html).toContain("Illustrative stock photography");
    expect(html).toContain("Dr. Kamlesh Kumar Yadav");
    expect(html).toContain("CityDental");
    expect(html).toContain('href="/doctors/dr-kamlesh-kumar-yadav"');
    expect(html).toContain('href="/careers"');
    expect(html).toContain("Patient-first care");
    expect(html).toContain("Honest information");
    expect(html).not.toContain("No doctor records loaded");
    expect(html).not.toContain("Team profiles are on their way");
    expect(html).not.toContain("Patient successfully created");
    expect(html).not.toContain("General Dentistry");
    expect(html).not.toContain("Cosmetic Dentistry");
    expect(html).not.toContain("Orthodontics");
    expect(html).toContain("oral-surgery");
    expect(html).toContain("implants-bone-grafting");
    expect(html).toContain("specialty-services");
    expect(html).toContain("Wisdom Teeth Removal");
    expect(html).toContain("Dental Implants");
    expect(html).toContain("TMJ Therapy");
  });

  it("reuses the staged appointment presentation while preserving supplied time offsets", () => {
    const html = renderToStaticMarkup(<AppointmentWorkspace state={{ status: "ready", items: [{
      id: "test-appointment", organizationId: "test-org", locationId: "test-location",
      patientId: "test-patient", doctorId: null,
      scheduledStart: "2026-01-01T09:00:00+05:30", scheduledEnd: "2026-01-01T09:30:00+05:30",
      status: "SCHEDULED", source: "STAFF", reason: null, notes: null,
      createdAt: "2026-01-01T00:00:00Z",
    }]}} />);
    expect(html).toContain("2026-01-01T09:00:00+05:30");
    expect(html).toContain("test-patient");
  });

  it("preserves caller accessibility attributes when no error prop is supplied", () => {
    const html = renderToStaticMarkup(<UI.Input id="external" label="External validation" aria-invalid="true" aria-describedby="external-help" />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="external-help"');
    expect(renderToStaticMarkup(<UI.Input label="Valid input" />)).not.toContain("aria-invalid");
  });

  it("renders every barrel export, including the forwardRef Input", () => {
    const html = renderToStaticMarkup(
      <>
        <UI.Card title="Foundation">
          <UI.Button disabled>Continue</UI.Button>
          <UI.Badge variant="success">Active</UI.Badge>
          <UI.Input id="email" label="Email" error="Email is required" />
        </UI.Card>
        <UI.Table>
          <UI.TableHead><UI.TableRow><UI.TableHeader>Name</UI.TableHeader></UI.TableRow></UI.TableHead>
          <UI.TableBody>
            <UI.TableRow><UI.TableCell>Example</UI.TableCell></UI.TableRow>
            <UI.TableEmpty colSpan={1} />
          </UI.TableBody>
        </UI.Table>
        <UI.Modal isOpen={false} onClose={() => undefined} title="Closed">Hidden content</UI.Modal>
      </>
    );
    expect(html).toContain("Foundation");
    expect(html).toContain("disabled");
    expect(html).toContain("Active");
    expect(html).toContain('for="email"');
    expect(html).toContain('id="email"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="email-error"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain("<table");
    expect(html).toContain('scope="col"');
    expect(html).toContain("No records found.");
    expect(html).not.toContain("Hidden content");
  });
});

