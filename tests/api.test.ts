import { describe, expect, it } from "vitest";
import { GET as getAirQuality } from "@/app/api/air-quality/route";
import { GET as getSearch } from "@/app/api/search/route";
import { POST as postAssistant } from "@/app/api/assistant/route";

describe("API Routes", () => {
  it("rejects invalid coordinates in /api/air-quality", async () => {
    const req = new Request("http://localhost/api/air-quality?lat=999&lon=50");
    const res = await getAirQuality(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid coordinates");
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
  });

  it("handles short queries safely in /api/search", async () => {
    const req = new Request("http://localhost/api/search?q=a");
    const res = await getSearch(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toEqual([]);
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
  });

  it("validates question input in /api/assistant and supports optional user apiKey", async () => {
    const req = new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        persona: "parent",
        locationName: "Test City",
        aqi: 75,
        category: "Moderate",
        question: "Is it safe to walk my baby?",
        apiKey: "AIzaSyTestUserKey123",
      }),
    });
    const res = await postAssistant(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answer).toBeDefined();
    expect(data.source).toBeDefined();
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
  });

  it("returns 400 for empty question in /api/assistant", async () => {
    const req = new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "" }),
    });
    const res = await postAssistant(req);
    expect(res.status).toBe(400);
  });
});
