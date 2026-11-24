import { describe, expect, it } from "vitest";
import { askAirQualityAssistant } from "@/lib/gemini";

describe("Gemini Assistant & Clinical Fallback", () => {
  it("generates evidence-based mask guidance tailored to current AQI", async () => {
    const res = await askAirQualityAssistant({
      persona: "parent",
      locationName: "Bengaluru",
      aqi: 140,
      category: "Unhealthy for sensitive groups",
      pollutants: { pm2_5: 52, pm10: 95, no2: 24, so2: 5, co: 0.8, o3: 30 },
      question: "What mask should my child wear?",
    });

    expect(res.answer).toBeDefined();
    expect(res.answer.toLowerCase()).toMatch(/n95|kn95|kf94/);
    expect(res.disclaimer).toBeDefined();
  });

  it("advises against outdoor aerobic running during high AQI", async () => {
    const res = await askAirQualityAssistant({
      persona: "worker",
      locationName: "Downtown",
      aqi: 185,
      category: "Unhealthy",
      pollutants: { pm2_5: 120, pm10: 180, no2: null, so2: null, co: null, o3: null },
      question: "Can I go jogging outside?",
    });

    expect(res.answer.toLowerCase()).toMatch(/cancel|indoor|alveoli|unhealthy/);
  });

  it("provides persona-targeted senior cardiovascular precautions", async () => {
    const res = await askAirQualityAssistant({
      persona: "elderly",
      locationName: "Suburbs",
      aqi: 160,
      category: "Unhealthy",
      pollutants: { pm2_5: 75, pm10: 110, no2: 30, so2: null, co: null, o3: null },
      question: "What health precautions should we take today?",
    });

    expect(res.answer.toLowerCase()).toMatch(/cardiovascular|inflammation|inhaler|medication/);
  });

  it("accepts user-supplied apiKey and provides informative fallback if key is invalid or offline", async () => {
    const res = await askAirQualityAssistant({
      persona: "parent",
      locationName: "Bengaluru",
      aqi: 70,
      category: "Moderate",
      pollutants: { pm2_5: 20, pm10: 40, no2: null, so2: null, co: null, o3: null },
      question: "Is indoor air safe?",
      apiKey: "invalid-test-key",
    });

    expect(res.answer).toBeDefined();
    expect(res.source).toBe("clinical_heuristic");
    expect(res.disclaimer).toContain("Custom API Key notice");
  });
});
