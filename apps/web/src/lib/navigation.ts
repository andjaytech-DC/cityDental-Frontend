/**
 * CityDental navigation and service data architecture.
 *
 * This single source of truth drives:
 *   - Desktop mega menu
 *   - Mobile accordion navigation
 *   - Services landing page
 *   - Category pages
 *   - Footer links
 *   - Breadcrumbs
 *   - Related services
 *
 * Reuse everywhere to prevent navigation inconsistencies.
 */

export interface ServiceItem {
  slug: string;
  name: string;
  href: string;
}

export interface ServiceCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  services: ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "oral-surgery",
    name: "Oral Surgery",
    description: "Comprehensive surgical care for the mouth, jaws, and face.",
    icon: "◎",
    href: "/services/oral-surgery",
    services: [
      { slug: "wisdom-teeth-removal", name: "Wisdom Teeth Removal", href: "/services/oral-surgery/wisdom-teeth-removal" },
      { slug: "tooth-extractions", name: "Tooth Extractions", href: "/services/oral-surgery/tooth-extractions" },
      { slug: "canine-exposure", name: "Canine Exposure", href: "/services/oral-surgery/canine-exposure" },
      { slug: "oral-biopsy", name: "Oral Biopsy", href: "/services/oral-surgery/oral-biopsy" },
      { slug: "frenectomy", name: "Frenectomy", href: "/services/oral-surgery/frenectomy" },
      { slug: "apicoectomy", name: "Apicoectomy", href: "/services/oral-surgery/apicoectomy" },
      { slug: "alveoloplasty", name: "Alveoloplasty", href: "/services/oral-surgery/alveoloplasty" },
      { slug: "pre-prosthetic-surgery", name: "Pre-Prosthetic Surgery", href: "/services/oral-surgery/pre-prosthetic-surgery" },
      { slug: "nitrous-oxide", name: "Nitrous Oxide", href: "/services/oral-surgery/nitrous-oxide" },
      { slug: "iv-sedation", name: "IV Sedation", href: "/services/oral-surgery/iv-sedation" },
      { slug: "general-anesthesia", name: "General Anesthesia", href: "/services/oral-surgery/general-anesthesia" },
    ],
  },
  {
    slug: "implants-bone-grafting",
    name: "Implants & Bone Grafting",
    description: "Advanced procedures to rebuild and strengthen the jawbone.",
    icon: "✦",
    href: "/services/implants-bone-grafting",
    services: [
      { slug: "bone-grafting", name: "Bone Grafting", href: "/services/implants-bone-grafting/bone-grafting" },
      { slug: "ridge-augmentation", name: "Ridge Augmentation", href: "/services/implants-bone-grafting/ridge-augmentation" },
      { slug: "sinus-lifts", name: "Sinus Lifts", href: "/services/implants-bone-grafting/sinus-lifts" },
    ],
  },
  {
    slug: "specialty-services",
    name: "Specialty Services",
    description: "Targeted therapeutic and restorative dental services.",
    icon: "●",
    href: "/services/specialty-services",
    services: [
      { slug: "dental-implants", name: "Dental Implants", href: "/services/specialty-services/dental-implants" },
      { slug: "all-on-x", name: "All-On-X", href: "/services/specialty-services/all-on-x" },
      { slug: "implant-supported-dentures", name: "Implant Supported Dentures", href: "/services/specialty-services/implant-supported-dentures" },
      { slug: "single-tooth-implant", name: "Single Tooth Implant", href: "/services/specialty-services/single-tooth-implant" },
      { slug: "botox-for-tmd", name: "Botox for TMD", href: "/services/specialty-services/botox-for-tmd" },
      { slug: "tmj-therapy", name: "TMJ Therapy", href: "/services/specialty-services/tmj-therapy" },
      { slug: "occlusal-guards", name: "Occlusal Guards", href: "/services/specialty-services/occlusal-guards" },
    ],
  },
];

export interface NavLink {
  href: string;
  label: string;
}

export interface NavSection {
  label: string;
  href: string;
  items: NavLink[];
}

export const mainNavLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/doctors", label: "Doctors" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export const aboutSections: NavSection[] = [
  { label: "About CityDental", href: "/about", items: [] },
  { label: "Our Approach", href: "/about", items: [] },
  { label: "Meet Our Doctor", href: "/doctors/dr-kamlesh-kumar-yadav", items: [] },
];

export const patientResourceSections: NavSection[] = [
  { label: "New Patients", href: "/patient-resources/new-patients", items: [] },
  { label: "Patient Forms", href: "/patient-resources/forms", items: [] },
  { label: "What to Expect", href: "/patient-resources/what-to-expect", items: [] },
  { label: "Frequently Asked Questions", href: "/patient-resources/faqs", items: [] },
];

export const footerLinks = {
  quick: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/doctors", label: "Doctors" },
    { href: "/careers", label: "Careers" },
    { href: "/contact", label: "Contact" },
    { href: "/patient-resources", label: "Patient Resources" },
  ],
  services: serviceCategories.map(c => ({ href: c.href, label: c.name })),
  care: [
    { href: "/patient-resources/new-patients", label: "New Patients" },
    { href: "/patient-resources/what-to-expect", label: "What to Expect" },
    { href: "/book-appointment", label: "Book Appointment" },
  ],
};

export const doctorProfile = {
  slug: "dr-kamlesh-kumar-yadav",
  fullName: "Dr. Kamlesh Kumar Yadav",
  role: "Dentist",
  brand: "CityDental",
  introduction: "Dr. Kamlesh Kumar Yadav is a dedicated dental professional providing patient-focused care at CityDental in Etah.",
  contact: {
    address: "Shop No. 5, Yadav Market, MG Road, Etah, 701012",
    phone: "+91 94151 92948",
    whatsapp: "+91 94151 92948",
    email: "citydentalEtah@gmail.com",
  },
};

export function getCategoryBySlug(slug: string): ServiceCategory | undefined {
  return serviceCategories.find(c => c.slug === slug);
}

export function getServiceBySlug(categorySlug: string, serviceSlug: string): { category: ServiceCategory; service: ServiceItem } | undefined {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return undefined;
  const service = category.services.find(s => s.slug === serviceSlug);
  if (!service) return undefined;
  return { category, service };
}

export function getAllServiceSlugs(): Array<{ category: string; service: string }> {
  return serviceCategories.flatMap(category =>
    category.services.map(service => ({ category: category.slug, service: service.slug }))
  );
}

export function getCategorySlugs(): string[] {
  return serviceCategories.map(c => c.slug);
}

export function isServiceRelated(categorySlug: string): ServiceCategory | undefined {
  return serviceCategories.find(c => c.slug === categorySlug);
}
