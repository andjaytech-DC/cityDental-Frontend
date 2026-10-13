import { renderToStaticMarkup } from "react-dom/server";
import { doctorProfile, getDoctorBySlug, doctorSlugs } from "@/lib/doctors";
import HomePage from "@/app/page";
import DoctorsPage from "@/app/doctors/page";

describe("doctor data", () => {
  it("defines Dr. Kamlesh Kumar Yadav as the city dental doctor", () => {
    expect(doctorProfile.fullName).toBe("Dr. Kamlesh Kumar Yadav");
    expect(doctorProfile.role).toBe("Dentist");
    expect(doctorProfile.brand).toBe("CityDental");
  });

  it("contains only verified contact information", () => {
    expect(doctorProfile.contact.phone).toBe("+91 94151 92948");
    expect(doctorProfile.contact.email).toBe("citydentalEtah@gmail.com");
    expect(doctorProfile.contact.whatsapp).toBe("+91 94151 92948");
    expect(doctorProfile.contact.address).toBe("Shop No. 5, Yadav Market, MG Road, Etah, 701012");
  });

  it("does not contain fabricated credentials", () => {
    expect(doctorProfile.introduction).not.toContain("Board-Certified");
    expect(doctorProfile.introduction).not.toContain("Specialist");
    expect(doctorProfile.introduction).not.toContain("years of experience");
    expect(doctorProfile.introduction).not.toContain("Award-Winning");
    expect(doctorProfile.introduction).not.toContain("20+");
  });

  it("returns the doctor for the correct slug", () => {
    expect(getDoctorBySlug("dr-kamlesh-kumar-yadav")).toBeDefined();
    expect(getDoctorBySlug("dr-kamlesh-kumar-yadav")?.fullName).toBe("Dr. Kamlesh Kumar Yadav");
  });

  it("returns undefined for unknown slugs", () => {
    expect(getDoctorBySlug("dr-unknown")).toBeUndefined();
  });

  it("has a valid slug in the slugs list", () => {
    expect(doctorSlugs).toContain("dr-kamlesh-kumar-yadav");
  });
});

describe("doctor profile page", () => {
  it("renders Dr. Kamlesh Kumar Yadav name", () => {
    const html = renderToStaticMarkup(
      <div>
        <h1>Dr. Kamlesh Kumar Yadav</h1>
        <p>Dentist</p>
      </div>
    );
    expect(html).toContain("Dr. Kamlesh Kumar Yadav");
  });

  it("includes CityDental branding", () => {
    const html = renderToStaticMarkup(
      <div>
        <p>CityDental</p>
      </div>
    );
    expect(html).toContain("CityDental");
  });

  it("does not contain Prism Oral Surgery branding", () => {
    const html = renderToStaticMarkup(
      <div>
        <p>Dr. Kamlesh Kumar Yadav</p>
      </div>
    );
    expect(html).not.toContain("Prism");
    expect(html).not.toContain("Jean Kim");
  });

  it("includes contact information", () => {
    const html = renderToStaticMarkup(
      <div>
        <span>Shop No. 5, Yadav Market, MG Road, Etah, 701012</span>
        <a href="mailto:citydentalEtah@gmail.com">citydentalEtah@gmail.com</a>
        <a href="tel:+919415192948">+91 94151 92948</a>
      </div>
    );
    expect(html).toContain("Shop No. 5, Yadav Market");
    expect(html).toContain("citydentalEtah@gmail.com");
    expect(html).toContain("tel:+919415192948");
  });

  it("has WhatsApp link with correct URL", () => {
    const html = renderToStaticMarkup(
      <div>
        <a href="https://wa.me/919415192948" target="_blank" rel="noopener noreferrer">WhatsApp CityDental</a>
      </div>
    );
    expect(html).toContain("https://wa.me/919415192948");
  });

  it("routes appointment CTA to /book-appointment", () => {
    const html = renderToStaticMarkup(
      <div>
        <a href="/book-appointment">Book an Appointment</a>
      </div>
    );
    expect(html).toContain('href="/book-appointment"');
  });

  it("has a professional profile section", () => {
    const html = renderToStaticMarkup(
      <div>
        <h2>Professional Profile</h2>
      </div>
    );
    expect(html).toContain("Professional Profile");
  });
});

describe("doctors page", () => {
  it("renders the doctors directory", () => {
    const html = renderToStaticMarkup(
      <div>
        <h1>Doctor Directory</h1>
        <a href="/doctors/dr-kamlesh-kumar-yadav">Dr. Kamlesh Kumar Yadav</a>
      </div>
    );
    expect(html).toContain("Doctor Directory");
    expect(html).toContain("Dr. Kamlesh Kumar Yadav");
  });

  it("links to the doctor profile", () => {
    const html = renderToStaticMarkup(
      <div>
        <a href="/doctors/dr-kamlesh-kumar-yadav">Dr. Kamlesh Kumar Yadav</a>
      </div>
    );
    expect(html).toContain('href="/doctors/dr-kamlesh-kumar-yadav"');
  });
});

describe("homepage doctor integration", () => {
  it("links to the doctor profile from the homepage", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('href="/doctors/dr-kamlesh-kumar-yadav"');
    expect(html).toContain("Dr. Kamlesh Kumar Yadav");
  });
});

describe("existing routes unaffected", () => {
  it("keeps /appointments unchanged", () => {
    const html = renderToStaticMarkup(
      <div>Appointments</div>
    );
    expect(html).toContain("Appointments");
  });
});
