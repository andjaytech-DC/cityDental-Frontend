import { renderToStaticMarkup } from "react-dom/server";
import CareersPage, { metadata } from "@/app/careers/page";
import sitemap from "@/app/sitemap";
import { validateApplication } from "@/components/CareersForm";
import { footerLinks, mainNavLinks } from "@/lib/navigation";

const validApplication = {
  fullName: "Asha Verma",
  phone: "+91 98765 43210",
  email: "asha@example.com",
  position: "Dental Assistant",
  qualifications: "Diploma in Dental Assisting",
  experience: "Two years chairside support",
  message: "I would like to contribute to a patient-focused dental team.",
  consent: true,
};

describe("careers navigation", () => {
  it("adds a single Careers link to the main navigation", () => {
    const careersLinks = mainNavLinks.filter(link => link.href === "/careers");
    expect(careersLinks).toHaveLength(1);
    expect(careersLinks[0].label).toBe("Careers");
  });

  it("adds a single Careers link to the footer quick links", () => {
    const careersLinks = footerLinks.quick.filter(link => link.href === "/careers");
    expect(careersLinks).toHaveLength(1);
  });

  it("includes the Careers route in the sitemap", () => {
    const urls = sitemap().map(entry => entry.url);
    expect(urls.some(url => url.endsWith("/careers"))).toBe(true);
  });
});

describe("careers page", () => {
  it("uses a unique, accurate title and description", () => {
    expect(metadata.title).toBe("Careers at City Dental | Etah");
    expect(String(metadata.description)).toContain("City Dental");
    expect(String(metadata.description)).toContain("apply");
  });

  it("renders the requested page heading and introduction", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    expect(html).toContain("Build Your Career");
    expect(html).toContain("with City Dental");
    expect(html).toContain("dedicated, responsible and patient-focused professionals");
  });

  it("labels the categories as hiring interests, not confirmed vacancies", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    expect(html).toContain("Hiring interests, not confirmed vacancies.");
    expect(html).toContain("The clinic activates individual roles");
  });

  it("renders all three hiring categories", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    expect(html).toContain("Doctors and Dental Professionals");
    expect(html).toContain("Dental Support Staff");
    expect(html).toContain("Receptionist and Front Desk");
  });

  it("renders every listed role", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    const roles = [
      "Dentist / Dental Surgeon",
      "Other qualified dental professionals, according to current staffing requirements",
      "Dental Assistant",
      "Chairside Assistant",
      "Clinic Support Staff",
      "Receptionist",
      "Front Desk Executive",
      "Patient Coordination and Appointment Scheduling",
    ];
    roles.forEach(role => expect(html).toContain(role));
  });

  it("describes the working environment without inventing benefits", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    expect(html).toContain("A friendly, organised place to care");
    expect(html).not.toMatch(/₹|per annum|per month|LPA|paid leave|health insurance/i);
  });

  it("renders all application fields and the consent control", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    ["Full name", "Phone number", "Email address", "Position of interest", "Relevant qualifications", "Experience (optional)", "Short introduction"].forEach(label => {
      expect(html).toContain(label);
    });
    expect(html).toContain('name="consent"');
    expect(html).toContain("I consent to CityDental using the details");
    expect(html).toContain("Submit application");
  });

  it("states that resume upload is not available online", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    expect(html).toContain("Resume upload is not available online yet");
    expect(html).toContain("citydentalEtah@gmail.com");
  });

  it("does not describe the roles as open vacancies", () => {
    const html = renderToStaticMarkup(<CareersPage />);
    expect(html).not.toContain("We are hiring now");
    expect(html).not.toContain("Immediate joining");
    expect(html).not.toContain("vacancy available");
  });
});

describe("careers application validation", () => {
  it("accepts a complete application", () => {
    expect(validateApplication(validApplication)).toEqual({});
  });

  it("requires a name, phone, email, position, qualifications, message and consent", () => {
    const errors = validateApplication({
      fullName: "",
      phone: "",
      email: "",
      position: "",
      qualifications: "",
      experience: "",
      message: "",
      consent: false,
    });
    expect(Object.keys(errors).sort()).toEqual(
      ["consent", "email", "fullName", "message", "phone", "position", "qualifications"].sort()
    );
  });

  it("rejects malformed contact details", () => {
    const errors = validateApplication({
      ...validApplication,
      email: "not-an-email",
      phone: "12",
    });
    expect(errors.email).toBeDefined();
    expect(errors.phone).toBeDefined();
  });

  it("requires a substantive introduction", () => {
    const errors = validateApplication({ ...validApplication, message: "Hi" });
    expect(errors.message).toBeDefined();
  });

  it("rejects an unknown position", () => {
    const errors = validateApplication({ ...validApplication, position: "Astronaut" });
    expect(errors.position).toBeDefined();
  });

  it("enforces the message and qualification limits", () => {
    const errors = validateApplication({
      ...validApplication,
      qualifications: "a".repeat(301),
      message: "a".repeat(901),
    });
    expect(errors.qualifications).toBeDefined();
    expect(errors.message).toBeDefined();
  });

  it("requires consent before submission", () => {
    const errors = validateApplication({ ...validApplication, consent: false });
    expect(errors.consent).toBeDefined();
  });
});
