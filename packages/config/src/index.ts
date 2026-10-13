/**
 * @citydental/config — validated runtime environment
 *
 * `loadEnv()` fails fast with a readable report when required
 * variables are missing. Nothing else in the codebase should read
 * `process.env` directly for configuration.
 */

import { z } from "zod";

/** Env booleans arrive as strings; "false" must not become true. */
function booleanFromString(defaultValue: boolean) {
  return z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (value === undefined) return defaultValue;
      return typeof value === "boolean" ? value : value.toLowerCase() === "true";
    });
}

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  APP_NAME: z.string().min(1).default("City Dental"),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (see .env.example)"),

  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),

  /** Comma-separated list of allowed browser origins. */
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  /**
   * Hard safety switch. When false (the default everywhere except a
   * fully-configured production environment) the notification adapters
   * are replaced by mocks that log instead of sending.
   */
  COMMUNICATIONS_ENABLED: booleanFromString(false),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  SMS_PROVIDER: z.string().optional(),
  SMS_API_KEY: z.string().optional(),

  WHATSAPP_PROVIDER: z.string().optional(),
  WHATSAPP_API_KEY: z.string().optional(),

  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export interface Config {
  env: Env;
  isProduction: boolean;
  isTest: boolean;
  corsOrigins: string[];
  apiBaseUrl: string;
}

/** Parse and validate the environment. Throws a readable error on failure. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${details}\n\nCopy .env.example to .env and fill in the values.`,
    );
  }
  return result.data;
}

/** Split the CSV CORS_ORIGIN value into a trimmed, non-empty list. */
export function resolveCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function createConfig(source: NodeJS.ProcessEnv = process.env): Config {
  const env = loadEnv(source);
  return {
    env,
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
    corsOrigins: resolveCorsOrigins(env.CORS_ORIGIN),
    apiBaseUrl: `http://localhost:${env.API_PORT}/api/v1`,
  };
}