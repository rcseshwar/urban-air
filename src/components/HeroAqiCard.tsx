import type { AirQualitySnapshot, PersonaId } from "@/lib/types";
import { CATEGORY_SYMBOL, type AqiCategory } from "@/lib/aqi";
import type { PersonaRecommendation } from "@/lib/recommendations";
import { PersonaAdviceBanner } from "./PersonaAdviceBanner";
import { PollutantGrid } from "./PollutantGrid";

interface HeroAqiCardProps {
  snapshot: AirQualitySnapshot;
  persona: PersonaId;
  personaRecommendation: PersonaRecommendation;
}

export function HeroAqiCard({ snapshot, persona, personaRecommendation }: HeroAqiCardProps) {
  const aqi = snapshot.providerAqi ?? snapshot.calculatedAqi ?? null;
  const category = snapshot.category;

  const getCatClass = (cat: AqiCategory | null) => {
    if (!cat) return "";
    switch (cat) {
      case "Good":
        return "cat-good";
      case "Moderate":
        return "cat-moderate";
      case "Unhealthy for sensitive groups":
        return "cat-sensitive";
      case "Unhealthy":
        return "cat-unhealthy";
      case "Very unhealthy":
        return "cat-very-unhealthy";
      case "Hazardous":
        return "cat-hazardous";
    }
  };

  return (
    <section className="hero-card" aria-label="Current Air Quality Overview">
      <div className="hero-header">
        <div>
          <h2 className="location-title">
            {snapshot.location.name}
            {snapshot.location.country ? `, ${snapshot.location.country}` : ""}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Coordinates: {snapshot.location.latitude.toFixed(2)}°, {snapshot.location.longitude.toFixed(2)}° · Standard:{" "}
            {snapshot.standard}
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
      <PersonaAdviceBanner persona={persona} recommendation={personaRecommendation} />

      {/* Pollutant breakdown */}
      <PollutantGrid pollutants={snapshot.pollutants} />

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
  );
}
