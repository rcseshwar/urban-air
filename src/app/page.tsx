"use client";

import { useEffect, useState, useId } from "react";
import type { AirQualitySnapshot, Location, PersonaId } from "@/lib/types";
import { CATEGORY_SYMBOL, type AqiCategory } from "@/lib/aqi";
import {
  ACTIVITIES,
  PERSONAS,
  calculateCadr,
  calculatePersonalImpact,
  evaluateRoutine,
  generateCommunityFlyer,
  getPersonaRecommendation,
  type ActivityType,
} from "@/lib/recommendations";
import type { AssistantResponse } from "@/lib/gemini";

const DEFAULT_LOCATION: Location = {
  name: "Bengaluru",
  admin: "Karnataka",
  country: "India",
  latitude: 12.97,
  longitude: 77.59,
};

type TabId = "overview" | "routine" | "indoor" | "impact" | "community" | "assistant";

export default function Home() {
  const [persona, setPersona] = useState<PersonaId>("parent");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Location & Data state
  const [currentLoc, setCurrentLoc] = useState<Location>(DEFAULT_LOCATION);
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // Routine planner state
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>("running");

  // Indoor guide state
  const [roomArea, setRoomArea] = useState<number>(250);
  const [ceilingHeight, setCeilingHeight] = useState<number>(8);

  // Impact calculator state
  const [outdoorHours, setOutdoorHours] = useState<number>(3);
  const [maskType, setMaskType] = useState<"none" | "cloth" | "surgical" | "n95">("none");
  const [hasPurifier, setHasPurifier] = useState<boolean>(false);

  // Community state
  const [copiedFlyer, setCopiedFlyer] = useState(false);

  // Gemini assistant state
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<AssistantResponse | null>(null);

  // Gemini API key state (user frontend configuration)
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const [showApiKeyPanel, setShowApiKeyPanel] = useState<boolean>(false);
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  const searchInputId = useId();
  const personaSelectId = useId();
  const apiKeyInputId = useId();

  // Load saved API key from localStorage on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("urban_air_gemini_api_key");
      if (savedKey) {
        setGeminiApiKey(savedKey);
        setTempApiKey(savedKey);
      }
    } catch {
      // LocalStorage access may fail in private mode
    }
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tempApiKey.trim();
    setGeminiApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem("urban_air_gemini_api_key", trimmed);
        setKeyNotice("Gemini API key saved to browser local storage!");
      } else {
        localStorage.removeItem("urban_air_gemini_api_key");
        setKeyNotice("Custom API key removed. Using default assistant fallback.");
      }
    } catch {
      setKeyNotice("Unable to persist key to local storage.");
    }
    setTimeout(() => setKeyNotice(null), 3000);
  };

  const handleClearApiKey = () => {
    setGeminiApiKey("");
    setTempApiKey("");
    try {
      localStorage.removeItem("urban_air_gemini_api_key");
    } catch {}
    setKeyNotice("Custom API key cleared.");
    setTimeout(() => setKeyNotice(null), 3000);
  };

  // Load air quality data
  const fetchAirQuality = async (loc: Location) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/air-quality?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(loc.name)}`);
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
  };

  useEffect(() => {
    fetchAirQuality(currentLoc);
  }, [currentLoc]);

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
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
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
  };

  // Assistant Query
  const handleAskAssistant = async (queryText?: string) => {
    const q = (queryText ?? chatQuestion).trim();
    if (!q) return;
    setChatLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          locationName: currentLoc.name,
          aqi: snapshot?.providerAqi ?? snapshot?.calculatedAqi ?? null,
          category: snapshot?.category ?? null,
          pollutants: snapshot?.pollutants ?? {},
          question: q,
          apiKey: geminiApiKey.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data: AssistantResponse = await res.json();
        setChatResponse(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setChatResponse({
          answer: err.error ?? "Failed to receive assistant response. Please retry.",
          source: "clinical_heuristic",
          disclaimer: "System error occurred.",
        });
      }
    } catch {
      setChatResponse({
        answer: "Network error occurred while contacting assistant. Please verify your connection.",
        source: "clinical_heuristic",
        disclaimer: "Offline notice.",
      });
    } finally {
      setChatLoading(false);
    }
  };

  // Computed views
  const aqi = snapshot?.providerAqi ?? snapshot?.calculatedAqi ?? null;
  const category = snapshot?.category ?? null;
  const personaRec = getPersonaRecommendation(persona, aqi, category);
  const routinePlan = evaluateRoutine(selectedActivity, snapshot?.hourly, aqi);
  const cadrCalc = calculateCadr(roomArea, ceilingHeight);
  const impactCalc = calculatePersonalImpact({
    outdoorAqi: aqi ?? 60,
    outdoorHours,
    maskType,
    hasAirPurifier: hasPurifier,
  });

  const getCatClass = (cat: AqiCategory | null) => {
    if (!cat) return "";
    switch (cat) {
      case "Good": return "cat-good";
      case "Moderate": return "cat-moderate";
      case "Unhealthy for sensitive groups": return "cat-sensitive";
      case "Unhealthy": return "cat-unhealthy";
      case "Very unhealthy": return "cat-very-unhealthy";
      case "Hazardous": return "cat-hazardous";
    }
  };

  const flyerText = generateCommunityFlyer({
    locationName: currentLoc.name,
    aqi: aqi ?? 0,
    category: category ?? "Moderate",
    dateStr: new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" }),
  });

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">🍃</span>
            <div>
              <h1 className="brand-title">Urban Air</h1>
              <p className="brand-tagline">Science-Backed Environmental Health & AQI Defense</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="header-key-btn"
              onClick={() => {
                setActiveTab("assistant");
                setShowApiKeyPanel(true);
              }}
            >
              <span aria-hidden="true">🔑</span>
              <span>{geminiApiKey ? "API Key Configured" : "Enter Gemini Key"}</span>
            </button>

            <div className="persona-selector">
              <label htmlFor={personaSelectId} className="persona-label">
                Active Persona:
              </label>
              <select
                id={personaSelectId}
                className="persona-select"
                value={persona}
                onChange={(e) => setPersona(e.target.value as PersonaId)}
                aria-label="Select persona profile for customized air health advice"
              >
                {Object.values(PERSONAS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container" tabIndex={-1}>
        {/* Search & Geolocation Section */}
        <section className="search-section" aria-label="Location search">
          <div className="search-bar-row">
            <div className="search-input-wrapper">
              <label htmlFor={searchInputId} className="sr-only" style={{ display: "none" }}>
                Search city or location
              </label>
              <input
                id={searchInputId}
                type="search"
                className="search-input"
                placeholder="Search city, district, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search city or location"
                autoComplete="off"
              />
              {isSearching && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)", borderRadius: "8px", zIndex: 49 }}>
                  Searching locations...
                </div>
              )}
              {searchResults.length > 0 && (
                <ul className="search-dropdown" role="listbox" aria-label="Location search suggestions">
                  {searchResults.map((r, idx) => (
                    <li
                      key={`${r.latitude}-${r.longitude}-${idx}`}
                      role="option"
                      aria-selected="false"
                      tabIndex={0}
                      className="search-option"
                      onClick={() => {
                        setCurrentLoc(r);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setCurrentLoc(r);
                          setSearchQuery("");
                          setSearchResults([]);
                        }
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {[r.admin, r.country].filter(Boolean).join(", ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              className="geo-btn"
              onClick={handleUseLocation}
              aria-label="Use My Location"
            >
              <span aria-hidden="true">📍</span> Use My Location
            </button>
          </div>

          {geoStatus && (
            <div className="geo-status" role="status" aria-live="polite">
              {geoStatus}
            </div>
          )}
        </section>

        {/* Loading and Error states */}
        {loading && (
          <div className="hero-card" role="status" aria-live="polite">
            <p style={{ color: "var(--text-muted)" }}>Fetching verified air quality data for {currentLoc.name}...</p>
          </div>
        )}

        {error && !loading && (
          <div className="hero-card" style={{ borderColor: "var(--aqi-unhealthy)" }} role="alert">
            <h2 style={{ color: "#f87171", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Air Quality Data Unavailable
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>{error}</p>
            <button
              type="button"
              className="geo-btn"
              onClick={() => fetchAirQuality(currentLoc)}
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero AQI Card */}
        {snapshot && !loading && (
          <section className="hero-card" aria-label="Current Air Quality Overview">
            <div className="hero-header">
              <div>
                <h2 className="location-title">
                  {snapshot.location.name}
                  {snapshot.location.country ? `, ${snapshot.location.country}` : ""}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Coordinates: {snapshot.location.latitude.toFixed(2)}°, {snapshot.location.longitude.toFixed(2)}° · Standard: {snapshot.standard}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <span className="data-honesty-pill" title="Data kind as classified by EPA transparency principles">
                  <span aria-hidden="true">📊</span> {snapshot.kind}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Measured: {new Date(snapshot.measuredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
                </span>
              </div>
            </div>

            <div className="aqi-metrics-row">
              <div className="aqi-number-box">
                <span className="aqi-number" style={{ color: aqi != null && aqi > 100 ? "#f87171" : "#34d399" }}>
                  {aqi ?? "N/A"}
                </span>
                <span className="aqi-standard-tag">US EPA AQI</span>
              </div>

              {category && (
                <div className={`category-badge-lg ${getCatClass(category)}`}>
                  <span className="non-color-symbol" aria-hidden="true">
                    {CATEGORY_SYMBOL[category]}
                  </span>
                  <span>{category}</span>
                </div>
              )}
            </div>

            {/* Persona Actionable Banner */}
            <div className="persona-advice-banner" role="region" aria-label="Persona-specific action banner">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#38bdf8", fontWeight: 700 }}>
                  Tailored for {PERSONAS[persona].label}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Priority: {PERSONAS[persona].priorityPollutant}
                </span>
              </div>
              <h3 className="banner-headline">{personaRec.headline}</h3>
              <ul className="banner-list">
                {personaRec.actions.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.8rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>Mask: </strong>
                  <span style={{ color: "var(--text-secondary)" }}>{personaRec.maskAdvice}</span>
                </div>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>Indoor: </strong>
                  <span style={{ color: "var(--text-secondary)" }}>{personaRec.indoorAdvice}</span>
                </div>
              </div>
            </div>

            {/* Pollutant breakdown */}
            <div className="pollutant-grid" role="region" aria-label="Pollutant concentrations">
              <div className="pollutant-card">
                <div className="pollutant-name">PM2.5 (Fine)</div>
                <div className="pollutant-val">{snapshot.pollutants.pm2_5 != null ? `${snapshot.pollutants.pm2_5}` : "—"}</div>
                <div className="pollutant-unit">µg/m³ · 24h EPA breakpoint</div>
              </div>
              <div className="pollutant-card">
                <div className="pollutant-name">PM10 (Coarse)</div>
                <div className="pollutant-val">{snapshot.pollutants.pm10 != null ? `${snapshot.pollutants.pm10}` : "—"}</div>
                <div className="pollutant-unit">µg/m³ · inhalable dust</div>
              </div>
              <div className="pollutant-card">
                <div className="pollutant-name">NO₂ (Nitrogen Dioxide)</div>
                <div className="pollutant-val">{snapshot.pollutants.no2 != null ? `${snapshot.pollutants.no2}` : "—"}</div>
                <div className="pollutant-unit">µg/m³ · traffic combustion</div>
              </div>
              <div className="pollutant-card">
                <div className="pollutant-name">O₃ (Ozone)</div>
                <div className="pollutant-val">{snapshot.pollutants.o3 != null ? `${snapshot.pollutants.o3}` : "—"}</div>
                <div className="pollutant-unit">µg/m³ · photochemical smog</div>
              </div>
              <div className="pollutant-card">
                <div className="pollutant-name">SO₂ (Sulfur Dioxide)</div>
                <div className="pollutant-val">{snapshot.pollutants.so2 != null ? `${snapshot.pollutants.so2}` : "—"}</div>
                <div className="pollutant-unit">µg/m³ · coal & industrial</div>
              </div>
              <div className="pollutant-card">
                <div className="pollutant-name">CO (Carbon Monoxide)</div>
                <div className="pollutant-val">{snapshot.pollutants.co != null ? `${snapshot.pollutants.co}` : "—"}</div>
                <div className="pollutant-unit">µg/m³ · incomplete burn</div>
              </div>
            </div>

            {/* Discrepancy & Provider Notes */}
            {snapshot.notes.length > 0 && (
              <div className="alert-note" role="note">
                {snapshot.notes.map((note, idx) => (
                  <p key={idx} style={{ marginBottom: idx < snapshot.notes.length - 1 ? "0.3rem" : 0 }}>
                    ℹ️ {note}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Feature Tabs Navigation */}
        <nav className="tabs-nav" role="tablist" aria-label="Dashboard features">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            aria-controls="tabpanel-overview"
            id="tab-overview"
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "routine"}
            aria-controls="tabpanel-routine"
            id="tab-routine"
            className={`tab-btn ${activeTab === "routine" ? "active" : ""}`}
            onClick={() => setActiveTab("routine")}
          >
            ⏰ Routine Planner
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "indoor"}
            aria-controls="tabpanel-indoor"
            id="tab-indoor"
            className={`tab-btn ${activeTab === "indoor" ? "active" : ""}`}
            onClick={() => setActiveTab("indoor")}
          >
            🏡 Indoor Guide
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "impact"}
            aria-controls="tabpanel-impact"
            id="tab-impact"
            className={`tab-btn ${activeTab === "impact" ? "active" : ""}`}
            onClick={() => setActiveTab("impact")}
          >
            🧮 Impact Calculator
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "community"}
            aria-controls="tabpanel-community"
            id="tab-community"
            className={`tab-btn ${activeTab === "community" ? "active" : ""}`}
            onClick={() => setActiveTab("community")}
          >
            📢 Community Mode
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "assistant"}
            aria-controls="tabpanel-assistant"
            id="tab-assistant"
            className={`tab-btn ${activeTab === "assistant" ? "active" : ""}`}
            onClick={() => setActiveTab("assistant")}
          >
            ✨ Gemini Assistant
          </button>
        </nav>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" className="pane">
            <h3 className="pane-title">Health Defense & Exposure Mitigation</h3>
            <p className="pane-subtitle">
              Scientific strategies calibrated to current {currentLoc.name} particulate levels.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "0.5rem", fontSize: "1rem" }}>
                  1. Outdoor Activity Timing
                </h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  Particulate concentrations frequently peak during morning inversions (7:00 AM – 9:30 AM) and evening rush hours.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab("routine")}
                  style={{ fontSize: "0.85rem" }}
                >
                  View 24h Safe Windows →
                </button>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "0.5rem", fontSize: "1rem" }}>
                  2. Air Cleaner / HEPA Sizing
                </h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  Calculate the exact Clean Air Delivery Rate (CADR) required for your living space or nursery to keep indoor PM2.5 under 10 µg/m³.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab("indoor")}
                  style={{ fontSize: "0.85rem" }}
                >
                  Calculate HEPA CADR →
                </button>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "0.5rem", fontSize: "1rem" }}>
                  3. Personal Exposure Reduction
                </h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  Simulate your daily inhaled particulate mass and discover how certified N95 masks drop your lung burden by over 80%.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab("impact")}
                  style={{ fontSize: "0.85rem" }}
                >
                  Run Impact Calculator →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROUTINE PLANNER */}
        {activeTab === "routine" && (
          <div id="tabpanel-routine" role="tabpanel" aria-labelledby="tab-routine" className="pane">
            <h3 className="pane-title">Daily Activity & Routine Planner</h3>
            <p className="pane-subtitle">
              Select your scheduled daily activity to evaluate hourly exposure windows and identify safe outdoor intervals.
            </p>

            <div className="activity-selector" role="radiogroup" aria-label="Select outdoor activity to plan">
              {ACTIVITIES.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedActivity === act.id}
                  className={`activity-btn ${selectedActivity === act.id ? "selected" : ""}`}
                  onClick={() => setSelectedActivity(act.id)}
                >
                  <span aria-hidden="true">{act.icon}</span>
                  <span>{act.title}</span>
                </button>
              ))}
            </div>

            <div className="best-window-callout" role="region" aria-label="Best activity window">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h4 style={{ color: "#10b981", fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                    Recommended Window: {routinePlan.bestTime} (AQI ~{routinePlan.bestAqi})
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{routinePlan.summary}</p>
                </div>
                <div style={{ alignSelf: "center" }}>
                  <span
                    style={{
                      background: routinePlan.rating === "Optimal" ? "#064e3b" : routinePlan.rating === "Acceptable" ? "#78350f" : "#7f1d1d",
                      color: routinePlan.rating === "Optimal" ? "#6ee7b7" : routinePlan.rating === "Acceptable" ? "#fde68a" : "#fca5a5",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    Rating: {routinePlan.rating}
                  </span>
                </div>
              </div>
            </div>

            {routinePlan.hourlyEvaluations.length > 0 ? (
              <div style={{ marginTop: "1.5rem" }}>
                <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  Hourly Forecast Timeline (Next 18 Hours):
                </h4>
                <div className="timeline-grid" role="region" aria-label="Hourly AQI Forecast">
                  {routinePlan.hourlyEvaluations.map((h, i) => (
                    <div key={i} className="timeline-hour-card">
                      <div className="timeline-hour">{h.hourLabel}</div>
                      <div
                        className="timeline-aqi"
                        style={{
                          color: h.aqi <= 50 ? "#34d399" : h.aqi <= 100 ? "#fbbf24" : h.aqi <= 150 ? "#fb923c" : "#f87171",
                        }}
                      >
                        {h.aqi}
                      </div>
                      <span
                        className="timeline-badge"
                        style={{
                          background: h.rating === "Optimal" ? "#064e3b" : h.rating === "Acceptable" ? "#78350f" : "#7f1d1d",
                          color: h.rating === "Optimal" ? "#6ee7b7" : h.rating === "Acceptable" ? "#fde68a" : "#fca5a5",
                        }}
                      >
                        {h.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Hourly breakdown is derived from Open-Meteo 24-hour model predictions.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: INDOOR GUIDE */}
        {activeTab === "indoor" && (
          <div id="tabpanel-indoor" role="tabpanel" aria-labelledby="tab-indoor" className="pane">
            <h3 className="pane-title">Indoor Air Quality & HEPA Engineering Guide</h3>
            <p className="pane-subtitle">
              Outdoor air penetrates homes through leaks and HVAC intakes. Protect indoor spaces with science-based filtration and ventilation protocols.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {/* CADR Calculator */}
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "0.75rem", fontSize: "1.05rem" }}>
                  🎛️ HEPA Purifier CADR Sizing Calculator
                </h4>
                <div className="form-group">
                  <label htmlFor="room-area-input" className="form-label">
                    Room Floor Area (sq ft): {roomArea} sq ft
                  </label>
                  <input
                    id="room-area-input"
                    type="range"
                    min="60"
                    max="1200"
                    step="20"
                    value={roomArea}
                    onChange={(e) => setRoomArea(Number(e.target.value))}
                    className="form-input"
                    aria-label="Room floor area in square feet"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ceiling-height-input" className="form-label">
                    Ceiling Height: {ceilingHeight} ft
                  </label>
                  <input
                    id="ceiling-height-input"
                    type="range"
                    min="7"
                    max="14"
                    step="1"
                    value={ceilingHeight}
                    onChange={(e) => setCeilingHeight(Number(e.target.value))}
                    className="form-input"
                    aria-label="Ceiling height in feet"
                  />
                </div>

                <div style={{ background: "#0f172a", padding: "1rem", borderRadius: "6px", marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Required Clean Air Delivery:</span>
                    <strong style={{ color: "#34d399", fontSize: "1.1rem" }}>{cadrCalc.targetCfm} Smoke CFM</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Metric Flow Equivalent:</span>
                    <strong style={{ color: "#38bdf8", fontSize: "1rem" }}>{cadrCalc.targetM3h} m³/h</strong>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{cadrCalc.recommendation}</p>
                </div>
              </div>

              {/* Natural Ventilation Decision */}
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "0.75rem", fontSize: "1.05rem" }}>
                  🪟 Natural Ventilation Advisor
                </h4>
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "6px",
                    background: (aqi ?? 50) <= 50 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${(aqi ?? 50) <= 50 ? "#10b981" : "#ef4444"}`,
                    marginBottom: "1rem",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "0.25rem", color: (aqi ?? 50) <= 50 ? "#6ee7b7" : "#fca5a5" }}>
                    {(aqi ?? 50) <= 50 ? "✓ WINDOWS OPEN SAFE" : "⛔ KEEP WINDOWS SHUT"}
                  </strong>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {(aqi ?? 50) <= 50
                      ? "Outdoor air is cleaner than indoor stagnant air. Open opposing windows for 20-30 minutes to purge indoor CO2 and cooking emissions."
                      : "Outdoor particulate levels exceed safe respiratory thresholds. Keep windows and balcony doors sealed. Use internal fan recirculation."}
                  </p>
                </div>

                <h5 style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Household Emission Checklist:
                </h5>
                <ul style={{ listStyle: "none", fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <li>🍳 <strong>Cooking:</strong> Run range hood on high whenever frying or sautéing; gas burners generate high NO2.</li>
                  <li>🕯️ <strong>No Combustion:</strong> Eliminate indoor candles, incense sticks, and unvented kerosene heaters.</li>
                  <li>🧹 <strong>Dusting:</strong> Use damp micro-fiber cloths; dry sweeping aerosolizes settled PM10.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: IMPACT CALCULATOR */}
        {activeTab === "impact" && (
          <div id="tabpanel-impact" role="tabpanel" aria-labelledby="tab-impact" className="pane">
            <h3 className="pane-title">Personal Inhaled Dose & Health Impact Calculator</h3>
            <p className="pane-subtitle">
              Calculate your daily microgram intake of PM2.5 based on your exposure hours and protective interventions.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "1rem", fontSize: "1.05rem" }}>Simulation Parameters</h4>

                <div className="form-group">
                  <label htmlFor="outdoor-hours-input" className="form-label">
                    Daily Outdoor Exposure: {outdoorHours} Hours
                  </label>
                  <input
                    id="outdoor-hours-input"
                    type="range"
                    min="0"
                    max="16"
                    step="0.5"
                    value={outdoorHours}
                    onChange={(e) => setOutdoorHours(Number(e.target.value))}
                    className="form-input"
                    aria-label="Daily outdoor exposure in hours"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mask-select" className="form-label">
                    Outdoor Respiratory Protection:
                  </label>
                  <select
                    id="mask-select"
                    className="form-select"
                    value={maskType}
                    onChange={(e) => setMaskType(e.target.value as "none" | "cloth" | "surgical" | "n95")}
                    aria-label="Mask type"
                  >
                    <option value="none">No Mask (0% filtration)</option>
                    <option value="cloth">Cloth Mask (~25% filtration)</option>
                    <option value="surgical">Surgical Mask (~45% filtration)</option>
                    <option value="n95">Certified N95 / FFP2 (~92% real-world fit)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={hasPurifier}
                      onChange={(e) => setHasPurifier(e.target.checked)}
                      style={{ width: "18px", height: "18px" }}
                    />
                    <span>Home has running HEPA Air Purifier</span>
                  </label>
                </div>
              </div>

              {/* Impact Results */}
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "1rem", fontSize: "1.05rem" }}>Estimated Daily Lung Intake</h4>

                <div className="impact-results-grid">
                  <div className="impact-metric-box">
                    <div className="metric-val-lg">{impactCalc.inhaledPm25Ug} µg</div>
                    <div className="metric-label">PM2.5 Inhaled / Day</div>
                  </div>

                  <div className="impact-metric-box">
                    <div className="metric-val-lg" style={{ color: "#34d399" }}>
                      -{impactCalc.protectionPercentage}%
                    </div>
                    <div className="metric-label">Harm Reduction vs Unprotected</div>
                  </div>

                  <div className="impact-metric-box">
                    <div className="metric-val-lg" style={{ color: impactCalc.cigaretteEquivalent > 1 ? "#fb923c" : "#34d399" }}>
                      ~{impactCalc.cigaretteEquivalent}
                    </div>
                    <div className="metric-label">Cigarette Particle Equivalent</div>
                  </div>
                </div>

                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", fontStyle: "italic" }}>
                  {impactCalc.caveatNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMMUNITY MODE */}
        {activeTab === "community" && (
          <div id="tabpanel-community" role="tabpanel" aria-labelledby="tab-community" className="pane">
            <h3 className="pane-title">Community Air Quality Mobilizer</h3>
            <p className="pane-subtitle">
              Empower resident welfare associations, neighborhood WhatsApp groups, schools, and local volunteers with actionable public notices.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {/* Flyer Generator */}
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "0.5rem", fontSize: "1.05rem" }}>
                  📋 Printable & Shareable Health Advisory Notice
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  Instantly formatted for printing on noticeboards or copying into community messaging channels.
                </p>

                <textarea
                  readOnly
                  value={flyerText}
                  className="flyer-textarea"
                  aria-label="Generated community health advisory text"
                />

                <div className="flyer-actions">
                  <button
                    type="button"
                    className="geo-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(flyerText);
                      setCopiedFlyer(true);
                      setTimeout(() => setCopiedFlyer(false), 2500);
                    }}
                  >
                    {copiedFlyer ? "✓ Copied to Clipboard!" : "📋 Copy Notice Text"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => window.print()}
                  >
                    🖨️ Print / PDF
                  </button>
                </div>
              </div>

              {/* Community Playbook */}
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "0.75rem", fontSize: "1.05rem" }}>
                  🤝 Vulnerable Neighbor Protection Protocol
                </h4>
                <ul style={{ listStyle: "disc", marginLeft: "1.25rem", fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <li>
                    <strong>Senior Welfare Check:</strong> Ring or visit elderly neighbors living alone, especially those with diagnosed hypertension or COPD.
                  </li>
                  <li>
                    <strong>School & Daycare Recess Policy:</strong> When AQI exceeds 100, push for indoor recess. Over 150 requires immediate suspension of strenuous aerobic activities.
                  </li>
                  <li>
                    <strong>Clean Air Respite Points:</strong> Identify air-conditioned municipal libraries, banks, or community centers where residents in unsealed housing can sit safely during peak smog.
                  </li>
                  <li>
                    <strong>Anti-Idling & Leaf Burning:</strong> Remind maintenance staff and delivery vehicles not to leave engines idling outside residential buildings.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: GEMINI ASSISTANT */}
        {activeTab === "assistant" && (
          <div id="tabpanel-assistant" role="tabpanel" aria-labelledby="tab-assistant" className="pane">
            <h3 className="pane-title">Gemini Environmental Health Assistant</h3>
            <p className="pane-subtitle">
              Ask any question regarding your current air quality, children&apos;s outdoor safety, mask selection, or indoor filtration.
            </p>

            {/* Gemini API Key Configuration Panel */}
            <div className="api-key-panel" role="region" aria-label="Gemini API Key Settings">
              <div className="api-key-header">
                <div className="api-key-title">
                  <span aria-hidden="true">🔑</span> Gemini API Key (Custom User Key)
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className={`api-key-badge ${geminiApiKey ? "active" : "inactive"}`}>
                    {geminiApiKey ? "● Custom Key Active" : "○ Default / Heuristic Mode"}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
                    onClick={() => setShowApiKeyPanel(!showApiKeyPanel)}
                    aria-expanded={showApiKeyPanel}
                  >
                    {showApiKeyPanel ? "Hide Settings" : "Configure Key"}
                  </button>
                </div>
              </div>

              {showApiKeyPanel && (
                <form onSubmit={handleSaveApiKey} style={{ marginTop: "0.5rem" }}>
                  <div className="api-key-form-row">
                    <div className="api-key-input-wrapper">
                      <label htmlFor={apiKeyInputId} className="sr-only" style={{ display: "none" }}>
                        Gemini API Key
                      </label>
                      <input
                        id={apiKeyInputId}
                        type={showKeyText ? "text" : "password"}
                        className="api-key-input"
                        placeholder="Paste your Google Gemini API key (AIzaSy...)"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                      />
                      <button
                        type="button"
                        className="api-key-toggle-vis"
                        onClick={() => setShowKeyText(!showKeyText)}
                        aria-label={showKeyText ? "Hide API key" : "Show API key"}
                        title={showKeyText ? "Hide API key" : "Show API key"}
                      >
                        {showKeyText ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <button type="submit" className="geo-btn" style={{ fontSize: "0.85rem", padding: "0.55rem 1rem" }}>
                      Save Key
                    </button>
                    {geminiApiKey && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleClearApiKey}
                        style={{ fontSize: "0.85rem", padding: "0.55rem 0.85rem" }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {keyNotice && (
                    <div style={{ fontSize: "0.8rem", color: "#34d399", marginTop: "0.4rem" }} role="status">
                      {keyNotice}
                    </div>
                  )}

                  <p className="api-key-help">
                    Your key is stored securely in your browser&apos;s localStorage and sent only with your assistant queries.
                    If omitted, the assistant uses the server-side environment key or the built-in clinical heuristic engine.
                  </p>
                </form>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="quick-prompts" role="group" aria-label="Suggested quick questions">
              {[
                "Is it safe to go for a run right now?",
                "What mask should I choose for an 8-hour shift?",
                "How do I protect my toddler from roadside exhaust?",
                "Should I open my bedroom windows tonight?",
                "Precautions for elderly relatives with hypertension?",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="prompt-chip"
                  onClick={() => {
                    setChatQuestion(chip);
                    handleAskAssistant(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Query Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAssistant();
              }}
            >
              <div className="chat-input-row">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Ask a specific health or air quality question..."
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  disabled={chatLoading}
                  aria-label="Ask assistant question"
                />
                <button
                  type="submit"
                  className="geo-btn"
                  disabled={chatLoading || !chatQuestion.trim()}
                  style={{ opacity: chatLoading ? 0.7 : 1 }}
                >
                  {chatLoading ? "Thinking..." : "Ask Assistant"}
                </button>
              </div>
            </form>

            {/* Response Card */}
            {chatResponse && (
              <div className="chat-response-card" role="region" aria-label="Assistant response">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="chat-source-badge">
                    {chatResponse.source === "gemini" ? "✨ Gemini AI" : "🩺 Clinical Heuristic Engine"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Calibrated for {PERSONAS[persona].label}
                  </span>
                </div>

                <div className="chat-answer-text">{chatResponse.answer}</div>

                <div className="chat-disclaimer">
                  ⚠️ {chatResponse.disclaimer}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
