import type { AqiCategory } from "./aqi";
import type { HourlyDataPoint, PersonaId, PersonaInfo } from "./types";

export const PERSONAS: Record<PersonaId, PersonaInfo> = {
  parent: {
    id: "parent",
    label: "Parent of Young Children",
    role: "Child Health & Nursery Care",
    description: "Developing lungs breathe faster and take in more air per pound. Fine particles settle near ground level (stroller height).",
    priorityPollutant: "PM2.5 & Ozone",
    defaultAdvice: "Keep stroller covers ventilated, filter nursery air with true HEPA, and schedule playground play during early morning low-pollution windows.",
  },
  elderly: {
    id: "elderly",
    label: "Elderly-Care Household",
    role: "Cardiovascular & Respiratory Defense",
    description: "Seniors are disproportionately vulnerable to systemic inflammation, stroke triggers, and COPD/asthma flare-ups caused by fine particulates.",
    priorityPollutant: "PM2.5 & NO2",
    defaultAdvice: "Ensure pulse oximeter and inhaler access, maintain indoor air below 12 µg/m³, and avoid unventilated gas stoves.",
  },
  worker: {
    id: "worker",
    label: "Outdoor Worker / Commuter",
    role: "Occupational Exposure & Transit",
    description: "8+ hours of continuous exertion along traffic corridors multiplies inhaled toxic load significantly.",
    priorityPollutant: "PM2.5, PM10 & CO",
    defaultAdvice: "Wear a well-fitted N95/FFP2 respirator with headstraps, plan break zones away from idling heavy vehicles, and hydrate regularly.",
  },
  community: {
    id: "community",
    label: "Community Organiser",
    role: "Neighborhood Alert & Collective Action",
    description: "Coordinating neighborhood alerts, vulnerable neighbor welfare checks, school recess bans, and community clean-air shelters.",
    priorityPollutant: "PM2.5 & Public Health AQI",
    defaultAdvice: "Broadcast air alerts, distribute masks to street sweepers/delivery couriers, and advocate for indoor school recess.",
  },
};

export interface PersonaRecommendation {
  status: "safe" | "caution" | "warning" | "danger";
  headline: string;
  actions: string[];
  maskAdvice: string;
  indoorAdvice: string;
}

