import type { AppointmentDto, DoctorDto, PatientDto } from "@citydental/types";
import { AccessErrorState, Badge, Card, EmptyState, ErrorState, Input, LoadingState, PageHeading, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";

export type WorkspaceState<T> =
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "denied" }
  | { status: "ready"; items: readonly T[] };

interface Column<T> {
  heading: string;
  value: (item: T) => string;
  className?: string;
}

function WorkspaceList<T extends { id: string }>({
  title,
  description,
  state,
  columns,
  searchPlaceholder,
}: {
  title: string;
  description: string;
  state: WorkspaceState<T>;
  columns: readonly Column<T>[];
  searchPlaceholder?: string;
}) {
  return <>
    <PageHeading title={title} description={description} />
    {searchPlaceholder ? <div className="mb-6 max-w-lg">
      <Input label={`Search ${title.toLowerCase()}`} type="search" disabled
        hint={searchPlaceholder} />
    </div> : null}
    <Card>
      {state.status === "unavailable" ? <>
        <Badge variant="warning">Contract-ready · API unavailable</Badge>
        <EmptyState title={`${title} API unavailable`} description={`The shared ${title.toLowerCase()} contract is defined, but no NestJS list endpoint is connected. No records have been loaded.`} />
      </> : state.status === "loading" ? <LoadingState label={`Loading ${title.toLowerCase()}…`} />
        : state.status === "denied" ? <AccessErrorState />
          : state.status === "error" ? <ErrorState title={`Unable to load ${title.toLowerCase()}`} />
            : state.items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} description="There are no records to display for this result." />
              : <Table aria-label={`${title} list`}>
                <TableHead><TableRow>{columns.map(column => <TableHeader key={column.heading}>{column.heading}</TableHeader>)}</TableRow></TableHead>
                <TableBody>{state.items.map(item => <TableRow key={item.id}>
                  {columns.map(column => <TableCell key={column.heading} className={column.className}>{column.value(item)}</TableCell>)}
                </TableRow>)}</TableBody>
              </Table>}
    </Card>
  </>;
}

const patientColumns: readonly Column<PatientDto>[] = [
  { heading: "Name", value: patient => `${patient.firstName} ${patient.lastName}` },
  { heading: "Patient number", value: patient => patient.patientNumber ?? "Not provided" },
  { heading: "Email", value: patient => patient.email ?? "Not provided" },
  { heading: "Phone", value: patient => patient.phone ?? "Not provided" },
  { heading: "City", value: patient => patient.city ?? "Not provided" },
  { heading: "Status", value: patient => patient.status },
];
const doctorColumns: readonly Column<DoctorDto>[] = [
  { heading: "Name", value: doctor => `${doctor.firstName} ${doctor.lastName}` },
  { heading: "Email", value: doctor => doctor.email ?? "Not provided" },
  { heading: "Phone", value: doctor => doctor.phone ?? "Not provided" },
  { heading: "Qualifications", value: doctor => doctor.qualifications ?? "Not provided" },
  { heading: "Specialties", value: doctor => doctor.specialties.length ? doctor.specialties.join(", ") : "Not provided" },
  { heading: "Status", value: doctor => doctor.status },
];

/** These views consume validated DTOs; they do not fetch, authorize or invent records. */
export function PatientWorkspace({ state }: { state: WorkspaceState<PatientDto> }) {
  return <WorkspaceList title="Patients" description="Patient identity and contact information for your practice." state={state} columns={patientColumns}
    searchPlaceholder="Search is not connected. It will be enabled when the list API is available." />;
}
export function DoctorWorkspace({ state }: { state: WorkspaceState<DoctorDto> }) {
  return <WorkspaceList title="Doctors" description="Practice team contact information and recorded qualifications." state={state} columns={doctorColumns}
    searchPlaceholder="Search is not connected. It will be enabled when the list API is available." />;
}

const appointmentColumns: readonly Column<AppointmentDto>[] = [
  // Synthetic fixture values only. Time offsets are not converted to clinic time.
  { heading: "Start (API offset)", value: item => item.scheduledStart },
  { heading: "End (API offset)", value: item => item.scheduledEnd },
  { heading: "Patient ID", value: item => item.patientId },
  { heading: "Doctor ID", value: item => item.doctorId ?? "Not assigned" },
  { heading: "Location ID", value: item => item.locationId },
  { heading: "Status", value: item => item.status },
];
export function AppointmentWorkspace({ state }: { state: WorkspaceState<AppointmentDto> }) {
  return <WorkspaceList title="Appointments" description="Appointment times, linked record identifiers and status. No scheduling rules run in this view." state={state} columns={appointmentColumns} />;
}
