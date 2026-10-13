import Link from "next/link";
import { PageHeading, EmptyState } from "@/components/ui";

export default function CategoryNotFound() {
  return (
    <>
      <PageHeading title="Category not found" />
      <EmptyState title="This service category is not available" description="The category you are looking for may not yet be listed. Please check our service categories or explore other areas of the website." action={<Link href="/services" className="cd-button cd-button-primary">Explore Services</Link>} />
    </>
  );
}