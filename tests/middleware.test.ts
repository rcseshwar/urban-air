import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Security Middleware & CSP", () => {
  it("attaches strict Content-Security-Policy header", () => {
    const req = new NextRequest("http://localhost/");
    const res = middleware(req);

    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("https://air-quality-api.open-meteo.com");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("sets defense-in-depth security headers", () => {
    const req = new NextRequest("http://localhost/");
    const res = middleware(req);

    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Permissions-Policy")).toContain("geolocation=(self)");
  });
});
