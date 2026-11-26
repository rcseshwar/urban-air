"use client";

import type { Location } from "@/lib/types";

interface LocationSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Location[];
  isSearching: boolean;
  onSelectLocation: (loc: Location) => void;
  onUseLocation: () => void;
  geoStatus: string | null;
  inputId: string;
}

export function LocationSearch({
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onSelectLocation,
  onUseLocation,
  geoStatus,
  inputId,
}: LocationSearchProps) {
  return (
    <section className="search-section" aria-label="Location search">
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <label htmlFor={inputId} className="sr-only" style={{ display: "none" }}>
            Search city or location
          </label>
          <input
            id={inputId}
            type="search"
            className="search-input"
            placeholder="Search city, district, or region..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search city or location"
            autoComplete="off"
          />

          {isSearching && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                borderRadius: "8px",
                zIndex: 49,
              }}
            >
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
                  onClick={() => onSelectLocation(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectLocation(r);
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
          onClick={onUseLocation}
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
  );
}
