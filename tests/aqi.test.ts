import { describe, expect, it } from "vitest";
import { categorize, computeAqi, computeSubIndex } from "@/lib/aqi";
describe("AQI", () => {
  it("matches EPA breakpoints for PM2.5", () => {
    expect(computeSubIndex("pm2_5", 9.0)).toBe(50);
    expect(computeSubIndex("pm2_5", 35.4)).toBe(100);
    expect(computeSubIndex("pm2_5", 55.4)).toBe(150);
    expect(computeSubIndex("pm2_5", 225.4)).toBe(300);
  });
  it("matches breakpoints for PM10", () => {
    expect(computeSubIndex("pm10", 54)).toBe(50);
    expect(computeSubIndex("pm10", 154)).toBe(100);
  });
  it("caps extreme values at 500 and rejects invalid input", () => {
    expect(computeSubIndex("pm2_5", 900)).toBe(500);
    expect(computeSubIndex("pm10", -1)).toBeNull();
    expect(computeSubIndex("pm10", NaN)).toBeNull();
  });
  it("uses the dominant pollutant and handles missing data", () => {
    expect(computeAqi({ pm2_5: 10, pm10: 300 })?.dominant).toBe("pm10");
    expect(computeAqi({ pm2_5: null, pm10: undefined })).toBeNull();
    expect(computeAqi({ pm10: 20 })?.dominant).toBe("pm10");
  });
  it("categorizes boundaries", () => {
    expect([0, 50, 51, 100, 101, 150, 151, 200, 201, 300, 301].map(categorize)).toEqual([
      "Good", "Good", "Moderate", "Moderate", "Unhealthy for sensitive groups", "Unhealthy for sensitive groups",
      "Unhealthy", "Unhealthy", "Very unhealthy", "Very unhealthy", "Hazardous"]);
  });
});
