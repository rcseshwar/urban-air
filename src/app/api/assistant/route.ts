import { NextResponse } from "next/server";
import { z } from "zod";
import { askAirQualityAssistant } from "@/lib/gemini";
import { assistantRateLimiter } from "@/lib/rateLimit";

import { sanitizeText } from "@/lib/sanitize";

const bodySchema = z.object({
  persona: z.enum(["parent", "elderly", "worker", "community"]).default("parent"),
  locationName: z.string().transform((v) => sanitizeText(v, 100)).default("Your Location"),
  aqi: z.number().nullable().optional().default(null),
  category: z.string().nullable().optional().default(null),
  pollutants: z
    .object({
      pm2_5: z.number().nullable().optional().default(null),
      pm10: z.number().nullable().optional().default(null),
      no2: z.number().nullable().optional().default(null),
      so2: z.number().nullable().optional().default(null),
      co: z.number().nullable().optional().default(null),
      o3: z.number().nullable().optional().default(null),
    })
    .default({}),
  question: z.string().transform((v) => sanitizeText(v, 1000)).refine((v) => v.length >= 2, { message: "Question too short" }),
  apiKey: z.string().trim().max(250).optional(),
});

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "127.0.0.1";
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = assistantRateLimiter.check(ip);

  const headers = new Headers({
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetAt),
  });

  if (!rateLimit.allowed) {
    headers.set("Retry-After", String(rateLimit.retryAfterSec));
    return NextResponse.json(
      { error: "Too many assistant queries. Please wait a moment." },
      { status: 429, headers }
    );
  }

  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    const res = await askAirQualityAssistant(parsed.data);
    return NextResponse.json(res, { headers });
  } catch {
    return NextResponse.json(
      { error: "Unable to process assistant request at this time." },
      { status: 500, headers }
    );
  }
}
