export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number = 60_000,
    private readonly maxRequests: number = 60,
    private readonly now: () => number = Date.now
  ) {}

  check(key: string): RateLimitResult {
    const currentTime = this.now();
    const windowStart = currentTime - this.windowMs;

    const timestamps = this.requests.get(key) ?? [];
    // Keep only timestamps within window
    const valid = timestamps.filter((t) => t > windowStart);

    if (valid.length >= this.maxRequests) {
      const oldest = valid[0] ?? currentTime;
      const resetAt = oldest + this.windowMs;
      const retryAfterSec = Math.max(1, Math.ceil((resetAt - currentTime) / 1000));
      this.requests.set(key, valid);
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAt,
        retryAfterSec,
      };
    }

    valid.push(currentTime);
    this.requests.set(key, valid);

    // Housekeeping: remove old keys periodically
    if (this.requests.size > 2000) {
      for (const [k, v] of this.requests.entries()) {
        const pruned = v.filter((t) => t > windowStart);
        if (pruned.length === 0) {
          this.requests.delete(k);
        } else {
          this.requests.set(k, pruned);
        }
      }
    }

    const resetAt = currentTime + this.windowMs;
    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - valid.length),
      resetAt,
      retryAfterSec: 0,
    };
  }

  reset(key?: string) {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const apiRateLimiter = new SlidingWindowRateLimiter(60_000, 60);
export const assistantRateLimiter = new SlidingWindowRateLimiter(60_000, 20);
