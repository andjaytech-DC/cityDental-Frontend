import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CityDental — thoughtful dental care in Etah",
    short_name: "CityDental",
    description: "Patient information, services, doctor directory and appointment booking for CityDental in Etah.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f6f0",
    theme_color: "#235c55",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
