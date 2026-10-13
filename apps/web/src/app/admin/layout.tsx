import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, clearAuthCookies } from "@/lib/auth/session";
import { AdminNav } from "./AdminNav";
import { AdminMobileNav } from "./AdminMobileNav";
import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  const canAudit = session.isSuperAdmin || session.permissions.includes("audit:read");
  const canPatients = session.permissions.includes("patient:read") || session.isSuperAdmin;
  const canDoctors = session.permissions.includes("doctor:read") || session.isSuperAdmin;
  const canAppointments = session.permissions.includes("appointment:read") || session.isSuperAdmin;
  const canUsers = session.permissions.includes("user:read") || session.isSuperAdmin;
  const canLocations = session.isSuperAdmin || session.permissions.includes("location:read");

  const navItems = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/patients", label: "Patients", show: canPatients },
    { href: "/admin/doctors", label: "Doctors", show: canDoctors },
    { href: "/admin/appointments", label: "Appointments", show: canAppointments },
    { href: "/admin/locations", label: "Locations", show: canLocations },
    { href: "/admin/communications", label: "Communications", show: true },
    { href: "/admin/reports", label: "Reports", show: true },
    { href: "/admin/users", label: "Users", show: canUsers },
    { href: "/admin/audit", label: "Audit Log", show: canAudit },
    { href: "/admin/settings", label: "Settings", show: true },
    { href: "/workspace", label: "Workspace", show: true },
  ];

  return (
    <div className="admin-dark">
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Admin sidebar">
          <Link href="/admin" className="admin-sidebar-brand">
            <span className="admin-brand-mark">CD</span>
            <span>
              CityDental
              <small>Admin · {session.organizationSlug}</small>
            </span>
          </Link>
          <AdminNav items={navItems} />
          <div className="admin-sidebar-footer">
            <div>
              <strong>
                {session.firstName} {session.lastName}
              </strong>
            </div>
            <div className="truncate" style={{ color: "var(--admin-text-secondary)" }}>
              {session.email}
            </div>
            <div style={{ color: "var(--admin-text-muted)" }}>{session.roles.slice(0, 2).join(" · ")}</div>
          </div>
        </aside>
        <div className="admin-main">
          <header className="admin-header">
            <div className="flex items-center gap-3 min-w-0">
              <AdminMobileNav items={navItems} />
              <span className="admin-brand">
                CityDental <span>Admin</span>
              </span>
              <span className="cd-muted text-xs hidden sm:inline" style={{ color: "var(--admin-text-secondary)" }}>
                Operational · server-authorized
              </span>
            </div>
            <form
              action={async () => {
                "use server";
                clearAuthCookies();
                redirect("/login");
              }}
            >
              <button className="cd-button cd-button-secondary text-xs" type="submit">
                Sign out
              </button>
            </form>
          </header>
          <main className="admin-container">{children}</main>
        </div>
      </div>
    </div>
  );
}
