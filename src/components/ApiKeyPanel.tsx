"use client";

interface ApiKeyPanelProps {
  apiKey: string;
  tempKey: string;
  onTempKeyChange: (val: string) => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  showKeyText: boolean;
  onToggleShowKeyText: () => void;
  notice: string | null;
  onSave: (e: React.FormEvent) => void;
  onClear: () => void;
  inputId: string;
}

export function ApiKeyPanel({
  apiKey,
  tempKey,
  onTempKeyChange,
  showPanel,
  onTogglePanel,
  showKeyText,
  onToggleShowKeyText,
  notice,
  onSave,
  onClear,
  inputId,
}: ApiKeyPanelProps) {
  return (
    <div className="api-key-panel" role="region" aria-label="Gemini API Key Settings">
      <div className="api-key-header">
        <div className="api-key-title">
          <span aria-hidden="true">🔑</span> Gemini API Key (Custom User Key)
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className={`api-key-badge ${apiKey ? "active" : "inactive"}`}>
            {apiKey ? "● Custom Key Active" : "○ Default / Heuristic Mode"}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
            onClick={onTogglePanel}
            aria-expanded={showPanel}
          >
            {showPanel ? "Hide Settings" : "Configure Key"}
          </button>
        </div>
      </div>

      {showPanel && (
        <form onSubmit={onSave} style={{ marginTop: "0.5rem" }}>
          <div className="api-key-form-row">
            <div className="api-key-input-wrapper">
              <label htmlFor={inputId} className="sr-only" style={{ display: "none" }}>
                Gemini API Key
              </label>
              <input
                id={inputId}
                type={showKeyText ? "text" : "password"}
                className="api-key-input"
                placeholder="Paste your Google Gemini API key (AIzaSy...)"
                value={tempKey}
                onChange={(e) => onTempKeyChange(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                className="api-key-toggle-vis"
                onClick={onToggleShowKeyText}
                aria-label={showKeyText ? "Hide API key" : "Show API key"}
                title={showKeyText ? "Hide API key" : "Show API key"}
              >
                {showKeyText ? "🙈" : "👁️"}
              </button>
            </div>
            <button type="submit" className="geo-btn" style={{ fontSize: "0.85rem", padding: "0.55rem 1rem" }}>
              Save Key
            </button>
            {apiKey && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onClear}
                style={{ fontSize: "0.85rem", padding: "0.55rem 0.85rem" }}
              >
                Clear
              </button>
            )}
          </div>

          {notice && (
            <div style={{ fontSize: "0.8rem", color: "#34d399", marginTop: "0.4rem" }} role="status">
              {notice}
            </div>
          )}

          <p className="api-key-help">
            Your key is stored securely in your browser&apos;s localStorage and sent only with your assistant queries.
            If omitted, the assistant uses the server-side environment key or the built-in clinical heuristic engine.
          </p>
        </form>
      )}
    </div>
  );
}
