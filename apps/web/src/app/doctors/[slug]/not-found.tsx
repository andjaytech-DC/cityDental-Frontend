import Link from "next/link";
import { PageHeading, EmptyState } from "@/components/ui";

export default function DoctorNotFound() {
  return (
    <>
      <PageHeading title="Doctor not found" />
      <EmptyState title="This doctor profile is not available" description="The doctor you are looking for may not yet be listed. Please check the URL or explore the doctor directory." action={<Link href="/doctors" className="cd-button cd-button-primary">View Doctors</Link>} />
    </>
  );
}