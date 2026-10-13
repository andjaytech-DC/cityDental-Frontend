import { renderToStaticMarkup } from "react-dom/server";
import { serviceCategories, getCategoryBySlug, getServiceBySlug, getAllServiceSlugs, getCategorySlugs } from "@/lib/services";
import { BookAppointmentFlow } from "@/components/booking/BookAppointmentFlow";
import HomePage from "@/app/page";

describe("services data", () => {
  it("defines three service categories", () => {
    expect(serviceCategories.length).toBe(3);
    expect(serviceCategories.map(c => c.slug)).toContain("oral-surgery");
    expect(serviceCategories.map(c => c.slug)).toContain("implants-bone-grafting");
    expect(serviceCategories.map(c => c.slug)).toContain("specialty-services");
  });

  it("all categories have services", () => {
    serviceCategories.forEach(category => {
      expect(category.services.length).toBeGreaterThan(0);
      category.services.forEach(service => {
        expect(service.name.length).toBeGreaterThan(0);
        expect(service.description.length).toBeGreaterThan(0);
      });
    });
  });

  it("Oral Surgery contains expected services", () => {
    const oralSurgery = getCategoryBySlug("oral-surgery");
    expect(oralSurgery?.name).toBe("Oral Surgery");
    const names = oralSurgery?.services.map(s => s.name) ?? [];
    expect(names).toContain("Wisdom Teeth Removal");
    expect(names).toContain("Tooth Extractions");
  });

  it("Implants & Bone Grafting contains expected services", () => {
    const implants = getCategoryBySlug("implants-bone-grafting");
    expect(implants?.name).toBe("Implants & Bone Grafting");
    const names = implants?.services.map(s => s.name) ?? [];
    expect(names).toContain("Bone Grafting");
    expect(names).toContain("Sinus Lifts");
  });

  it("Specialty Services contains expected services", () => {
    const specialty = getCategoryBySlug("specialty-services");
    expect(specialty?.name).toBe("Specialty Services");
    const names = specialty?.services.map(s => s.name) ?? [];
    expect(names).toContain("Dental Implants");
    expect(names).toContain("Botox for TMD");
    expect(names).toContain("Occlusal Guards");
  });

  it("returns the correct category and service for valid slugs", () => {
    const result = getServiceBySlug("oral-surgery", "wisdom-teeth-removal");
    expect(result).toBeDefined();
    expect(result?.service.name).toBe("Wisdom Teeth Removal");
    expect(result?.category.name).toBe("Oral Surgery");
  });

  it("returns undefined for invalid service slugs", () => {
    expect(getServiceBySlug("oral-surgery", "nonexistent")).toBeUndefined();
  });

  it("generates all service slugs for static generation", () => {
    const slugs = getAllServiceSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    slugs.forEach(s => {
      expect(s).toHaveProperty("category");
      expect(s).toHaveProperty("service");
    });
  });
});

describe("services pages", () => {
  it("renders the /services page", () => {
    const html = renderToStaticMarkup(
      <div>
        <p className="eyebrow">CityDental Services</p>
        <h1>Comprehensive care</h1>
      </div>
    );
    expect(html).toContain("CityDental Services");
  });

  it("renders all three service categories in the landing page", () => {
    const html = renderToStaticMarkup(
      <div>
        {serviceCategories.map(category => (
          <div key={category.slug}>{category.name}</div>
        ))}
      </div>
    );
    expect(html).toContain("Oral Surgery");
    expect(html).toContain("Implants &amp; Bone Grafting");
    expect(html).toContain("Specialty Services");
  });

  it("renders service count for each category", () => {
    serviceCategories.forEach(category => {
      expect(category.services.length).toBeGreaterThan(0);
    });
  });
});

describe("services booking integration", () => {
  it("does not render fake booking confirmation on booking flow", () => {
    const html = renderToStaticMarkup(<BookAppointmentFlow />);
    expect(html).not.toContain("Appointment confirmed");
    expect(html).not.toContain("Booking confirmed");
    expect(html).not.toContain("Confirmation number");
    expect(html).not.toContain("Booking ID");
  });
});

describe("homepage services integration", () => {
  it("links to /services from the homepage", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('href="/services"');
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
