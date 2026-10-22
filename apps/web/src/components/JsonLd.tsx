import type { JsonLdData } from "@/lib/schema";

/**
 * Renders JSON-LD structured data. `<` is escaped so user-supplied content can
 * never terminate the script element.
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
