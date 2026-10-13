import { renderToStaticMarkup } from "react-dom/server";
import { serviceCategories, mainNavLinks, aboutSections, patientResourceSections } from "@/lib/navigation";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import PatientResourcesPage from "@/app/patient-resources/page";
import NewPatientsPage from "@/app/patient-resources/new-patients/page";
import FormsPage from "@/app/patient-resources/forms/page";
import WhatToExpectPage from "@/app/patient-resources/what-to-expect/page";
import FAQsPage from "@/app/patient-resources/faqs/page";

describe("navigation data", () => {
  it("defines main navigation links including About and Contact", () => {
    const labels = mainNavLinks.map(l => l.label);
    expect(labels).toContain("About");
    expect(labels).toContain("Contact");
    expect(labels).toContain("Patient Resources");
  });

  it("has 3 service categories", () => {
    expect(serviceCategories).toHaveLength(3);
  });

  it("about sections are defined", () => {
    const labels = aboutSections.map(s => s.label);
    expect(labels).toContain("About CityDental");
    expect(labels).toContain("Meet Our Doctor");
  });

  it("patient resource sections are defined", () => {
    const labels = patientResourceSections.map(s => s.label);
    expect(labels).toContain("New Patients");
    expect(labels).toContain("Frequently Asked Questions");
  });
});

describe("about page", () => {
  it("renders the about hero title", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain("A thoughtful practice");
    expect(html).toContain("About CityDental");
  });

  it("includes our approach section", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain("Our approach");
    expect(html).toContain("patient-centered philosophy");
  });

  it("includes values: listening, communication, individualized", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain("Listening first");
    expect(html).toContain("Clear communication");
    expect(html).toContain("Individualized care");
  });

  it("links to the doctor profile", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain('href="/doctors/dr-kamlesh-kumar-yadav"');
  });

  it("includes a book appointment CTA", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain('href="/book-appointment"');
    expect(html).toContain("Book an Appointment");
  });

  it("does not contain fabricated credentials", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).not.toContain("Board-Certified");
    expect(html).not.toContain("Specialist");
    expect(html).not.toContain("years of experience");
  });
});

describe("contact page", () => {
  it("renders the contact title", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("talk about your smile");
  });

  it("includes CityDental branding", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("CityDental");
  });

  it("includes the clinic address", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("Shop No. 5, Yadav Market");
  });

  it("includes phone number", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("+91 94151 92948");
  });

  it("has WhatsApp link with correct URL", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("https://wa.me/919415192948");
  });

  it("has email link", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("citydentalEtah@gmail.com");
  });

  it("includes a book appointment CTA", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain('href="/book-appointment"');
  });
});

describe("patient resources page", () => {
  it("renders the patient resources title", () => {
    const html = renderToStaticMarkup(<PatientResourcesPage />);
    expect(html).toContain("Patient Resources");
  });

  it("links to all sub-pages", () => {
    const html = renderToStaticMarkup(<PatientResourcesPage />);
    expect(html).toContain('href="/patient-resources/new-patients"');
    expect(html).toContain('href="/patient-resources/forms"');
    expect(html).toContain('href="/patient-resources/what-to-expect"');
    expect(html).toContain('href="/patient-resources/faqs"');
  });
});

describe("patient resources sub-pages", () => {
  it("new patients page renders content", () => {
    const html = renderToStaticMarkup(<NewPatientsPage />);
    expect(html).toContain("New Patients");
    expect(html).toContain("first visit");
  });

  it("forms page renders content", () => {
    const html = renderToStaticMarkup(<FormsPage />);
    expect(html).toContain("Patient Forms");
    expect(html).toContain("New Patient Registration Form");
  });

  it("what to expect page renders content", () => {
    const html = renderToStaticMarkup(<WhatToExpectPage />);
    expect(html).toContain("What to Expect");
  });

  it("FAQ page renders content", () => {
    const html = renderToStaticMarkup(<FAQsPage />);
    expect(html).toContain("Frequently Asked Questions");
  });
});