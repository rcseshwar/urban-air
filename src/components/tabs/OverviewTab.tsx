import type { TabId } from "../TabsNav";

interface OverviewTabProps {
  locationName: string;
  onNavigateTab: (tab: TabId) => void;
}

export function OverviewTab({ locationName, onNavigateTab }: OverviewTabProps) {
  return (
    <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" className="pane">
      <h3 className="pane-title">Health Defense & Exposure Mitigation</h3>
      <p className="pane-subtitle">
        Scientific strategies calibrated to current {locationName} particulate levels.
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
            onClick={() => onNavigateTab("routine")}
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
            onClick={() => onNavigateTab("indoor")}
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
            onClick={() => onNavigateTab("impact")}
            style={{ fontSize: "0.85rem" }}
          >
            Run Impact Calculator →
          </button>
        </div>
      </div>
    </div>
  );
}
