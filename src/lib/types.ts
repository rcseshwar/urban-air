import type { AqiCategory } from "./aqi";

export type DataKind = "measured" | "modelled" | "forecast" | "unavailable";

export interface Location {
  name: string;
  admin?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface Pollutants {
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
}

export interface HourlyDataPoint {
  time: string;
  aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  category: AqiCategory | null;
}

export interface AirQualitySnapshot {
  location: Location;
  provider: string;
  standard: "US EPA AQI";
  kind: DataKind;
  measuredAt: string;
  fetchedAt: string;
  pollutants: Pollutants;
  providerAqi: number | null;
  calculatedAqi: number | null;
  category: AqiCategory | null;
  notes: string[];
  hourly?: HourlyDataPoint[];
}

export interface AirQualityProvider {
  searchLocations(query: string, signal?: AbortSignal): Promise<Location[]>;
  getCurrent(location: Location, signal?: AbortSignal): Promise<AirQualitySnapshot>;
}

export class ProviderError extends Error {
  constructor(message: string, readonly code: "timeout" | "unavailable" | "invalid_response" | "not_found") {
    super(message);
  }
}

export type PersonaId = "parent" | "elderly" | "worker" | "community";

export interface PersonaInfo {
  id: PersonaId;
  label: string;
  role: string;
  description: string;
  priorityPollutant: string;
  defaultAdvice: string;
}
