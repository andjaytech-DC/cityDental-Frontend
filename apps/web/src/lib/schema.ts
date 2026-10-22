import { doctorProfile } from "@/lib/doctors";
import { absoluteUrl } from "@/lib/seo";

export type JsonLdData = Record<string, unknown>;

const CLINIC_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Shop No. 5, Yadav Market, MG Road",
  addressLocality: "Etah",
  addressRegion: "Uttar Pradesh",
  postalCode: "701012",
  addressCountry: "IN",
};

/**
 * Schema.org Dentist/LocalBusiness for the practice. Only verified facts from
 * the shared profile are emitted; opening hours, ratings and price ranges are
 * intentionally omitted until the practice supplies them.
 */
export function dentistSchema(): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": absoluteUrl("/#organization"),
    name: doctorProfile.brand,
    url: absoluteUrl("/"),
    description: "Patient-focused dental care in Etah, Uttar Pradesh.",
    telephone: doctorProfile.contact.phone,
    email: doctorProfile.contact.email,
    address: CLINIC_ADDRESS,
    areaServed: { "@type": "City", name: "Etah" },
    medicalSpecialty: "Dentistry",
    employee: {
      "@type": "Person",
      name: doctorProfile.fullName,
      jobTitle: doctorProfile.role,
      url: absoluteUrl(`/doctors/${doctorProfile.slug}`),
    },
  };
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function dentistPageSchema(): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": absoluteUrl(`/doctors/${doctorProfile.slug}#person`),
    name: doctorProfile.fullName,
    jobTitle: doctorProfile.role,
    url: absoluteUrl(`/doctors/${doctorProfile.slug}`),
    worksFor: { "@type": "Dentist", name: doctorProfile.brand, url: absoluteUrl("/") },
  };
}
