import { NextResponse } from "next/server";
import { z } from "zod";
import { OpenMeteoProvider } from "@/lib/providers/openMeteo";
import { TtlCache } from "@/lib/cache";
import { ProviderError, type AirQualitySnapshot } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rateLimit";

const query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  name: z.string().trim().min(1).max(100).default("Selected location"),
});

const provider = new OpenMeteoProvider();
const cache = new TtlCache<AirQualitySnapshot>(10 * 60 * 1000);

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
      { error: "Too many requests. Please wait before making more requests." },
      { status: 429, headers }
    );
  }

  const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400, headers });
  }

  const { lat, lon, name } = parsed.data;
  try {
    const data = await cache.get(`${lat.toFixed(2)},${lon.toFixed(2)}`, () =>
      provider.getCurrent({ name, latitude: lat, longitude: lon })
    );
    return NextResponse.json(data, { headers });
  } catch (e) {
    const status = e instanceof ProviderError && e.code === "timeout" ? 504 : 502;
    return NextResponse.json(
      { error: "Air-quality data is currently unavailable. Please retry shortly." },
      { status, headers }
    );
  }
}
