import { Controller, Get } from "@nestjs/common";

/**
 * HTTP liveness probe only. It deliberately does not touch the database —
 * a database-readiness endpoint belongs to a later phase once database
 * state is established.
 */
@Controller("health")
export class HealthController {
  @Get()
  check(): { status: string; service: string; timestamp: string } {
    return {
      status: "ok",
      service: "city-dental-api",
      timestamp: new Date().toISOString(),
    };
  }
}
