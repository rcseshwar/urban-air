import type { PersonaId } from "@/lib/types";
import { PERSONAS, type PersonaRecommendation } from "@/lib/recommendations";

interface PersonaAdviceBannerProps {
  persona: PersonaId;
  recommendation: PersonaRecommendation;
}

export function PersonaAdviceBanner({ persona, recommendation }: PersonaAdviceBannerProps) {
  return (
    <div className="persona-advice-banner" role="region" aria-label="Persona-specific action banner">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        <span
          style={{
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#38bdf8",
            fontWeight: 700,
          }}
        >
          Tailored for {PERSONAS[persona].label}
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Priority: {PERSONAS[persona].priorityPollutant}
        </span>
      </div>
      <h3 className="banner-headline">{recommendation.headline}</h3>
      <ul className="banner-list">
        {recommendation.actions.map((act, i) => (
          <li key={i}>{act}</li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.8rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Mask: </strong>
          <span style={{ color: "var(--text-secondary)" }}>{recommendation.maskAdvice}</span>
        </div>
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Indoor: </strong>
          <span style={{ color: "var(--text-secondary)" }}>{recommendation.indoorAdvice}</span>
        </div>
      </div>
    </div>
  );
}
