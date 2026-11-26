export type TabId = "overview" | "routine" | "indoor" | "impact" | "community" | "assistant";

interface TabsNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabsNav({ activeTab, onTabChange }: TabsNavProps) {
  return (
    <nav className="tabs-nav" role="tablist" aria-label="Dashboard features">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "overview"}
        aria-controls="tabpanel-overview"
        id="tab-overview"
        className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
        onClick={() => onTabChange("overview")}
      >
        📊 Overview
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "routine"}
        aria-controls="tabpanel-routine"
        id="tab-routine"
        className={`tab-btn ${activeTab === "routine" ? "active" : ""}`}
        onClick={() => onTabChange("routine")}
      >
        ⏰ Routine Planner
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "indoor"}
        aria-controls="tabpanel-indoor"
        id="tab-indoor"
        className={`tab-btn ${activeTab === "indoor" ? "active" : ""}`}
        onClick={() => onTabChange("indoor")}
      >
        🏡 Indoor Guide
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "impact"}
        aria-controls="tabpanel-impact"
        id="tab-impact"
        className={`tab-btn ${activeTab === "impact" ? "active" : ""}`}
        onClick={() => onTabChange("impact")}
      >
        🧮 Impact Calculator
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "community"}
        aria-controls="tabpanel-community"
        id="tab-community"
        className={`tab-btn ${activeTab === "community" ? "active" : ""}`}
        onClick={() => onTabChange("community")}
      >
        📢 Community Mode
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "assistant"}
        aria-controls="tabpanel-assistant"
        id="tab-assistant"
        className={`tab-btn ${activeTab === "assistant" ? "active" : ""}`}
        onClick={() => onTabChange("assistant")}
      >
        ✨ Gemini Assistant
      </button>
    </nav>
  );
}