export function getPersonaRecommendation(
  persona: PersonaId,
  aqi: number | null,
  category: AqiCategory | null
): PersonaRecommendation {
  if (aqi == null || category == null) {
    return {
      status: "caution",
      headline: "Air quality data is currently unavailable",
      actions: ["Check back shortly or refer to regional weather advisories."],
      maskAdvice: "Have a respirator handy if outdoor conditions look visibly hazy.",
      indoorAdvice: "Keep windows shut if you notice outdoor smoke or odor.",
    };
  }

  switch (persona) {
    case "parent":
      if (aqi <= 50) {
        return {
          status: "safe",
          headline: "Optimal air quality for children & outdoor play",
          actions: [
            "Ideal conditions for strollers, outdoor parks, and sports.",
            "Open windows for whole-house fresh air exchange.",
          ],
          maskAdvice: "No masks needed for children.",
          indoorAdvice: "Natural ventilation is safe and recommended today.",
        };
      }
      if (aqi <= 100) {
        return {
          status: "caution",
          headline: "Moderate air: Safe for most kids, monitor sensitive infants",
          actions: [
            "Outdoor play is generally fine; limit intense aerobic training if child has asthma.",
            "Strollers stay close to ground level where traffic exhaust concentrates—walk on side streets.",
          ],
          maskAdvice: "Not needed unless child has doctor-diagnosed hyper-reactive airways.",
          indoorAdvice: "Run HEPA filter on low in children's bedrooms during naptime.",
        };
      }
      if (aqi <= 150) {
        return {
          status: "warning",
          headline: "Unhealthy for Sensitive Groups: Protect developing lungs",
          actions: [
            "Move intense outdoor playground sessions indoors or cut duration to under 30 minutes.",
            "Keep quick-relief bronchodilator / inhaler handy for asthmatic children.",
            "Advise daycare or school to avoid strenuous midday outdoor PE.",
          ],
          maskAdvice: "KF94 or pediatric KN95 recommended if child must be in outdoor traffic.",
          indoorAdvice: "Seal windows. Run nursery air purifier on medium/high (keep PM2.5 < 10 µg/m³).",
        };
      }
      return {
        status: "danger",
        headline: "Hazardous / High Alert: Keep children indoors",
        actions: [
          "Cancel all outdoor recess, sports practices, and playground trips.",
          "Keep kids indoors with sealed windows and doors.",
          "Watch for rapid breathing, coughing, or eye irritation.",
        ],
        maskAdvice: "Well-fitted certified pediatric mask if travel is unavoidable.",
        indoorAdvice: "Create a designated clean room with continuous HEPA filtration.",
      };

    case "elderly":
      if (aqi <= 50) {
        return {
          status: "safe",
          headline: "Excellent conditions for morning walks & gardening",
          actions: [
            "Great time for seniors to enjoy outdoor walks and exercise.",
            "Fresh air helps clear indoor respiratory irritants.",
          ],
          maskAdvice: "No mask required.",
          indoorAdvice: "Aerate living spaces thoroughly.",
        };
      }
      if (aqi <= 100) {
        return {
          status: "caution",
          headline: "Acceptable, but monitor for tightness or fatigue",
          actions: [
            "Prefer walking in green parks rather than busy traffic avenues.",
            "Maintain regular cardiovascular medication schedule.",
          ],
          maskAdvice: "Consider a light comfortable mask along busy roadways.",
          indoorAdvice: "Keep purifier running in main living areas.",
        };
      }
      if (aqi <= 150) {
        return {
          status: "warning",
          headline: "Elevated risk of cardiovascular & respiratory strain",
          actions: [
            "Avoid strenuous outdoor exertion or heavy lifting.",
            "Postpone early morning walks when temperature inversions trap smog.",
            "Check oxygen saturation if experiencing shortness of breath.",
          ],
          maskAdvice: "Wear N95/FFP2 with exhalation valve or gentle fit for necessary outings.",
          indoorAdvice: "Keep windows tightly shut. Run HEPA filtration 24/7.",
        };
      }
      return {
        status: "danger",
        headline: "Severe cardiovascular warning: Stay strictly indoors",
        actions: [
          "Do not go outdoors. Even brief exposure triggers arterial constriction.",
          "Keep emergency cardiac and respiratory contacts on speed dial.",
          "Avoid indoor pollutant generators (frying oil, incense, candles).",
        ],
        maskAdvice: "N95 mandatory if stepping outside for medical emergencies.",
        indoorAdvice: "Seal door thresholds and run purifiers at maximum CADR.",
      };

    case "worker":
      if (aqi <= 50) {
        return {
          status: "safe",
          headline: "Safe conditions for full outdoor work shifts",
          actions: [
            "Normal work pacing and outdoor duties can proceed unrestricted.",
            "Maintain standard hydration and sun protection.",
          ],
          maskAdvice: "No particulate respirator needed.",
          indoorAdvice: "Rest areas can be naturally ventilated.",
        };
      }
      if (aqi <= 100) {
        return {
          status: "caution",
          headline: "Moderate particulate load across full shifts",
          actions: [
            "Over an 8-hour shift, cumulative particulate intake is noticeable.",
            "Locate hydration breaks away from idling diesel engines and generators.",
          ],
          maskAdvice: "Optional N95 or KN95 for dust/exhaust-heavy corridors.",
          indoorAdvice: "Cab / van air recirculation enabled with fresh cabin filter.",
        };
      }
      if (aqi <= 150) {
        return {
          status: "warning",
          headline: "Heavy respiratory burden during physical labor",
          actions: [
            "Rotate outdoor physical tasks to reduce continuous heavy breathing hours.",
            "Take rest breaks inside filtered break trailers or buildings.",
            "Report wheezing or dizziness to shift supervisors.",
          ],
          maskAdvice: "Mandatory N95 / FFP2 respirator with tight seal against face.",
          indoorAdvice: "Vehicle windows closed with AC set to internal recirculation.",
        };
      }
      return {
        status: "danger",
        headline: "Hazardous occupational hazard: Restrict non-essential labor",
        actions: [
          "Halt non-emergency outdoor heavy labor or provide high-efficiency PPE.",
          "Establish pressurized clean-air break shelters.",
          "Frequent mandatory indoor recovery intervals.",
        ],
        maskAdvice: "Certified N95/FFP3 with tight seal check before every shift.",
        indoorAdvice: "Ensure job-site indoor offices have high-volume HEPA units running.",
      };

    case "community":
      if (aqi <= 50) {
        return {
          status: "safe",
          headline: "Community clean air: Great day for neighborhood events",
          actions: [
            "Host outdoor community sports, markets, and public cleanups.",
            "Encourage walking and cycling for clean transit.",
          ],
          maskAdvice: "No masks needed.",
          indoorAdvice: "Standard ventilation in community centers and schools.",
        };
      }
      if (aqi <= 100) {
        return {
          status: "caution",
          headline: "Moderate: Prepare communication channels for vulnerable neighbors",
          actions: [
            "Monitor hourly trend for afternoon or evening inversions.",
            "Encourage carpooling and public transit to curb local emissions.",
          ],
          maskAdvice: "Prepare stockpile of masks for outreach workers.",
          indoorAdvice: "Inspect school and community hall HVAC filters.",
        };
      }
      if (aqi <= 150) {
        return {
          status: "warning",
          headline: "Community Alert: Trigger school recess & elder safeguards",
          actions: [
            "Advise local preschools and schools to restrict outdoor sports.",
            "Send WhatsApp/SMS community bulletin regarding safe windows.",
            "Check on elderly neighbors living alone without AC/purifiers.",
          ],
          maskAdvice: "Distribute free masks to street vendors and sanitization staff.",
          indoorAdvice: "Designate local libraries or halls as public clean-air shelters.",
        };
      }
      return {
        status: "danger",
        headline: "Emergency Alert: Full community clean air mobilization",
        actions: [
          "Issue urgent neighborhood health bulletin across all local channels.",
          "Suspend outdoor public gatherings, municipal open-air markets, and sports.",
          "Mobilize mutual aid to deliver groceries to vulnerable households.",
        ],
        maskAdvice: "Urgent mask distribution drive for all exposed residents.",
        indoorAdvice: "Open public air-conditioned clean air respite centers.",
      };
  }
}

