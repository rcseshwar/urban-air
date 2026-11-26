"use client";

import { useEffect, useState, useCallback } from "react";
import type { AirQualitySnapshot, Location } from "@/lib/types";

export const DEFAULT_LOCATION: Location = {
  name: "Bengaluru",
  admin: "Karnataka",
  country: "India",
  latitude: 12.97,
  longitude: 77.59,
};

export function useAirQuality(initialLocation: Location = DEFAULT_LOCATION) {
  const [currentLoc, setCurrentLoc] = useState<Location>(initialLocation);
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const fetchAirQuality = useCallback(async (loc: Location) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/air-quality?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(loc.name)}`
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "Failed to fetch air quality data");
      }
      const data: AirQualitySnapshot = await res.json();
      setSnapshot(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to reach air-quality service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAirQuality(currentLoc);
  }, [currentLoc, fetchAirQuality]);

  // Handle location search debouncing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results ?? []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Geolocation trigger
  const handleUseLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoStatus("Geolocation is not supported by your browser.");
      return;
    }
    setGeoStatus("Requesting device location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: Location = {
          name: "Current Location",
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        };
        setCurrentLoc(newLoc);
        setGeoStatus(null);
        setSearchQuery("");
        setSearchResults([]);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("Location permission denied. You can search manually by city.");
        } else if (err.code === err.TIMEOUT) {
          setGeoStatus("Location request timed out. Please try searching instead.");
        } else {
          setGeoStatus("Unable to determine current position.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  const selectLocation = useCallback((loc: Location) => {
    setCurrentLoc(loc);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  return {
    currentLoc,
    snapshot,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    geoStatus,
    handleUseLocation,
    selectLocation,
    retry: () => fetchAirQuality(currentLoc),
  };
}
