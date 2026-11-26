"use client";

import type { PersonaId } from "@/lib/types";
import { PERSONAS } from "@/lib/recommendations";

interface HeaderProps {
  persona: PersonaId;
  onPersonaChange: (p: PersonaId) => void;
  hasCustomKey: boolean;
  onConfigureKeyClick: () => void;
  personaSelectId: string;
}

export function Header({
  persona,
  onPersonaChange,
  hasCustomKey,
  onConfigureKeyClick,
  personaSelectId,
}: HeaderProps) {
  return (
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
            onClick={onConfigureKeyClick}
          >
            <span aria-hidden="true">🔑</span>
            <span>{hasCustomKey ? "API Key Configured" : "Enter Gemini Key"}</span>
          </button>

          <div className="persona-selector">
            <label htmlFor={personaSelectId} className="persona-label">
              Active Persona:
            </label>
            <select
              id={personaSelectId}
              className="persona-select"
              value={persona}
              onChange={(e) => onPersonaChange(e.target.value as PersonaId)}
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
  );
}
