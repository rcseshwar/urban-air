/** US EPA AQI (PM2.5 breakpoints per the 2024 revision; PM10 per the long-standing table). */
export type AqiCategory = "Good" | "Moderate" | "Unhealthy for sensitive groups" | "Unhealthy" | "Very unhealthy" | "Hazardous";
export type AqiPollutant = "pm2_5" | "pm10";

interface Band { cLow: number; cHigh: number; iLow: number; iHigh: number }

const BANDS: Record<AqiPollutant, readonly Band[]> = {
  pm2_5: [
    { cLow: 0, cHigh: 9.0, iLow: 0, iHigh: 50 }, { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 }, { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
    { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 }, { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 400 },
    { cLow: 325.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 }, { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 }, { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 }, { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
  ],
};

/** Sub-index for one pollutant (µg/m³). Returns null for invalid input; caps at 500. */
export function computeSubIndex(pollutant: AqiPollutant, concentration: number): number | null {
  if (!Number.isFinite(concentration) || concentration < 0) return null;
  const c = pollutant === "pm2_5" ? Math.floor(concentration * 10) / 10 : Math.floor(concentration);
  const bands = BANDS[pollutant];
  if (c > bands[bands.length - 1]!.cHigh) return 500;
  const band = bands.find((b) => c >= b.cLow && c <= b.cHigh) ?? bands.find((b) => c < b.cLow);
  if (!band) return null;
  return Math.round(((band.iHigh - band.iLow) / (band.cHigh - band.cLow)) * (Math.max(c, band.cLow) - band.cLow) + band.iLow);
}

/** Overall AQI = highest available sub-index. Null when no pollutant is available. */
export function computeAqi(input: { pm2_5?: number | null; pm10?: number | null }): { aqi: number; dominant: AqiPollutant } | null {
  const subs = (["pm2_5", "pm10"] as const).flatMap((p) => {
    const v = input[p];
    const s = v == null ? null : computeSubIndex(p, v);
    return s == null ? [] : [{ aqi: s, dominant: p }];
  });
  return subs.length ? subs.reduce((a, b) => (b.aqi > a.aqi ? b : a)) : null;
}

export function categorize(aqi: number): AqiCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

/** Non-colour cue so warnings never rely on colour alone (WCAG). */
export const CATEGORY_SYMBOL: Record<AqiCategory, string> = {
  Good: "✓", Moderate: "•", "Unhealthy for sensitive groups": "▲", Unhealthy: "⚠", "Very unhealthy": "⛔", Hazardous: "☠",
};
