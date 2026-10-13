export const doctorProfile = {
  fullName: "Dr. Kamlesh Kumar Yadav",
  slug: "dr-kamlesh-kumar-yadav",
  role: "Dentist",
  brand: "CityDental",
  location: "Etah, Uttar Pradesh",
  contact: {
    phone: "+91 94151 92948",
    email: "citydentalEtah@gmail.com",
    whatsapp: "+91 94151 92948",
    address: "Shop No. 5, Yadav Market, MG Road, Etah, 701012",
  },
  introduction: "Committed to patient-focused care at CityDental.",
};

export const doctorSlugs = [doctorProfile.slug];

export function getDoctorBySlug(slug: string): typeof doctorProfile | undefined {
  if (slug === doctorProfile.slug) return doctorProfile;
  return undefined;
}