// ROUTINE PLANNER LOGIC
export type ActivityType = "running" | "school_commute" | "dog_walk" | "outdoor_work" | "evening_errands";

export interface ActivityOption {
  id: ActivityType;
  title: string;
  icon: string;
  description: string;
  durationMin: number;
}

export const ACTIVITIES: ActivityOption[] = [
  { id: "running", title: "Jogging & Cardio", icon: "🏃", description: "High respiratory rate multiplies particle deposition deep into alveoli.", durationMin: 45 },
  { id: "school_commute", title: "School Walk / Drop-off", icon: "🎒", description: "Young lungs walking roadside during morning exhaust rush hour.", durationMin: 30 },
  { id: "dog_walk", title: "Dog Walking", icon: "🐕", description: "Low-intensity stroll but prolonged exposure.", durationMin: 25 },
  { id: "outdoor_work", title: "Outdoor Work Shift", icon: "🔨", description: "Prolonged multi-hour exposure with physical exertion.", durationMin: 240 },
  { id: "evening_errands", title: "Evening Errands", icon: "🛒", description: "Navigating evening traffic, commercial hubs, and roadside food vendors.", durationMin: 40 },
];

export interface SafeWindowResult {
  bestTime: string;
  bestAqi: number;
  rating: "Optimal" | "Acceptable" | "Risky" | "Avoid";
  summary: string;
  hourlyEvaluations: Array<{
    time: string;
    hourLabel: string;
    aqi: number;
    rating: "Optimal" | "Acceptable" | "Risky" | "Avoid";
  }>;
}

