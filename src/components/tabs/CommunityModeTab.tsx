"use client";

import { useState } from "react";

interface CommunityModeTabProps {
  flyerText: string;
}

export function CommunityModeTab({ flyerText }: CommunityModeTabProps) {
  const [copiedFlyer, setCopiedFlyer] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(flyerText);
      setCopiedFlyer(true);
      setTimeout(() => setCopiedFlyer(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
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
              onClick={handleCopy}
            >
              {copiedFlyer ? "✓ Copied to Clipboard!" : "📋 Copy Notice Text"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrint}
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
          <ul
            style={{
              listStyle: "disc",
              marginLeft: "1.25rem",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
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
  );
}
