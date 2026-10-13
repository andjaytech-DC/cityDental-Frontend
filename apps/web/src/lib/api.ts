import type { ApiErrorBody, AuthenticatedUser } from "@citydental/types";
import { apiErrorBodySchema, authenticatedUserSchema } from "@citydental/validation";
import type { ZodType } from "zod";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: Record<string, string>;
}

function toErrorMessage(body: ApiErrorBody | null): string {
  if (!body) return "Request failed";
  return Array.isArray(body.message) ? body.message.join("; ") : body.message;
}

/**
 * Typed fetch wrapper around the NestJS API.
 *
 * Responses are returned as-is; callers should validate payloads with the
 * shared Zod schemas from @citydental/validation before trusting them.
 * No business logic and no database access live here — the only transport
 * target is the NestJS API.
 */
export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<unknown> {
  const token = getStoredTokens().access;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // Safe JSON parsing: empty or non-JSON bodies (204, gateway errors) become null.
  const text = await response.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const parsedError = apiErrorBodySchema.safeParse(payload);
    const errorBody = parsedError.success ? parsedError.data : null;
    throw new ApiError(response.status, toErrorMessage(errorBody), errorBody);
  }

  return payload;
}

/**
 * Validates a response against a shared Zod contract before returning it.
 * All contract-typed responses (auth, patients, appointments, ...) must go
 * through this boundary so an unexpected payload is rejected instead of
 * silently accepted through a cast.
 */
export async function apiFetchValidated<T>(
  schema: ZodType<T>,
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  return schema.parse(await apiFetch(endpoint, options));
}

/** Reads and validates the persisted user; returns null when absent or malformed. */
export function getStoredUser(): AuthenticatedUser | null {
  if (typeof window === "undefined") return null;
  try {
    const user = localStorage.getItem("user");
    if (!user) return null;
    const parsed: unknown = JSON.parse(user);
    const result = authenticatedUserSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function getStoredTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === "undefined") {
    return { access: null, refresh: null };
  }
  try {
    return { access: localStorage.getItem("access_token"), refresh: localStorage.getItem("refresh_token") };
  } catch {
    return { access: null, refresh: null };
  }
}

export function setStoredAuth(accessToken: string, refreshToken: string, user: AuthenticatedUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  } catch (error: unknown) {
    clearStoredAuth();
    throw error;
  }
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  } catch {
    // Storage can be blocked; the provider must still clear in-memory UI state.
  }
}
