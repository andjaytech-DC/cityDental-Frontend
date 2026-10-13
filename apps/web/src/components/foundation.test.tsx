import { renderToStaticMarkup } from "react-dom/server";
import { loginSchema } from "@citydental/validation";
import { AppShell } from "./AppShell";
import { LoginForm, loginErrorMessage } from "./LoginForm";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { LoadingState, EmptyState, ErrorState, AccessErrorState, Button, CardLink } from "./ui";
import NotFound from "@/app/not-found";
import ErrorPage from "@/app/error";

jest.mock("next/navigation", () => ({ usePathname: () => "/login", useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/lib/auth-context", () => ({ useAuth: jest.fn() }));
const auth = jest.mocked(useAuth);
beforeEach(() => {
  auth.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false,
    login: jest.fn(), logout: jest.fn(), refresh: jest.fn() });
});

describe("application shell", () => {
  it("renders landmarks, skip link, real navigation and unauthenticated content", () => {
    const html = renderToStaticMarkup(<AppShell><h1>Content</h1></AppShell>);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('<main id="main-content"');
    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toMatch(/<a(?=[^>]*href="\/login")(?=[^>]*aria-current="page")[^>]*>/);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("Content");
  });
  it("renders interactive cards as links", () => {
    expect(renderToStaticMarkup(<CardLink href="/login" title="Sign in">Existing account</CardLink>)).toContain('href="/login"');
  });
});

describe("login presentation", () => {
  it("renders labeled contract fields and a submit control without reset/register routes", () => {
    const html = renderToStaticMarkup(<LoginForm />);
    expect(html).toContain('aria-label="Sign in"');
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain('name="organizationSlug"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('href="/register"');
    expect(html).not.toContain('href="/reset-password"');
  });
  it("shows a session-loading state rather than a premature sign-in form", () => {
    auth.mockReturnValue({ ...auth(), isLoading: true });
    const html = renderToStaticMarkup(<LoginForm />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain("<form");
  });
  it("reuses shared validation for invalid email/password and optional tenant", () => {
    expect(loginSchema.safeParse({ email: "invalid", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "person@example.test", password: "valid-test-value" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "person@example.test", password: "valid-test-value", organizationSlug: "x" }).success).toBe(false);
  });
  it.each([401, 403, 404, 429, 503])("presents a safe message for HTTP %s", status => {
    const message = loginErrorMessage(new ApiError(status, "internal server detail"));
    expect(message.length).toBeGreaterThan(20);
    expect(message).not.toContain("internal server detail");
    expect(renderToStaticMarkup(<ErrorState description={message} />)).toContain('role="alert"');
  });
  it("handles an unavailable network without leaking raw errors", () => {
    expect(loginErrorMessage(new TypeError("private transport detail"))).toContain("Check your connection");
  });
});

describe("reusable states", () => {
  it("announces loading and disables a submitting button", () => {
    expect(renderToStaticMarkup(<LoadingState label="Loading appointments…" />)).toContain('role="status"');
    const html = renderToStaticMarkup(<Button type="submit" isLoading>Signing in…</Button>);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
  });
  it.each(["No appointments", "No patients", "No doctors", "No search results"])("renders explicit empty state: %s", title => {
    const html = renderToStaticMarkup(<EmptyState title={title} description="No records were returned." />);
    expect(html).toContain(title);
    expect(html).toContain("No records were returned.");
  });
  it("renders an access failure without client-side role decisions", () => {
    expect(renderToStaticMarkup(<AccessErrorState />)).toContain("Access unavailable");
  });
  it("offers recovery from missing and unexpected pages", () => {
    expect(renderToStaticMarkup(<NotFound />)).toContain("Back to overview");
    expect(renderToStaticMarkup(<ErrorPage error={new Error("private")} reset={() => undefined} />)).toContain("Try again");
  });
});
