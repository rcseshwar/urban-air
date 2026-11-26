"use client";

import type { ImpactCalculation } from "@/lib/recommendations";

interface ImpactCalculatorTabProps {
  outdoorHours: number;
  onOutdoorHoursChange: (hours: number) => void;
  maskType: "none" | "cloth" | "surgical" | "n95";
  onMaskTypeChange: (mask: "none" | "cloth" | "surgical" | "n95") => void;
  hasPurifier: boolean;
  onHasPurifierChange: (has: boolean) => void;
  impactCalc: ImpactCalculation;
}

export function ImpactCalculatorTab({
  outdoorHours,
  onOutdoorHoursChange,
  maskType,
  onMaskTypeChange,
  hasPurifier,
  onHasPurifierChange,
  impactCalc,
}: ImpactCalculatorTabProps) {
  return (
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
              onChange={(e) => onOutdoorHoursChange(Number(e.target.value))}
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
              onChange={(e) => onMaskTypeChange(e.target.value as "none" | "cloth" | "surgical" | "n95")}
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
                onChange={(e) => onHasPurifierChange(e.target.checked)}
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
              <div
                className="metric-val-lg"
                style={{ color: impactCalc.cigaretteEquivalent > 1 ? "#fb923c" : "#34d399" }}
              >
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
  );
}
