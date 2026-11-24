import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter } from "@/lib/rateLimit";

describe("SlidingWindowRateLimiter", () => {
  it("allows requests under the limit", () => {
    let now = 1000;
    const limiter = new SlidingWindowRateLimiter(60_000, 3, () => now);

    const r1 = limiter.check("ip-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("ip-1");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("ip-1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding limit and calculates retryAfterSec", () => {
    let now = 10_000;
    const limiter = new SlidingWindowRateLimiter(60_000, 2, () => now);

    limiter.check("ip-2");
    limiter.check("ip-2");

    const blocked = limiter.check("ip-2");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBe(60);

    // Fast-forward 61 seconds
    now = 71_000;
    const allowedAgain = limiter.check("ip-2");
    expect(allowedAgain.allowed).toBe(true);
  });

  it("isolates rate limits by client key", () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 1);
    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-a").allowed).toBe(false);
    expect(limiter.check("client-b").allowed).toBe(true);
  });
});
