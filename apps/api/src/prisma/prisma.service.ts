import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma integration for the NestJS backend.
 *
 * The client connects lazily on the first query, so HTTP liveness does not
 * depend on database availability; domain services that query the database
 * will surface connection errors explicitly.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
