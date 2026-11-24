import { describe, expect, it } from "vitest";
import {
  evaluateRoutine,
  getPersonaRecommendation,
  calculateCadr,
  calculatePersonalImpact,
  generateCommunityFlyer,
} from "@/lib/recommendations";

describe("Recommendations & Personas", () => {
  it("returns safe recommendations for Good air quality across all personas", () => {
    const parentRec = getPersonaRecommendation("parent", 35, "Good");
    expect(parentRec.status).toBe("safe");
    expect(parentRec.headline).toContain("Optimal");

    const elderlyRec = getPersonaRecommendation("elderly", 35, "Good");
    expect(elderlyRec.status).toBe("safe");

    const workerRec = getPersonaRecommendation("worker", 35, "Good");
    expect(workerRec.status).toBe("safe");
  });

  it("escalates warnings for Unhealthy and Hazardous conditions", () => {
    const recUnhealthy = getPersonaRecommendation("parent", 160, "Unhealthy");
    expect(recUnhealthy.status).toBe("danger");
    expect(recUnhealthy.actions.some((a) => a.toLowerCase().includes("cancel"))).toBe(true);

    const elderlyHazard = getPersonaRecommendation("elderly", 220, "Very unhealthy");
    expect(elderlyHazard.status).toBe("danger");
    expect(elderlyHazard.maskAdvice).toContain("N95");
  });

  it("handles unavailable air quality gracefully", () => {
    const rec = getPersonaRecommendation("parent", null, null);
    expect(rec.status).toBe("caution");
    expect(rec.headline).toContain("unavailable");
  });
});

describe("Routine Planner", () => {
  it("identifies best outdoor window from hourly forecast", () => {
    const hourly = [
      { time: "2026-11-22T08:00:00Z", aqi: 160, pm2_5: 75, pm10: 100, category: "Unhealthy" as const },
      { time: "2026-11-22T09:00:00Z", aqi: 120, pm2_5: 45, pm10: 70, category: "Unhealthy for sensitive groups" as const },
      { time: "2026-11-22T10:00:00Z", aqi: 45, pm2_5: 11, pm10: 25, category: "Good" as const },
      { time: "2026-11-22T11:00:00Z", aqi: 90, pm2_5: 30, pm10: 50, category: "Moderate" as const },
    ];

    const plan = evaluateRoutine("running", hourly, 160);
    expect(plan.bestAqi).toBe(45);
    expect(plan.rating).toBe("Optimal");
    expect(plan.hourlyEvaluations).toHaveLength(4);
  });

  it("handles missing hourly forecast with fallback", () => {
    const plan = evaluateRoutine("dog_walk", undefined, 80);
    expect(plan.bestAqi).toBe(80);
    expect(plan.rating).toBe("Acceptable");
  });
});

describe("Indoor Guide CADR Calculator", () => {
  it("calculates correct CADR for standard ceiling room", () => {
    // 200 sq ft * 8 ft height * 5 ACH / 60 = 133 CFM
    const result = calculateCadr(200, 8);
    expect(result.targetCfm).toBe(133);
    expect(result.targetM3h).toBe(Math.round(133 * 1.699));
    expect(result.recommendation).toContain("200 sq ft");
  });

  it("handles high ceilings and large rooms", () => {
    const result = calculateCadr(600, 10);
    expect(result.targetCfm).toBe(500);
    expect(result.recommendation).toContain("two medium units");
  });
});

describe("Impact Calculator", () => {
  it("computes significant protection percentage when N95 and purifier are used", () => {
    const protectedImpact = calculatePersonalImpact({
      outdoorAqi: 150,
      outdoorHours: 4,
      maskType: "n95",
      hasAirPurifier: true,
    });

    const unprotectedImpact = calculatePersonalImpact({
      outdoorAqi: 150,
      outdoorHours: 4,
      maskType: "none",
      hasAirPurifier: false,
    });

    expect(protectedImpact.inhaledPm25Ug).toBeLessThan(unprotectedImpact.inhaledPm25Ug);
    expect(protectedImpact.protectionPercentage).toBeGreaterThan(60);
    expect(protectedImpact.cigaretteEquivalent).toBeLessThan(unprotectedImpact.cigaretteEquivalent);
  });
});

describe("Community Flyer Generator", () => {
  it("generates structured notice with location and category", () => {
    const flyer = generateCommunityFlyer({
      locationName: "New Delhi Central",
      aqi: 280,
      category: "Very unhealthy",
      dateStr: "Monday, Nov 23, 2026",
    });

    expect(flyer).toContain("New Delhi Central");
    expect(flyer).toContain("VERY UNHEALTHY");
    expect(flyer).toContain("SCHOOLS & DAYCARES");
    expect(flyer).toContain("VULNERABLE NEIGHBORS");
  });
});
