import { ZodError } from "zod";
import { authResponseSchema } from "@citydental/validation";
import { API_BASE, ApiError, apiFetch, apiFetchValidated } from "./api";

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

beforeEach(() => {
  jest.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
});

afterEach(() => {
  jest.restoreAllMocks();
  fetchMock.mockReset();
});

function stubFetch(response: { ok: boolean; status: number; text: () => Promise<string> }): void {
  fetchMock.mockImplementationOnce(async () => new Response(await response.text(), { status: response.status }));
}

describe("apiFetch — successful request", () => {
  it("returns the parsed NestJS response body", async () => {
    const payload = {
      status: "ok",
      service: "city-dental-api",
      timestamp: "2026-09-16T00:00:00.000Z",
    };
    stubFetch({ ok: true, status: 200, text: async () => JSON.stringify(payload) });

    await expect(apiFetch("/health")).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/health`, expect.objectContaining({
      headers: expect.objectContaining({ Accept: "application/json" }),
    }));
  });
});

describe("apiFetch — request serialization", () => {
  it("sends a JSON body exactly once with the JSON content type", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const body = { email: "example@citydental.test", password: "test-only-value" };
    await apiFetch("/auth/login", { method: "POST", body });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/auth/login`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify(body),
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
  });

  it.each(["not JSON", ""])("rejects malformed or empty schema-bound responses: %p", async (body) => {
    fetchMock.mockResolvedValue(new Response(body, { status: 200 }));
    await expect(apiFetchValidated(authResponseSchema, "/auth/refresh")).rejects.toBeInstanceOf(ZodError);
  });
});

describe("apiFetch — HTTP error", () => {
  it("converts a NestJS error body into an ApiError", async () => {
    stubFetch({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({ statusCode: 401, error: "Unauthorized", message: "Invalid credentials" }),
    });

    const error = await apiFetch("/auth/login", { method: "POST" }).then(
      () => null,
      (error: unknown) => error
    );

    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) throw new Error("Expected ApiError");
    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid credentials");
    expect(error.body).toEqual(
      expect.objectContaining({ statusCode: 401, error: "Unauthorized" })
    );
  });

  it("falls back to a generic message for non-JSON error bodies", async () => {
    stubFetch({ ok: false, status: 502, text: async () => "<html>Bad Gateway</html>" });

    const error = await apiFetch("/health").then(
      () => null,
      (error: unknown) => error
    );

    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) throw new Error("Expected ApiError");
    expect(error.status).toBe(502);
    expect(error.body).toBeNull();
    expect(error.message).toBe("Request failed");
  });
});

describe("apiFetchValidated — shared schema boundary", () => {
  const validAuthResponse = {
    user: {
      id: "0f0a7a4d-71c2-4f61-9d21-0b6f9a2f4c10",
      email: "owner@citydental.test",
      firstName: "Ada",
      lastName: "Okoye",
      organizationId: "1b6d3f52-8b7e-4c2a-9d84-2e6a1a0d5b21",
      organizationSlug: "city-dental",
      isSuperAdmin: false,
      roles: ["OWNER"],
      permissions: ["organization:read", "organization:manage"],
      locationIds: [],
    },
    tokens: {
      accessToken: "access-token-value-123456",
      refreshToken: "refresh-token-value-123456",
      expiresIn: 900,
    },
  };

  it("returns the validated response when the shape matches the shared contract", async () => {
    stubFetch({ ok: true, status: 200, text: async () => JSON.stringify(validAuthResponse) });

    const result = await apiFetchValidated(authResponseSchema, "/auth/login", { method: "POST" });

    expect(result.user.organizationSlug).toBe("city-dental");
    expect(result.tokens.expiresIn).toBe(900);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/auth/login`, expect.objectContaining({ method: "POST" }));
  });

  it("rejects an invalid response instead of accepting it through a cast", async () => {
    stubFetch({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ user: { id: "not-a-uuid" }, tokens: {} }),
    });

    await expect(
      apiFetchValidated(authResponseSchema, "/auth/login", { method: "POST" })
    ).rejects.toBeInstanceOf(ZodError);
  });
});
