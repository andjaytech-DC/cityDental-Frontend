import { getSession } from "@/lib/auth/session";
import { PageHeading, Card } from "@/components/ui";
import { ChangePasswordForm } from "./form";

export const metadata = { title: "Settings | CityDental Admin" };

export default async function SettingsPage() {
  const s = await getSession();
  if (!s) return null;
  return (
    <>
      <PageHeading title="Settings" description="Account security — password change invalidates existing sessions via tokenVersion." />
      <Card title="Change password">
        <ChangePasswordForm />
      </Card>
      <Card title="Session">
        <div className="text-sm space-y-1">
          <div>Email: {s.email}</div>
          <div>Organization: {s.organizationSlug}</div>
          <div>Roles: {s.roles.join(", ")}</div>
          <div>Location scope: {s.isOrgWide ? "Organization-wide" : s.locationIds.length ? s.locationIds.join(", ") : "None"}</div>
        </div>
      </Card>
    </>
  );
}