export function evaluateRoutine(
  activity: ActivityType,
  hourly: HourlyDataPoint[] | undefined,
  currentAqi: number | null
): SafeWindowResult {
  const fallbackAqi = currentAqi ?? 75;

  if (!hourly || hourly.length === 0) {
    const r = fallbackAqi <= 50 ? "Optimal" : fallbackAqi <= 100 ? "Acceptable" : fallbackAqi <= 150 ? "Risky" : "Avoid";
    return {
      bestTime: "Current Window",
      bestAqi: fallbackAqi,
      rating: r,
      summary: `Based on current AQI (${fallbackAqi}): ${r === "Optimal" ? "Safe to proceed." : r === "Acceptable" ? "Acceptable with caution." : "Consider postponing or using N95 protection."}`,
      hourlyEvaluations: [],
    };
  }

  const evaluations = hourly.slice(0, 18).map((pt) => {
    const a = pt.aqi ?? fallbackAqi;
    const date = new Date(pt.time);
    const hour = date.toLocaleTimeString([], { hour: "numeric", hour12: true });
    let rating: "Optimal" | "Acceptable" | "Risky" | "Avoid";
    if (a <= 50) rating = "Optimal";
    else if (a <= 100) rating = "Acceptable";
    else if (a <= 150) rating = "Risky";
    else rating = "Avoid";
    return { time: pt.time, hourLabel: hour, aqi: a, rating };
  });

  const sorted = [...evaluations].sort((a, b) => a.aqi - b.aqi);
  const best = sorted[0] ?? { time: "Now", hourLabel: "Now", aqi: fallbackAqi, rating: "Acceptable" as const };

  let summary = `Best window for ${activity.replace("_", " ")} is around ${best.hourLabel} with expected AQI of ~${best.aqi}.`;
  if (best.rating === "Avoid") {
    summary = `Caution: Air quality remains high throughout the forecast window (best is still AQI ${best.aqi} at ${best.hourLabel}). Wear an N95 mask or shift indoors.`;
  }

  return {
    bestTime: best.hourLabel,
    bestAqi: best.aqi,
    rating: best.rating,
    summary,
    hourlyEvaluations: evaluations,
  };
}

// INDOOR GUIDE LOGIC
export function calculateCadr(roomAreaSqFt: number, ceilingHeightFt = 8): {
  targetCfm: number;
  targetM3h: number;
  recommendation: string;
} {
  const area = Math.max(50, Math.min(3000, roomAreaSqFt));
  const volume = area * Math.max(7, Math.min(15, ceilingHeightFt));
  // 5 Air Changes per Hour (ACH) is the gold standard for clean rooms in wildfire / smog conditions
  // CADR (CFM) = (Room Volume in cu ft * ACH) / 60
  const targetCfm = Math.round((volume * 5) / 60);
  const targetM3h = Math.round(targetCfm * 1.699);

  let recommendation = `For a ${area} sq ft room, choose a purifier certified for at least ${targetCfm} Smoke CADR CFM (${targetM3h} m³/h).`;
  if (area > 500) {
    recommendation += " For spaces larger than 500 sq ft, two medium units in opposing corners circulate air far better than one oversized unit.";
  }
  return { targetCfm, targetM3h, recommendation };
}

// IMPACT CALCULATOR LOGIC
export interface ImpactCalculation {
  inhaledPm25Ug: number;
  baselineInhaledUg: number;
  protectionPercentage: number;
  cigaretteEquivalent: number;
  caveatNote: string;
}

