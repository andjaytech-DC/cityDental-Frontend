import { Global, Module } from "@nestjs/common";

import { PrismaService } from "./prisma.service";

/**
 * Backend-only Prisma integration. Never import this module from the
 * Next.js app — database access must stay inside the NestJS boundary.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
