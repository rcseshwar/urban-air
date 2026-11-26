/**
 * Input sanitization utility to prevent HTML/XSS injection, null-byte attacks,
 * and malicious payloads from reaching server models and flyers.
 */
export function sanitizeText(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/\0/g, "") // strip null bytes
    .replace(/[<>]/g, "") // strip angle brackets to prevent raw HTML/script injection
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes location query strings (letters, numbers, spaces, commas, hyphens, periods).
 */
export function sanitizeSearchQuery(input: unknown): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/\0/g, "")
    .replace(/[^a-zA-Z0-9\s,.\-']/g, "")
    .trim()
    .slice(0, 100);
}