export function calculatePersonalImpact(params: {
  outdoorAqi: number;
  outdoorHours: number;
  maskType: "none" | "cloth" | "surgical" | "n95";
  hasAirPurifier: boolean;
}): ImpactCalculation {
  // Approximate PM2.5 in µg/m3 from US AQI (simplified piecewise EPA model)
  const aqi = Math.max(1, params.outdoorAqi);
  let outdoorPm25 = (aqi * 35.4) / 100;
  if (aqi > 100) outdoorPm25 = 35.5 + ((aqi - 101) * (55.4 - 35.5)) / 49;
  if (aqi > 150) outdoorPm25 = 55.5 + ((aqi - 151) * (150.4 - 55.5)) / 49;
  if (aqi > 200) outdoorPm25 = 150.5 + ((aqi - 201) * (250.4 - 150.5)) / 99;

  // Mask filtration efficiency (real-world fit considered)
  const maskEfficiency = {
    none: 0.0,
    cloth: 0.25,
    surgical: 0.45,
    n95: 0.92,
  }[params.maskType];

  const outdoorHours = Math.max(0, Math.min(24, params.outdoorHours));
  const indoorHours = 24 - outdoorHours;

  // Indoor PM2.5 ratio: ~0.7 without purifier (leaky homes), ~0.15 with true HEPA
  const indoorPm25 = params.hasAirPurifier ? outdoorPm25 * 0.15 : outdoorPm25 * 0.65;

  // Normal human tidal volume: ~0.6 m3 air inhaled per hour resting, ~1.2 m3 exercising/working
  const hourlyBreathingM3 = 0.75;

  // Actual inhaled mass
  const outdoorInhaled = outdoorHours * hourlyBreathingM3 * (outdoorPm25 * (1 - maskEfficiency));
  const indoorInhaled = indoorHours * hourlyBreathingM3 * indoorPm25;
  const actualInhaled = outdoorInhaled + indoorInhaled;

  // Baseline without any intervention (no mask, no purifier, 65% indoor infiltration)
  const baselineInhaled = (outdoorHours * outdoorPm25 + indoorHours * (outdoorPm25 * 0.65)) * hourlyBreathingM3;

  const reduction = Math.max(0, Math.round(((baselineInhaled - actualInhaled) / Math.max(1, baselineInhaled)) * 100));

  // Epidemiological cigarette equivalent (Berkeley Earth approx: ~22 µg/m3 PM2.5 inhaled per 24 hours ≈ 1 cigarette equivalent)
  // Total 24h intake benchmark: ~22 µg/m3 * (18 m3 inhaled/day) ≈ 396 µg PM2.5 per cigarette
  const cigs = Number((actualInhaled / 396).toFixed(1));

  return {
    inhaledPm25Ug: Math.round(actualInhaled),
    baselineInhaledUg: Math.round(baselineInhaled),
    protectionPercentage: reduction,
    cigaretteEquivalent: Math.max(0, cigs),
    caveatNote: "Comparison based on Berkeley Earth respiratory burden metric. Note that cigarette smoke contains additional volatile carcinogens; this metric illustrates fine particulate lung burden.",
  };
}

// COMMUNITY ALERT FLYER GENERATOR
export function generateCommunityFlyer(params: {
  locationName: string;
  aqi: number;
  category: AqiCategory;
  dateStr: string;
}): string {
  return `=====================================================
🚨 COMMUNITY AIR QUALITY HEALTH ADVISORY 🚨
Location: ${params.locationName}
Date: ${params.dateStr}
Current US EPA AQI: ${params.aqi} [${params.category.toUpperCase()}]
=====================================================

ATTENTION RESIDENTS & NEIGHBORHOOD GROUPS:
Our local air quality has reached the "${params.category}" threshold.
Fine particulate matter (PM2.5) penetrates deep into the bloodstream.

IMMEDIATE NEIGHBORHOOD ACTIONS:
1. SCHOOLS & DAYCARES:
   • Move outdoor sports and recess indoors.
   • Close exterior classroom doors and run classroom air purifiers.

2. VULNERABLE NEIGHBORS (SENIORS & ASTHMA SUFFERERS):
   • Check in on elderly neighbors living on ground floors or near highways.
   • Verify inhaler and medication access.

3. COMMUTERS & STREET WORKERS:
   • Wear well-fitted N95/FFP2 respirators along traffic routes.
   • Avoid burning trash, leaves, or running unessential diesel idling.

4. CLEAN AIR RESPITE:
   • Public buildings, community libraries, and transit concourses
     with central AC provide cleaner indoor air if your home is unsealed.

Shared via Urban Air Assistant — Science-backed Community Action
=====================================================`;
}
