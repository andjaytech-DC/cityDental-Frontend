import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "path";

import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // The repository keeps a single .env at the workspace root.
      envFilePath: [resolve(process.cwd(), "../../.env"), resolve(process.cwd(), ".env")],
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
