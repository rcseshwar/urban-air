"use client";

import { useState, useId } from "react";
import type { PersonaId } from "@/lib/types";
import {
  calculateCadr,
  calculatePersonalImpact,
  evaluateRoutine,
  generateCommunityFlyer,
  getPersonaRecommendation,
  type ActivityType,
} from "@/lib/recommendations";
import { useAirQuality } from "@/hooks/useAirQuality";
import { useGeminiApiKey } from "@/hooks/useGeminiApiKey";
import { Header } from "@/components/Header";
import { LocationSearch } from "@/components/LocationSearch";
import { HeroAqiCard } from "@/components/HeroAqiCard";
import { TabsNav, type TabId } from "@/components/TabsNav";
import { OverviewTab } from "@/components/tabs/OverviewTab";
import { RoutinePlannerTab } from "@/components/tabs/RoutinePlannerTab";
import { IndoorGuideTab } from "@/components/tabs/IndoorGuideTab";
import { ImpactCalculatorTab } from "@/components/tabs/ImpactCalculatorTab";
import { CommunityModeTab } from "@/components/tabs/CommunityModeTab";
import { GeminiAssistantTab } from "@/components/tabs/GeminiAssistantTab";

export default function Home() {
  const [persona, setPersona] = useState<PersonaId>("parent");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Custom Hooks for Air Quality and API Key state
  const {
    currentLoc,
    snapshot,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    geoStatus,
    handleUseLocation,
    selectLocation,
    retry,
  } = useAirQuality();

  const {
    apiKey,
    tempKey,
    setTempKey,
    showPanel,
    setShowPanel,
    showKeyText,
    setShowKeyText,
    notice: keyNotice,
    saveKey,
    clearKey,
  } = useGeminiApiKey();

  // Subcomponent parameter states
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>("running");
  const [roomArea, setRoomArea] = useState<number>(250);
  const [ceilingHeight, setCeilingHeight] = useState<number>(8);
  const [outdoorHours, setOutdoorHours] = useState<number>(3);
  const [maskType, setMaskType] = useState<"none" | "cloth" | "surgical" | "n95">("none");
  const [hasPurifier, setHasPurifier] = useState<boolean>(false);

  // Form IDs for accessibility
  const searchInputId = useId();
  const personaSelectId = useId();
  const apiKeyInputId = useId();

  // Computed calculations
  const aqi = snapshot?.providerAqi ?? snapshot?.calculatedAqi ?? null;
  const category = snapshot?.category ?? null;
  const personaRec = getPersonaRecommendation(persona, aqi, category);
  const routinePlan = evaluateRoutine(selectedActivity, snapshot?.hourly, aqi);
  const cadrCalc = calculateCadr(roomArea, ceilingHeight);
  const impactCalc = calculatePersonalImpact({
    outdoorAqi: aqi ?? 60,
    outdoorHours,
    maskType,
    hasAirPurifier: hasPurifier,
  });

  const flyerText = generateCommunityFlyer({
    locationName: currentLoc.name,
    aqi: aqi ?? 0,
    category: category ?? "Moderate",
    dateStr: new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  });

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <Header
        persona={persona}
        onPersonaChange={setPersona}
        hasCustomKey={!!apiKey}
        onConfigureKeyClick={() => {
          setActiveTab("assistant");
          setShowPanel(true);
        }}
        personaSelectId={personaSelectId}
      />

      <main id="main-content" className="container" tabIndex={-1}>
        {/* Search & Geolocation Section */}
        <LocationSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onSelectLocation={selectLocation}
          onUseLocation={handleUseLocation}
          geoStatus={geoStatus}
          inputId={searchInputId}
        />

        {/* Loading and Error states */}
        {loading && (
          <div className="hero-card" role="status" aria-live="polite">
            <p style={{ color: "var(--text-muted)" }}>
              Fetching verified air quality data for {currentLoc.name}...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="hero-card" style={{ borderColor: "var(--aqi-unhealthy)" }} role="alert">
            <h2 style={{ color: "#f87171", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Air Quality Data Unavailable
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>{error}</p>
            <button type="button" className="geo-btn" onClick={retry}>
              Retry
            </button>
          </div>
        )}

        {/* Hero AQI Card */}
        {snapshot && !loading && (
          <HeroAqiCard
            snapshot={snapshot}
            persona={persona}
            personaRecommendation={personaRec}
          />
        )}

        {/* Feature Tabs Navigation */}
        <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* TAB CONTENT PANES */}
        {activeTab === "overview" && (
          <OverviewTab locationName={currentLoc.name} onNavigateTab={setActiveTab} />
        )}

        {activeTab === "routine" && (
          <RoutinePlannerTab
            selectedActivity={selectedActivity}
            onSelectActivity={setSelectedActivity}
            routinePlan={routinePlan}
          />
        )}

        {activeTab === "indoor" && (
          <IndoorGuideTab
            roomArea={roomArea}
            onRoomAreaChange={setRoomArea}
            ceilingHeight={ceilingHeight}
            onCeilingHeightChange={setCeilingHeight}
            cadrCalc={cadrCalc}
            currentAqi={aqi}
          />
        )}

        {activeTab === "impact" && (
          <ImpactCalculatorTab
            outdoorHours={outdoorHours}
            onOutdoorHoursChange={setOutdoorHours}
            maskType={maskType}
            onMaskTypeChange={setMaskType}
            hasPurifier={hasPurifier}
            onHasPurifierChange={setHasPurifier}
            impactCalc={impactCalc}
          />
        )}

        {activeTab === "community" && <CommunityModeTab flyerText={flyerText} />}

        {activeTab === "assistant" && (
          <GeminiAssistantTab
            persona={persona}
            locationName={currentLoc.name}
            aqi={aqi}
            category={category}
            pollutants={
              snapshot?.pollutants ?? {
                pm2_5: null,
                pm10: null,
                no2: null,
                so2: null,
                co: null,
                o3: null,
              }
            }
            apiKey={apiKey}
            tempKey={tempKey}
            onTempKeyChange={setTempKey}
            showPanel={showPanel}
            onTogglePanel={() => setShowPanel(!showPanel)}
            showKeyText={showKeyText}
            onToggleShowKeyText={() => setShowKeyText(!showKeyText)}
            keyNotice={keyNotice}
            onSaveKey={saveKey}
            onClearKey={clearKey}
            apiKeyInputId={apiKeyInputId}
          />
        )}
      </main>
    </>
  );
}
