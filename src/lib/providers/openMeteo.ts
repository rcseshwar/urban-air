import { z } from "zod";
import { categorize, computeAqi } from "../aqi";
import {
  ProviderError,
  type AirQualityProvider,
  type AirQualitySnapshot,
  type HourlyDataPoint,
  type Location,
} from "../types";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const num = z.number().nullable().optional();

const geoSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        admin1: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .optional(),
});

const aqSchema = z.object({
  current: z.object({
    time: z.string(),
    pm10: num,
    pm2_5: num,
    carbon_monoxide: num,
    nitrogen_dioxide: num,
    sulphur_dioxide: num,
    ozone: num,
    us_aqi: num,
  }),
  hourly: z
    .object({
      time: z.array(z.string()).optional(),
      pm10: z.array(num).optional(),
      pm2_5: z.array(num).optional(),
      us_aqi: z.array(num).optional(),
    })
    .optional(),
});

type Fetch = typeof fetch;

export class OpenMeteoProvider implements AirQualityProvider {
  constructor(
    private readonly fetchImpl: Fetch = fetch,
    private readonly timeoutMs = 8000,
    private readonly now: () => Date = () => new Date()
  ) {}

  private async getJson(url: URL, signal?: AbortSignal): Promise<unknown> {
    const timeout = AbortSignal.timeout(this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
    } catch {
      if (timeout.aborted) throw new ProviderError("Air-quality provider timed out", "timeout");
      throw new ProviderError("Air-quality provider is unreachable", "unavailable");
    }
    if (!res.ok) throw new ProviderError(`Provider responded with ${res.status}`, "unavailable");
    try {
      return await res.json();
    } catch {
      throw new ProviderError("Provider returned malformed JSON", "invalid_response");
    }
  }

  async searchLocations(query: string, signal?: AbortSignal): Promise<Location[]> {
    const q = query.trim();
    if (q.length < 2 || q.length > 100) return [];
    const url = new URL(GEO_URL);
    url.search = new URLSearchParams({ name: q, count: "5", language: "en", format: "json" }).toString();
    const parsed = geoSchema.safeParse(await this.getJson(url, signal));
    if (!parsed.success) throw new ProviderError("Unexpected geocoding response", "invalid_response");
    return (parsed.data.results ?? []).map((r) => ({
      name: r.name,
      admin: r.admin1,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  }

  async getCurrent(location: Location, signal?: AbortSignal): Promise<AirQualitySnapshot> {
    const url = new URL(AQ_URL);
    url.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      timezone: "auto",
      current: "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi",
      hourly: "pm10,pm2_5,us_aqi",
      forecast_days: "2",
    }).toString();

    const parsed = aqSchema.safeParse(await this.getJson(url, signal));
    if (!parsed.success) throw new ProviderError("Unexpected air-quality response", "invalid_response");

    const c = parsed.data.current;
    const pollutants = {
      pm2_5: c.pm2_5 ?? null,
      pm10: c.pm10 ?? null,
      no2: c.nitrogen_dioxide ?? null,
      so2: c.sulphur_dioxide ?? null,
      co: c.carbon_monoxide ?? null,
      o3: c.ozone ?? null,
    };
    const calc = computeAqi(pollutants);
    const providerAqi = c.us_aqi ?? null;
    const aqi = providerAqi ?? calc?.aqi ?? null;
    const notes = ["Open-Meteo values are modelled (CAMS) estimates, not readings from a nearby monitoring station."];
    if (providerAqi != null && calc && Math.abs(providerAqi - calc.aqi) > 10) {
      notes.push(
        `Provider AQI (${providerAqi}) differs from our PM-based calculation (${calc.aqi}); the provider may use other pollutants or older breakpoints.`
      );
    }
    if (aqi == null) notes.push("No AQI could be derived: required pollutant data is unavailable.");

    // Parse hourly forecast if present
    const hourlyPoints: HourlyDataPoint[] = [];
    const hourlyData = parsed.data.hourly;
    if (hourlyData?.time && Array.isArray(hourlyData.time)) {
      const times = hourlyData.time;
      const pm10Arr = hourlyData.pm10 ?? [];
      const pm25Arr = hourlyData.pm2_5 ?? [];
      const aqiArr = hourlyData.us_aqi ?? [];

      const currentTimeIso = c.time;
      const currentIndex = Math.max(
        0,
        times.findIndex((t) => t >= currentTimeIso)
      );
      const sliceEnd = Math.min(times.length, currentIndex + 24);

      for (let i = currentIndex; i < sliceEnd; i++) {
        const time = times[i];
        if (!time) continue;
        const p25 = pm25Arr[i] ?? null;
        const p10 = pm10Arr[i] ?? null;
        const provHourlyAqi = aqiArr[i] ?? null;
        const calcHourly = computeAqi({ pm2_5: p25, pm10: p10 });
        const finalHourlyAqi = provHourlyAqi ?? calcHourly?.aqi ?? null;

        hourlyPoints.push({
          time,
          aqi: finalHourlyAqi,
          pm2_5: p25,
          pm10: p10,
          category: finalHourlyAqi != null ? categorize(finalHourlyAqi) : null,
        });
      }
    }

    return {
      location,
      provider: "Open-Meteo Air Quality API",
      standard: "US EPA AQI",
      kind: aqi == null ? "unavailable" : "modelled",
      measuredAt: `${c.time}:00Z`,
      fetchedAt: this.now().toISOString(),
      pollutants,
      providerAqi,
      calculatedAqi: calc?.aqi ?? null,
      category: aqi == null ? null : categorize(aqi),
      notes,
      ...(hourlyPoints.length > 0 ? { hourly: hourlyPoints } : {}),
    };
  }
}
