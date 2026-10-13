import Link from "next/link";
import { PageHeading, EmptyState } from "@/components/ui";

export default function ServiceNotFound() {
  return (
    <>
      <PageHeading title="Service not found" />
      <EmptyState title="This service page is not available" description="The service you are looking for may not yet be listed or may have a different address. Please check the URL or explore our service categories." action={<Link href="/services" className="cd-button cd-button-primary">Explore Services</Link>} />
    </>
  );
}