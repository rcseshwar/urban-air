import { describe, expect, it, vi } from "vitest";
import { OpenMeteoProvider } from "@/lib/providers/openMeteo";
import { TtlCache } from "@/lib/cache";
import { ProviderError } from "@/lib/types";

const loc = { name: "Test", latitude: 12.3, longitude: 76.6 };
const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;
const mk = (f: typeof fetch) => new OpenMeteoProvider(f, 1000, () => new Date("2026-11-22T00:00:00Z"));
const current = (o: object) => ({ current: { time: "2026-11-22T06:00", ...o } });

describe("OpenMeteoProvider", () => {
  it("maps a valid response and labels it modelled", async () => {
    const s = await mk(ok(current({ pm2_5: 80, pm10: 120, us_aqi: 165, ozone: 30 }))).getCurrent(loc);
    expect(s.kind).toBe("modelled");
    expect(s.category).toBe("Unhealthy");
    expect(s.pollutants.no2).toBeNull();
    expect(s.measuredAt).toBe("2026-11-22T06:00:00Z");
  });
  it("marks data unavailable instead of inventing values", async () => {
    const s = await mk(ok(current({ pm2_5: null, pm10: null, us_aqi: null }))).getCurrent(loc);
    expect(s.kind).toBe("unavailable");
    expect(s.category).toBeNull();
  });
  it("flags provider/calculation disagreement", async () => {
    const s = await mk(ok(current({ pm2_5: 10, us_aqi: 150 }))).getCurrent(loc);
    expect(s.notes.some((n) => n.includes("differs"))).toBe(true);
  });
  it("rejects invalid payloads", async () => {
    await expect(mk(ok({ nope: 1 })).getCurrent(loc)).rejects.toMatchObject({ code: "invalid_response" });
  });
  it("maps HTTP and network failures", async () => {
    const bad = vi.fn(async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
    await expect(mk(bad).getCurrent(loc)).rejects.toBeInstanceOf(ProviderError);
    const down = vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    await expect(mk(down).getCurrent(loc)).rejects.toMatchObject({ code: "unavailable" });
  });
  it("times out slow providers", async () => {
    const slow = ((_u: unknown, init: RequestInit) => new Promise((_r, rej) => init.signal!.addEventListener("abort", () => rej(new Error("abort"))))) as unknown as typeof fetch;
    await expect(new OpenMeteoProvider(slow, 20).getCurrent(loc)).rejects.toMatchObject({ code: "timeout" });
  });
  it("searches locations and ignores too-short queries", async () => {
    const f = ok({ results: [{ name: "Mysuru", latitude: 12.3, longitude: 76.6, admin1: "Karnataka", country: "India" }] });
    const p = mk(f);
    expect(await p.searchLocations("M")).toEqual([]);
    expect((await p.searchLocations("Mysuru"))[0]?.admin).toBe("Karnataka");
    expect(await mk(ok({})).searchLocations("Nowhere")).toEqual([]);
  });
});

describe("TtlCache", () => {
  it("caches, de-duplicates in-flight calls, and expires", async () => {
    let t = 0; const load = vi.fn(async () => "v");
    const c = new TtlCache<string>(100, () => t);
    await Promise.all([c.get("k", load), c.get("k", load)]);
    expect(load).toHaveBeenCalledTimes(1);
    await c.get("k", load); expect(load).toHaveBeenCalledTimes(1);
    t = 101; await c.get("k", load); expect(load).toHaveBeenCalledTimes(2);
  });
});
