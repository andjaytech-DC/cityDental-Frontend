/**
 * @citydental/types — shared contracts
 *
 * Single source of truth for types crossing a process boundary:
 *   web  → api        (HTTP request/response DTOs)
 *   api  → worker     (BullMQ job payloads)
 *
 * Must stay dependency-free so every runtime (browser, Node, edge)
 * can import it safely.
 */

/* ──────────────────────────────────────────────────────────────
   Roles & permissions
   ────────────────────────────────────────────────────────────── */

export const ROLE_NAMES = [
  "OWNER",
  "ORG_ADMIN",
  "LOCATION_ADMIN",
  "DOCTOR",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "PATIENT",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

/** Permission codes are `resource:action`. */
export const PERMISSIONS = [
  "organization:read",
  "organization:manage",
  "location:read",
  "location:manage",
  "user:read",
  "user:manage",
  "role:read",
  "role:manage",
  "patient:read",
  "patient:create",
  "patient:update",
  "patient:archive",
  "doctor:read",
  "doctor:manage",
  "appointment:read",
  "appointment:create",
  "appointment:update",
  "appointment:cancel",
  "audit:read",
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

/* ──────────────────────────────────────────────────────────────
   Transport primitives
   ────────────────────────────────────────────────────────────── */

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  /** Correlation id echoed from the request, for support triage. */
  requestId?: string;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/* ─────────────────────────────────────────────────────────────
   Auth
   ────────────────────────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
  organizationSlug?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationSlug: string;
  isSuperAdmin: boolean;
  roles: RoleName[];
  permissions: PermissionCode[];
  /** Locations the user may act on. Empty means organization-wide. */
  locationIds: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface JwtAccessPayload {
  sub: string;
  org: string;
  email: string;
  roles: RoleName[];
  /** Token version; a mismatch with the DB invalidates the token. */
  ver: number;
}

export interface JwtRefreshPayload extends JwtAccessPayload {
  type: "refresh";
}

/* ──────────────────────────────────────────────────────────────
   Domain DTOs
   ────────────────────────────────────────────────────────────── */

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  timezone: string;
  createdAt: string;
}

export interface LocationDto {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  city: string | null;
  state: string | null;
  country: string;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface PatientDto {
  id: string;
  organizationId: string;
  primaryLocationId: string | null;
  patientNumber: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface DoctorDto {
  id: string;
  organizationId: string;
  primaryLocationId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  qualifications: string | null;
  specialties: string[];
  status: "ACTIVE" | "INACTIVE";
}

export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses that still occupy a doctor's calendar slot. */
export const BLOCKING_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
];

export interface AppointmentDto {
  id: string;
  organizationId: string;
  locationId: string;
  patientId: string;
  doctorId: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  source: "STAFF" | "PATIENT_PORTAL" | "PHONE" | "WALK_IN";
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────
   Worker / queue contracts
   ────────────────────────────────────────────────────────────── */

export const QUEUE_NAMES = [
  "notifications",
  "email",
  "sms",
  "whatsapp",
  "appointment-reminders",
  "recalls",
  "reports",
  "documents",
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export interface NotificationJob {
  organizationId: string;
  channel: "email" | "sms" | "whatsapp";
  to: string;
  template: string;
  variables: Record<string, string>;
}

export interface AppointmentReminderJob {
  organizationId: string;
  appointmentId: string;
  /** Hours before the appointment the reminder should fire. */
  leadHours: number;
}

export interface RecallJob {
  organizationId: string;
  patientId: string;
  recallType: string;
}

export interface ReportJob {
  organizationId: string;
  reportType: string;
  requestedByUserId: string;
  params?: Record<string, string>;
}

export interface DocumentJob {
  organizationId: string;
  documentType: string;
  entityId: string;
}

export interface JobPayloadMap {
  notifications: NotificationJob;
  email: NotificationJob;
  sms: NotificationJob;
  whatsapp: NotificationJob;
  "appointment-reminders": AppointmentReminderJob;
  recalls: RecallJob;
  reports: ReportJob;
  documents: DocumentJob;
}