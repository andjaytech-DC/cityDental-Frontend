/**
 * Guards the build-time behaviour of the public booking routes.
 *
 * `/api/locations` used to be prerendered during `next build`, so the deploy
 * failed with `Environment variable not found: DATABASE_URL` (see PROD.md §10)
 * and, when a stale client masked it, could ship an empty result. Both routes
 * must therefore stay `force-dynamic`: evaluated per request, never baked into
 * the build, and never able to report an empty clinic from build-time data.
 */
import * as doctorsRoute from "./route";
import * as locationsRoute from "@/app/api/locations/route";

jest.mock("@/lib/db", () => ({
  prisma: {
    doctor: { findMany: jest.fn().mockResolvedValue([]) },
    location: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

describe("public booking API routes stay dynamic", () => {
  it("declares /api/doctors force-dynamic so it is not prerendered at build time", () => {
    expect(doctorsRoute.dynamic).toBe("force-dynamic");
  });

  it("declares /api/locations force-dynamic so it is not prerendered at build time", () => {
    expect(locationsRoute.dynamic).toBe("force-dynamic");
  });
});

describe("GET /api/doctors", () => {
  it("answers 200 with an items array when the database has no doctors", async () => {
    const res = await doctorsRoute.GET(new Request("http://localhost:3000/api/doctors?status=ACTIVE"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
  });

  it("passes the requested status filter through to Prisma", async () => {
    const { prisma } = await import("@/lib/db");
    await doctorsRoute.GET(new Request("http://localhost:3000/api/doctors?status=ACTIVE"));
    expect(prisma.doctor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "ACTIVE" } }),
    );
  });
});
