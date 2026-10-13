/**
 * CityDental service catalog.
 *
 * This is the structured information architecture for the public services experience.
 * Content is original CityDental copy. It does not copy third-party websites.
 * Future clinic-managed content will be served through the API layer.
 */

export interface ServiceItem {
  slug: string;
  name: string;
  description: string;
  longerDescription?: string;
}

export interface ServiceCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
  services: ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "oral-surgery",
    name: "Oral Surgery",
    description: "Comprehensive surgical care for the mouth, jaws, and face. Our oral surgery team addresses complex conditions with precision and care.",
    icon: "◎",
    services: [
      {
        slug: "wisdom-teeth-removal",
        name: "Wisdom Teeth Removal",
        description: "Removal of third molars that are impacted, partially erupted, or positioned in a way that may cause complications.",
        longerDescription: "Wisdom teeth, also known as third molars, often emerge in the late teens or early twenties. When there is insufficient space for proper eruption, they may become impacted or cause crowding, infection, or discomfort. Our oral surgeons evaluate each case individually and recommend the most appropriate approach.",
      },
      {
        slug: "tooth-extractions",
        name: "Tooth Extractions",
        description: "Careful removal of teeth that cannot be restored or that may affect overall oral health.",
        longerDescription: "Extractions may be necessary when a tooth is severely decayed, damaged, or infected beyond what restorative treatment can address. Our team prioritizes preserving natural teeth whenever possible and provides compassionate care throughout the extraction process.",
      },
      {
        slug: "canine-exposure",
        name: "Canine Exposure",
        description: "Surgical exposure of impacted canine teeth to guide them into their proper position.",
        longerDescription: "When canine teeth fail to emerge naturally, a surgical procedure can expose the tooth and attach a bracket to guide it into alignment. This treatment is often part of a coordinated plan with orthodontic care.",
      },
      {
        slug: "oral-biopsy",
        name: "Oral Biopsy",
        description: "Diagnostic sampling of oral tissue to investigate unusual lesions, patches, or growths.",
        longerDescription: "An oral biopsy involves removing a small sample of tissue from the mouth for laboratory examination. This procedure helps diagnose conditions affecting the soft and hard tissues of the oral cavity and supports timely, appropriate treatment planning.",
      },
      {
        slug: "frenectomy",
        name: "Frenectomy",
        description: "Removal or adjustment of the frenulum tissue that restricts tongue or lip movement.",
        longerDescription: "A frenectomy addresses a restrictive frenulum, the small fold of tissue that connects the lip or tongue to the gum. This procedure may be recommended when the frenulum limits movement and affects function or comfort.",
      },
      {
        slug: "apicoectomy",
        name: "Apicoectomy",
        description: "Surgical removal of the tip of a tooth root to address persistent infection after prior root canal treatment.",
        longerDescription: "When a previous root canal treatment does not fully resolve an infection at the root tip, an apicoectomy removes the inflamed tissue and the very end of the root. This procedure aims to preserve the natural tooth and restore oral health.",
      },
      {
        slug: "alveoloplasty",
        name: "Alveoloplasty",
        description: "Reshaping of the jawbone to create a smooth, well-contoured foundation for dentures or other restorations.",
        longerDescription: "Alveoloplasty involves contouring the alveolar ridge to remove irregular bone prominences. This creates a more comfortable and stable foundation for prosthetic appliances, improving fit and function.",
      },
      {
        slug: "pre-prosthetic-surgery",
        name: "Pre-Prosthetic Surgery",
        description: "Surgical preparation of the mouth to support the placement of dentures or other prosthetic devices.",
        longerDescription: "Before a denture or other prosthetic device can be placed, the mouth may require surgical preparation. This can include ridge modification, removal of excess tissue, or bone smoothing to ensure optimal comfort and stability of the final prosthesis.",
      },
      {
        slug: "nitrous-oxide",
        name: "Nitrous Oxide / Laughing Gas",
        description: "Inhaled sedation to help patients feel calm and comfortable during dental procedures.",
        longerDescription: "Nitrous oxide is a gentle inhalation sedation option that helps patients feel relaxed during dental treatment. The effects wear off quickly after the mask is removed, allowing patients to resume normal activities right away.",
      },
      {
        slug: "iv-sedation",
        name: "IV Sedation",
        description: "Intravenous sedation for patients who require a deeper level of relaxation during oral surgery.",
        longerDescription: "IV sedation delivers medication directly into the bloodstream, providing a deeper level of relaxation. Patients remain conscious but typically have limited memory of the procedure. This option is carefully administered and monitored by our surgical team.",
      },
      {
        slug: "general-anesthesia",
        name: "General Anesthesia",
        description: "Complete unconsciousness for patients undergoing extensive oral surgery procedures.",
        longerDescription: "General anesthesia may be appropriate for patients undergoing lengthy or complex surgical procedures, or for those who prefer to be completely unaware during treatment. A trained anesthesiologist or certified professional monitors the patient throughout the procedure.",
      },
    ],
  },
  {
    slug: "implants-bone-grafting",
    name: "Implants & Bone Grafting",
    description: "Advanced procedures to rebuild and strengthen the jawbone foundation, supporting durable tooth replacement solutions.",
    icon: "✦",
    services: [
      {
        slug: "bone-grafting",
        name: "Bone Grafting",
        description: "Rebuilding jawbone volume to provide a stable foundation for dental implants or other restorations.",
        longerDescription: "When the jawbone lacks sufficient density or volume to support a dental implant, bone grafting adds material to strengthen the site. This procedure can use natural, synthetic, or processed bone materials and helps create a solid foundation for future restoration.",
      },
      {
        slug: "ridge-augmentation",
        name: "Ridge Augmentation",
        description: "Rebuilding the alveolar ridge after tooth loss to restore its natural shape and dimensions.",
        longerDescription: "Tooth loss can cause the alveolar ridge to deteriorate over time. Ridge augmentation procedures restore the natural contours of the jaw, creating a more stable and aesthetic foundation for dentures, bridges, or implants.",
      },
      {
        slug: "sinus-lifts",
        name: "Sinus Lifts",
        description: "Surgical augmentation of the sinus floor to add bone volume in the upper jaw for implant placement.",
        longerDescription: "When the sinus cavities are close to the upper jawbone, there may be insufficient bone for implant placement. A sinus lift raises the sinus floor and adds graft material, creating enough bone volume to support a dental implant securely.",
      },
    ],
  },
  {
    slug: "specialty-services",
    name: "Specialty Services",
    description: "Targeted therapeutic and restorative services addressing specific oral health needs with modern techniques.",
    icon: "●",
    services: [
      {
        slug: "dental-implants",
        name: "Dental Implants",
        description: "A modern approach to tooth replacement that provides a strong, stable foundation for replacement teeth.",
        longerDescription: "Dental implants are titanium posts placed into the jawbone to serve as artificial tooth roots. Once integrated with the bone, they support crowns, bridges, or dentures that look, feel, and function like natural teeth. Your dentist or oral health professional can determine whether this option is appropriate for you.",
      },
      {
        slug: "all-on-x",
        name: "All-On-X",
        description: "A comprehensive implant-supported full-arch restoration for patients missing most or all of their teeth.",
        longerDescription: "All-On-X is a treatment concept that uses a strategic number of dental implants to support a full arch of replacement teeth. This approach can restore function and aesthetics for patients who have lost multiple teeth, often eliminating the need for a traditional removable denture.",
      },
      {
        slug: "implant-supported-dentures",
        name: "Implant Supported Dentures",
        description: "Dentures anchored by dental implants for improved stability and comfort compared to traditional removable options.",
        longerDescription: "Implant-supported dentures attach to dental implants placed in the jawbone, providing greater stability and retention than traditional dentures. This option can improve chewing function and comfort while reducing movement during daily activities.",
      },
      {
        slug: "single-tooth-implant",
        name: "Single Tooth Implant",
        description: "A standalone implant and crown to replace one missing tooth without affecting adjacent natural teeth.",
        longerDescription: "A single tooth implant replaces one missing tooth with an artificial root and crown. This approach preserves the health of neighboring teeth and helps maintain the natural bone structure. Your oral health professional can evaluate whether this option is suitable for your situation.",
      },
      {
        slug: "botox-for-tmd",
        name: "Botox for TMD",
        description: "Therapeutic use of botulinum toxin to address tension and discomfort associated with temporomandibular joint disorders.",
        longerDescription: "Botox may be used therapeutically to manage muscle tension related to temporomandibular joint disorders. This treatment is carefully administered and evaluated by qualified professionals. Your dentist or oral health professional can determine whether this approach is appropriate for you.",
      },
      {
        slug: "tmj-therapy",
        name: "TMJ Therapy",
        description: "Non-surgical approaches to address temporomandibular joint discomfort, including splints, bite adjustment, and therapy.",
        longerDescription: "TMJ therapy focuses on managing discomfort and improving function of the temporomandibular joint. Treatment options may include oral appliances, physical therapy recommendations, and lifestyle modifications. The appropriate approach depends on your individual condition and is determined by your dental professional.",
      },
      {
        slug: "occlusal-guards",
        name: "Occlusal Guards",
        description: "Custom-fitted oral appliances designed to protect teeth from grinding and clenching during sleep or daytime habits.",
        longerDescription: "Occlusal guards, also known as night guards, are custom-made appliances that help protect teeth from the effects of grinding and clenching. They can reduce wear, prevent fractures, and alleviate associated discomfort. Your dental professional can determine whether an occlusal guard is appropriate for you.",
      },
    ],
  },
];

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
