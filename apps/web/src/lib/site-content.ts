/**
 * Local, licensed stock photography used for illustrative marketing sections.
 *
 * These images show generic dental settings and are deliberately captioned so
 * they are not presented as photographs of CityDental's clinic or team. Replace
 * an entry only with clinic-approved, licensed photography.
 *
 * Sources and licence notes are recorded in public/images/CREDITS.md.
 */
export const siteImages = {
  heroClinic: {
    src: "/images/clinic-hero.jpg",
    alt: "A dentist speaking with a patient in a bright, modern treatment room",
    caption: "Illustrative stock photography — not a photograph of CityDental's clinic or team.",
    width: 1800,
    height: 1200,
  },
  consultation: {
    src: "/images/clinic-consultation.jpg",
    alt: "A dentist discussing a dental scan with a patient during a consultation",
    caption: "Illustrative dental setting, not a photograph of the CityDental clinic.",
    width: 1600,
    height: 1200,
  },
  careers: {
    src: "/images/dental-careers.jpg",
    alt: "A dental professional working with a dental microscope in a treatment room",
    caption: "Illustrative dental setting, not a photograph of the CityDental team.",
    width: 1600,
    height: 1067,
  },
  aboutCare: {
    src: "/images/about-care.jpg",
    alt: "A dentist showing a patient their smile in a hand mirror",
    caption: "Illustrative stock photography, not a photograph of the CityDental team.",
    width: 1400,
    height: 933,
  },
  serviceDetail: {
    src: "/images/dental-detail.jpg",
    alt: "Close-up of a dental model being prepared in a treatment setting",
    caption: "Illustrative dental detail, not a photograph of CityDental's equipment.",
    width: 1400,
    height: 933,
  },
} as const;
