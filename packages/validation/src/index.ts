/**
 * @citydental/validation — shared Zod schemas
 *
 * These schemas are the contract boundary. The API validates every
 * inbound payload with them; the web app reuses them for client-side
 * form validation so the two can never drift apart.
 */

import { z } from "zod";
import { PERMISSIONS } from "@citydental/types";

/* ─────────────────────────────────────────────────────────────
   Primitives
   ────────────────────────────────────────────────────────────── */

export const uuidSchema = z.string().uuid();

export const isoDateSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Must be a valid ISO-8601 date-time",
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export const emailSchema = z.string().email().max(320);

/** Deliberately permissive: Indian numbers vary (with/without +91). */
export const phoneSchema = z
  .string()
  .min(6)
  .max(20)
  .regex(/^[0-9+()\-\s]+$/, "Must be a valid phone number");

/* ─────────────────────────────────────────────────────────────
   Auth
   ────────────────────────────────────────────────────────────── */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  organizationSlug: z.string().min(2).max(64).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* ──────────────────────────────────────────────────────────────
   Organization & location
   ────────────────────────────────────────────────────────────── */

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and hyphens only"),
  timezone: z.string().min(2).max(64).default("Asia/Kolkata"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const createLocationSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().min(1).max(32).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default("India"),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export const updateLocationSchema = createLocationSchema.partial();
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

/* ──────────────────────────────────────────────────────────────
   Patients
   ────────────────────────────────────────────────────────────── */

export const patientStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);

export const createPatientSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dateOfBirth: isoDateSchema.optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  primaryLocationId: uuidSchema.optional(),
  patientNumber: z.string().max(40).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema
  .partial()
  .extend({ status: patientStatusSchema.optional() });

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const listPatientsQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(120).optional(),
  status: patientStatusSchema.optional(),
  locationId: uuidSchema.optional(),
});

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;

/* ──────────────────────────────────────────────────────────────
   Doctors
   ────────────────────────────────────────────────────────────── */

export const doctorStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createDoctorSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  licenseNumber: z.string().max(64).optional(),
  qualifications: z.string().max(200).optional(),
  primaryLocationId: uuidSchema.optional(),
  specialties: z.array(z.string().min(2).max(120)).max(20).default([]),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;

export const updateDoctorSchema = createDoctorSchema
  .partial()
  .extend({ status: doctorStatusSchema.optional() });

export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

export const listDoctorsQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(120).optional(),
  status: doctorStatusSchema.optional(),
  locationId: uuidSchema.optional(),
});

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;

/* ──────────────────────────────────────────────────────────────
   Appointments
   ────────────────────────────────────────────────────────────── */

export const appointmentStatusSchema = z.enum([
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const appointmentSourceSchema = z.enum([
  "STAFF",
  "PATIENT_PORTAL",
  "PHONE",
  "WALK_IN",
]);

export const createAppointmentSchema = z
  .object({
    patientId: uuidSchema,
    doctorId: uuidSchema.optional(),
    locationId: uuidSchema,
    scheduledStart: isoDateSchema,
    scheduledEnd: isoDateSchema,
    reason: z.string().max(300).optional(),
    notes: z.string().max(2000).optional(),
    source: appointmentSourceSchema.default("STAFF"),
  })
  .refine(
    (v) => Date.parse(v.scheduledEnd) > Date.parse(v.scheduledStart),
    { message: "scheduledEnd must be after scheduledStart", path: ["scheduledEnd"] },
  );

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z
  .object({
    doctorId: uuidSchema.nullable().optional(),
    scheduledStart: isoDateSchema.optional(),
    scheduledEnd: isoDateSchema.optional(),
    reason: z.string().max(300).optional(),
    notes: z.string().max(2000).optional(),
    status: appointmentStatusSchema.optional(),
  })
  .refine(
    (v) =>
      !v.scheduledStart ||
      !v.scheduledEnd ||
      Date.parse(v.scheduledEnd) > Date.parse(v.scheduledStart),
    { message: "scheduledEnd must be after scheduledStart", path: ["scheduledEnd"] },
  );

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

export const listAppointmentsQuerySchema = paginationQuerySchema.extend({
  /** Inclusive window bounds (ISO date-time). */
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  status: appointmentStatusSchema.optional(),
  patientId: uuidSchema.optional(),
  doctorId: uuidSchema.optional(),
  locationId: uuidSchema.optional(),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

/* ──────────────────────────────────────────────────────────────
   Users & roles
   ────────────────────────────────────────────────────────────── */

export const roleNameSchema = z.enum([
  "OWNER",
  "ORG_ADMIN",
  "LOCATION_ADMIN",
  "DOCTOR",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "PATIENT",
]);

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(10).max(128),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: phoneSchema.optional(),
  roles: z.array(roleNameSchema).min(1).max(7),
  /** Optional location scoping for every role in this request. */
  locationId: uuidSchema.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const assignRoleSchema = z.object({
  role: roleNameSchema,
  locationId: uuidSchema.optional(),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(120).optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

/* ──────────────────────────────────────────────────────────────
   API error & auth response contracts
   Shared by web (runtime response validation) and api (error shape).
   ────────────────────────────────────────────────────────────── */

export const apiErrorBodySchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.union([z.string(), z.array(z.string())]),
  requestId: z.string().optional(),
});

export type ApiErrorBodyInput = z.infer<typeof apiErrorBodySchema>;

export const authenticatedUserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationId: uuidSchema,
  organizationSlug: z.string().min(1),
  isSuperAdmin: z.boolean(),
  roles: z.array(roleNameSchema),
  permissions: z.array(z.enum(PERMISSIONS)),
  locationIds: z.array(uuidSchema),
});

export type AuthenticatedUserInput = z.infer<typeof authenticatedUserSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string().min(10),
  refreshToken: z.string().min(10),
  /** Access-token lifetime in seconds. */
  expiresIn: z.number().int().positive(),
});

export type AuthTokensInput = z.infer<typeof authTokensSchema>;

/** Shape returned by /auth/login and /auth/refresh. */
export const authResponseSchema = z.object({
  user: authenticatedUserSchema,
  tokens: authTokensSchema,
});

export type AuthResponseInput = z.infer<typeof authResponseSchema>;