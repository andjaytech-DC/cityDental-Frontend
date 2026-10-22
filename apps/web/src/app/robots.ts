import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Public pages are crawlable. Authenticated and internal surfaces are not:
 * they either redirect to /login or expose operational data.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/appointments/book"],
        disallow: ["/admin", "/admin/", "/api/", "/workspace", "/login", "/patients", "/appointments"],
      },
      {
        // ChatGPT Search (OAI-SearchBot), ChatGPT browsing (ChatGPT-User) and
        // OpenAI's crawler may index public content, never private surfaces.
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "GPTBot"],
        allow: ["/", "/appointments/book"],
        disallow: ["/admin", "/admin/", "/api/", "/workspace", "/login", "/patients", "/appointments"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: new URL(SITE_URL).host,
  };
}
