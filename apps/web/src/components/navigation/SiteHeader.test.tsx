import { renderToStaticMarkup } from "react-dom/server";
import { serviceCategories, mainNavLinks } from "@/lib/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { SiteFooter } from "@/components/footer/SiteFooter";

describe("SiteHeader", () => {
  it("renders the CityDental brand", () => {
    const html = renderToStaticMarkup(<SiteHeader account={<span>Account</span>} />);
    expect(html).toContain("CityDental");
  });

  it("uses the approved primary navigation order", () => {
    expect(mainNavLinks.map(link => link.label)).toEqual([
      "Home",
      "About",
      "Services",
      "Doctors",
      "Careers",
      "Contact",
    ]);
  });

  it("renders all main navigation links", () => {
    const html = renderToStaticMarkup(<SiteHeader account={<span>Account</span>} />);
    expect(html).toContain("Home");
    expect(html).toContain("About");
    expect(html).toContain("Doctors");
    expect(html).toContain("Services");
    expect(html).toContain("Careers");
    expect(html).toContain("Contact");
    expect(html).not.toContain("Patient Resources");
  });

  it("renders the book appointment button", () => {
    const html = renderToStaticMarkup(<SiteHeader account={<span>Account</span>} />);
    expect(html).toContain("Book Appointment");
    expect(html).toContain('href="/book-appointment"');
  });

  it("renders the mobile menu button", () => {
    const html = renderToStaticMarkup(<SiteHeader account={<span>Account</span>} />);
    expect(html).toContain("Menu");
  });

  it("passes account UI", () => {
    const html = renderToStaticMarkup(<SiteHeader account={<span>Test User</span>} />);
    expect(html).toContain("Test User");
  });

  it("has accessible menu button attributes", () => {
    const html = renderToStaticMarkup(<SiteHeader account={<span>Account</span>} />);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-controls="mobile-navigation"');
  });
});

describe("MobileNavigation", () => {
  it("renders the mobile navigation brand", () => {
    const html = renderToStaticMarkup(<MobileNavigation onClose={() => undefined} />);
    expect(html).toContain("CityDental");
  });

  it("renders all main navigation links in the mobile menu", () => {
    const html = renderToStaticMarkup(<MobileNavigation onClose={() => undefined} />);
    expect(html).toContain("Home");
    expect(html).toContain("About");
    expect(html).toContain("Doctors");
    expect(html).toContain("Services");
    expect(html).toContain("Careers");
    expect(html).toContain("Contact");
  });

  it("renders the close button", () => {
    const html = renderToStaticMarkup(<MobileNavigation onClose={() => undefined} />);
    expect(html).toContain("Close navigation");
  });

  it("has aria-modal attribute", () => {
    const html = renderToStaticMarkup(<MobileNavigation onClose={() => undefined} />);
    expect(html).toContain('aria-modal="true"');
  });

  it("renders the book appointment CTA", () => {
    const html = renderToStaticMarkup(<MobileNavigation onClose={() => undefined} />);
    expect(html).toContain("Book Appointment");
  });
});

describe("SiteFooter", () => {
  it("renders the CityDental brand", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("CityDental");
  });

  it("includes quick links", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("Home");
    expect(html).toContain("About");
    expect(html).toContain("Doctors");
  });

it("includes service links", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("Oral Surgery");
    expect(html).toContain("Implants");
  });

  it("includes contact information", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("Shop No. 5, Yadav Market");
  });

  it("includes phone number", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("+91 94151 92948");
  });

  it("includes WhatsApp link", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("https://wa.me/919415192948");
  });

  it("includes email link", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("citydentalEtah@gmail.com");
  });

  it("includes copyright notice", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("All rights reserved");
  });
});

describe("services mega menu", () => {
  it("renders all service categories", () => {
    const html = renderToStaticMarkup(
      <div>
        <h2>Services</h2>
        {serviceCategories.map(c => <h3 key={c.slug}>{c.name}</h3>)}
      </div>
    );
    expect(html).toContain("Oral Surgery");
    expect(html).toContain("Implants");
    expect(html).toContain("Specialty Services");
  });
});