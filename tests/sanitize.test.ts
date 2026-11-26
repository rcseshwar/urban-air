import { describe, expect, it } from "vitest";
import { sanitizeText, sanitizeSearchQuery } from "@/lib/sanitize";

describe("Sanitization Utilities", () => {
  it("strips raw HTML angle brackets and null bytes to prevent injection", () => {
    const malicious = "<script>alert('xss')</script>Hello\0World";
    const cleaned = sanitizeText(malicious);
    expect(cleaned).toBe("scriptalert('xss')/scriptHelloWorld");
    expect(cleaned).not.toContain("<");
    expect(cleaned).not.toContain(">");
    expect(cleaned).not.toContain("\0");
  });

  it("handles non-string values safely", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(123)).toBe("");
  });

  it("enforces maximum length truncation", () => {
    const longString = "A".repeat(500);
    const result = sanitizeText(longString, 50);
    expect(result.length).toBe(50);
  });

  it("sanitizes location search queries strictly", () => {
    expect(sanitizeSearchQuery("Bengaluru, India")).toBe("Bengaluru, India");
    expect(sanitizeSearchQuery("New York - Central")).toBe("New York - Central");
    expect(sanitizeSearchQuery("DROP TABLE locations;--")).toBe("DROP TABLE locations--");
  });
});
