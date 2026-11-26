"use client";

interface IndoorGuideTabProps {
  roomArea: number;
  onRoomAreaChange: (area: number) => void;
  ceilingHeight: number;
  onCeilingHeightChange: (height: number) => void;
  cadrCalc: { targetCfm: number; targetM3h: number; recommendation: string };
  currentAqi: number | null;
}

export function IndoorGuideTab({
  roomArea,
  onRoomAreaChange,
  ceilingHeight,
  onCeilingHeightChange,
  cadrCalc,
  currentAqi,
}: IndoorGuideTabProps) {
  const isSafeAir = (currentAqi ?? 50) <= 50;

  return (
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
              onChange={(e) => onRoomAreaChange(Number(e.target.value))}
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
              onChange={(e) => onCeilingHeightChange(Number(e.target.value))}
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
              background: isSafeAir ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${isSafeAir ? "#10b981" : "#ef4444"}`,
              marginBottom: "1rem",
            }}
          >
            <strong style={{ display: "block", marginBottom: "0.25rem", color: isSafeAir ? "#6ee7b7" : "#fca5a5" }}>
              {isSafeAir ? "✓ WINDOWS OPEN SAFE" : "⛔ KEEP WINDOWS SHUT"}
            </strong>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {isSafeAir
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
  );
}
