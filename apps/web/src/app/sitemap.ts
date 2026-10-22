import type { MetadataRoute } from "next";
import { doctorSlugs } from "@/lib/doctors";
import { absoluteUrl } from "@/lib/seo";
import { getAllServiceSlugs, serviceCategories } from "@/lib/services";

export const dynamic = "force-static";

const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/about"), lastModified, changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/doctors"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/services"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/patient-resources"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/patient-resources/new-patients"), lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/patient-resources/forms"), lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/patient-resources/what-to-expect"), lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/patient-resources/faqs"), lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/careers"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: absoluteUrl("/book-appointment"), lastModified, changeFrequency: "monthly", priority: 0.9 },
  ];

  const doctorRoutes: MetadataRoute.Sitemap = doctorSlugs.map(slug => ({
    url: absoluteUrl(`/doctors/${slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = serviceCategories.map(category => ({
    url: absoluteUrl(`/services/${category.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = getAllServiceSlugs().map(({ category, service }) => ({
    url: absoluteUrl(`/services/${category}/${service}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...doctorRoutes, ...categoryRoutes, ...serviceRoutes];
}
