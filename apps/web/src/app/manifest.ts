import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CityDental — healthy smiles for a brighter life",
    short_name: "CityDental",
    description: "Patient information, services, verified doctor details and appointment requests for CityDental in Etah.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F6EF",
    theme_color: "#153F38",
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
