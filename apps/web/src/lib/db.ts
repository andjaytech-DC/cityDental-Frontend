import "server-only";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __citydentalPrisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient();
}

export const prisma: PrismaClient =
  globalThis.__citydentalPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__citydentalPrisma = prisma;
}
