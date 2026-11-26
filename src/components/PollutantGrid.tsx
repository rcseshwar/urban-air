import type { Pollutants } from "@/lib/types";

interface PollutantGridProps {
  pollutants: Pollutants;
}

export function PollutantGrid({ pollutants }: PollutantGridProps) {
  return (
    <div className="pollutant-grid" role="region" aria-label="Pollutant concentrations">
      <div className="pollutant-card">
        <div className="pollutant-name">PM2.5 (Fine)</div>
        <div className="pollutant-val">{pollutants.pm2_5 != null ? `${pollutants.pm2_5}` : "—"}</div>
        <div className="pollutant-unit">µg/m³ · 24h EPA breakpoint</div>
      </div>
      <div className="pollutant-card">
        <div className="pollutant-name">PM10 (Coarse)</div>
        <div className="pollutant-val">{pollutants.pm10 != null ? `${pollutants.pm10}` : "—"}</div>
        <div className="pollutant-unit">µg/m³ · inhalable dust</div>
      </div>
      <div className="pollutant-card">
        <div className="pollutant-name">NO₂ (Nitrogen Dioxide)</div>
        <div className="pollutant-val">{pollutants.no2 != null ? `${pollutants.no2}` : "—"}</div>
        <div className="pollutant-unit">µg/m³ · traffic combustion</div>
      </div>
      <div className="pollutant-card">
        <div className="pollutant-name">O₃ (Ozone)</div>
        <div className="pollutant-val">{pollutants.o3 != null ? `${pollutants.o3}` : "—"}</div>
        <div className="pollutant-unit">µg/m³ · photochemical smog</div>
      </div>
      <div className="pollutant-card">
        <div className="pollutant-name">SO₂ (Sulfur Dioxide)</div>
        <div className="pollutant-val">{pollutants.so2 != null ? `${pollutants.so2}` : "—"}</div>
        <div className="pollutant-unit">µg/m³ · coal & industrial</div>
      </div>
      <div className="pollutant-card">
        <div className="pollutant-name">CO (Carbon Monoxide)</div>
        <div className="pollutant-val">{pollutants.co != null ? `${pollutants.co}` : "—"}</div>
        <div className="pollutant-unit">µg/m³ · incomplete burn</div>
      </div>
    </div>
  );
}
