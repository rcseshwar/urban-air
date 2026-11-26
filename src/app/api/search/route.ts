import { NextResponse } from "next/server";
import { z } from "zod";
import { OpenMeteoProvider } from "@/lib/providers/openMeteo";
import { TtlCache } from "@/lib/cache";
import { ProviderError, type Location } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rateLimit";

import { sanitizeSearchQuery } from "@/lib/sanitize";

const querySchema = z.object({
  q: z.string().transform((val) => sanitizeSearchQuery(val)).refine((v) => v.length >= 2, { message: "Query too short" }),
});

const provider = new OpenMeteoProvider();
const cache = new TtlCache<Location[]>(30 * 60 * 1000);

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "127.0.0.1";
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = apiRateLimiter.check(ip);

  const headers = new Headers({
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetAt),
  });

  if (!rateLimit.allowed) {
    headers.set("Retry-After", String(rateLimit.retryAfterSec));
    return NextResponse.json(
      { error: "Too many search requests. Please slow down." },
      { status: 429, headers }
    );
  }

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ results: [] }, { headers });
  }

  const query = parsed.data.q.toLowerCase();
  try {
    const results = await cache.get(query, () => provider.searchLocations(parsed.data.q));
    return NextResponse.json({ results }, { headers });
  } catch (e) {
    const status = e instanceof ProviderError && e.code === "timeout" ? 504 : 502;
    return NextResponse.json(
      { error: "Geocoding service unavailable" },
      { status, headers }
    );
  }
}
