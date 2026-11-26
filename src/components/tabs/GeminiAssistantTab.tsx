"use client";

import { useState } from "react";
import type { PersonaId, Pollutants } from "@/lib/types";
import { PERSONAS } from "@/lib/recommendations";
import type { AssistantResponse } from "@/lib/gemini";
import { ApiKeyPanel } from "../ApiKeyPanel";

const QUICK_PROMPTS = [
  "Is it safe to go for a run right now?",
  "What mask should I choose for an 8-hour shift?",
  "How do I protect my toddler from roadside exhaust?",
  "Should I open my bedroom windows tonight?",
  "Precautions for elderly relatives with hypertension?",
];

interface GeminiAssistantTabProps {
  persona: PersonaId;
  locationName: string;
  aqi: number | null;
  category: string | null;
  pollutants: Pollutants;
  apiKey: string;
  tempKey: string;
  onTempKeyChange: (val: string) => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  showKeyText: boolean;
  onToggleShowKeyText: () => void;
  keyNotice: string | null;
  onSaveKey: (e: React.FormEvent) => void;
  onClearKey: () => void;
  apiKeyInputId: string;
}

export function GeminiAssistantTab({
  persona,
  locationName,
  aqi,
  category,
  pollutants,
  apiKey,
  tempKey,
  onTempKeyChange,
  showPanel,
  onTogglePanel,
  showKeyText,
  onToggleShowKeyText,
  keyNotice,
  onSaveKey,
  onClearKey,
  apiKeyInputId,
}: GeminiAssistantTabProps) {
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<AssistantResponse | null>(null);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText ?? chatQuestion).trim();
    if (!q) return;
    setChatLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          locationName,
          aqi,
          category,
          pollutants,
          question: q,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data: AssistantResponse = await res.json();
        setChatResponse(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setChatResponse({
          answer: err.error ?? "Failed to receive assistant response. Please retry.",
          source: "clinical_heuristic",
          disclaimer: "System error occurred.",
        });
      }
    } catch {
      setChatResponse({
        answer: "Network error occurred while contacting assistant. Please verify your connection.",
        source: "clinical_heuristic",
        disclaimer: "Offline notice.",
      });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div id="tabpanel-assistant" role="tabpanel" aria-labelledby="tab-assistant" className="pane">
      <h3 className="pane-title">Gemini Environmental Health Assistant</h3>
      <p className="pane-subtitle">
        Ask any question regarding your current air quality, children&apos;s outdoor safety, mask selection, or indoor filtration.
      </p>

      {/* Gemini API Key Configuration Panel */}
      <ApiKeyPanel
        apiKey={apiKey}
        tempKey={tempKey}
        onTempKeyChange={onTempKeyChange}
        showPanel={showPanel}
        onTogglePanel={onTogglePanel}
        showKeyText={showKeyText}
        onToggleShowKeyText={onToggleShowKeyText}
        notice={keyNotice}
        onSave={onSaveKey}
        onClear={onClearKey}
        inputId={apiKeyInputId}
      />

      {/* Quick Prompt Chips */}
      <div className="quick-prompts" role="group" aria-label="Suggested quick questions">
        {QUICK_PROMPTS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            className="prompt-chip"
            onClick={() => {
              setChatQuestion(chip);
              handleAsk(chip);
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Query Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
      >
        <div className="chat-input-row">
          <input
            type="text"
            className="search-input"
            placeholder="Ask a specific health or air quality question..."
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            disabled={chatLoading}
            aria-label="Ask assistant question"
          />
          <button
            type="submit"
            className="geo-btn"
            disabled={chatLoading || !chatQuestion.trim()}
            style={{ opacity: chatLoading ? 0.7 : 1 }}
          >
            {chatLoading ? "Thinking..." : "Ask Assistant"}
          </button>
        </div>
      </form>

      {/* Response Card */}
      {chatResponse && (
        <div className="chat-response-card" role="region" aria-label="Assistant response">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="chat-source-badge">
              {chatResponse.source === "gemini" ? "✨ Gemini AI" : "🩺 Clinical Heuristic Engine"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Calibrated for {PERSONAS[persona].label}
            </span>
          </div>

          <div className="chat-answer-text">{chatResponse.answer}</div>

          <div className="chat-disclaimer">⚠️ {chatResponse.disclaimer}</div>
        </div>
      )}
    </div>
  );
}
