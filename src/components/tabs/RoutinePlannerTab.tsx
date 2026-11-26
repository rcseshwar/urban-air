"use client";

import { ACTIVITIES, type ActivityType, type SafeWindowResult } from "@/lib/recommendations";

interface RoutinePlannerTabProps {
  selectedActivity: ActivityType;
  onSelectActivity: (act: ActivityType) => void;
  routinePlan: SafeWindowResult;
}

export function RoutinePlannerTab({
  selectedActivity,
  onSelectActivity,
  routinePlan,
}: RoutinePlannerTabProps) {
  return (
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
            onClick={() => onSelectActivity(act.id)}
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
                background:
                  routinePlan.rating === "Optimal"
                    ? "#064e3b"
                    : routinePlan.rating === "Acceptable"
                    ? "#78350f"
                    : "#7f1d1d",
                color:
                  routinePlan.rating === "Optimal"
                    ? "#6ee7b7"
                    : routinePlan.rating === "Acceptable"
                    ? "#fde68a"
                    : "#fca5a5",
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
                    color:
                      h.aqi <= 50
                        ? "#34d399"
                        : h.aqi <= 100
                        ? "#fbbf24"
                        : h.aqi <= 150
                        ? "#fb923c"
                        : "#f87171",
                  }}
                >
                  {h.aqi}
                </div>
                <span
                  className="timeline-badge"
                  style={{
                    background:
                      h.rating === "Optimal"
                        ? "#064e3b"
                        : h.rating === "Acceptable"
                        ? "#78350f"
                        : "#7f1d1d",
                    color:
                      h.rating === "Optimal"
                        ? "#6ee7b7"
                        : h.rating === "Acceptable"
                        ? "#fde68a"
                        : "#fca5a5",
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
  );
}
