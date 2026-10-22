import { Badge, Card, CardLink, EmptyState, PageHeading, Table, TableHead, TableBody, TableRow, TableHeader, TableEmpty } from "@/components/ui";
import { WorkspaceHelp } from "@/components/WorkspaceHelp";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Workspace | City Dental",
  description: "CityDental practice workspace. Sign in to view appointments and patient administration.",
  path: "/workspace",
  noIndex: true,
});

export default function HomePage() {
  return <>
    <PageHeading title="Your practice, in one place" description="Welcome to City Dental. A clear workspace for your team, appointments and patient administration." />
    <div className="mb-8"><WorkspaceHelp /></div>
    <section id="workspace" aria-label="Workspace readiness" className="cd-summary-grid mb-8 scroll-mt-6">
      <Card title="Appointments"><Badge variant="neutral">Not connected</Badge><p className="cd-muted mt-3 text-sm">Connect the appointments API to view your schedule. No appointment data is loaded.</p></Card>
      <Card title="Patients"><Badge variant="neutral">Not connected</Badge><p className="cd-muted mt-3 text-sm">Patient records will be available when the patient API is connected.</p></Card>
      <Card title="Doctors"><Badge variant="neutral">Not connected</Badge><p className="cd-muted mt-3 text-sm">Connect the doctors API to view your practice team.</p></Card>
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card title="Appointment overview">
        <Table aria-label="Appointment overview">
          <TableHead><TableRow><TableHeader>Time</TableHeader><TableHeader>Patient</TableHeader><TableHeader>Doctor</TableHeader><TableHeader>Status</TableHeader></TableRow></TableHead>
          <TableBody><TableEmpty colSpan={4}>Connect the API to view appointments.</TableEmpty></TableBody>
        </Table>
      </Card>
      <CardLink href="/login" title="Sign in to your workspace">Use the email and password associated with your existing account. Sign-in requires the authentication service.</CardLink>
    </div>
    <section className="mt-6" aria-label="Workspace activity">
      <Card title="Workspace activity"><EmptyState title="Activity is not available yet" description="Updates will appear here when an activity source is connected. No activity history has been loaded." /></Card>
    </section>
  </>;
}

