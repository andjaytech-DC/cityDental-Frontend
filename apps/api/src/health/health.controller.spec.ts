import { Test } from "@nestjs/testing";

import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it("reports ok status for the api service", () => {
    const result = controller.check();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("city-dental-api");
  });

  it("returns a parseable ISO-8601 timestamp", () => {
    const result = controller.check();

    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
