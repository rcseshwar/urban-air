import type { PersonaId } from "./types";
import { PERSONAS } from "./recommendations";

export interface AssistantRequest {
  persona: PersonaId;
  locationName: string;
  aqi: number | null;
  category: string | null;
  pollutants: {
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    o3: number | null;
  };
  question: string;
  apiKey?: string;
}

export interface AssistantResponse {
  answer: string;
  source: "gemini" | "clinical_heuristic";
  disclaimer: string;
}

export async function askAirQualityAssistant(
  req: AssistantRequest,
  signal?: AbortSignal
): Promise<AssistantResponse> {
  const customKey = req.apiKey?.trim();
  const envKey = process.env.GEMINI_API_KEY?.trim();
  const apiKey = customKey || envKey;
  const personaInfo = PERSONAS[req.persona] ?? PERSONAS.parent;

  const systemContext = `You are Urban Air Assistant, a compassionate, evidence-based environmental health and air quality advisor.
Your current user persona is: ${personaInfo.label} (${personaInfo.role}).
Priority concerns for this persona: ${personaInfo.description}.
Current Location: ${req.locationName}
Current Air Quality: US EPA AQI ${req.aqi ?? "Unavailable"} (${req.category ?? "Unavailable"})
Measured/Modelled Pollutants:
- PM2.5: ${req.pollutants.pm2_5 ?? "N/A"} µg/m³
- PM10: ${req.pollutants.pm10 ?? "N/A"} µg/m³
- NO2: ${req.pollutants.no2 ?? "N/A"} µg/m³
- Ozone: ${req.pollutants.o3 ?? "N/A"} µg/m³

Guidance Rules:
1. Provide actionable, concise, empathetic, and scientifically sound advice.
2. Address specific vulnerabilities (children's lung development, senior cardiovascular risk, worker shifts, or community collective action).
3. Do not diagnose acute medical emergencies; always advise seeking emergency care for severe chest pain, blue lips, or sudden breathlessness.
4. Keep answers under 3 concise paragraphs or clear bullet points.`;

  let apiKeyErrorNote: string | null = null;

  if (apiKey && apiKey !== "your-key-here") {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
      const timeout = AbortSignal.timeout(9000);
      const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

      const body = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemContext}\n\nUser Question:\n"${req.question}"`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: combinedSignal,
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const keyType = customKey ? "your custom Gemini API key" : "configured Gemini AI";
          return {
            answer: candidate.trim(),
            source: "gemini",
            disclaimer: `Guidance powered by ${keyType}. For medical emergencies or acute symptoms, always consult a healthcare professional.`,
          };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || `Status ${res.status}`;
        if (customKey) {
          apiKeyErrorNote = `Custom API Key notice: Google returned "${msg}". Temporarily falling back to clinical engine.`;
        }
      }
    } catch {
      if (customKey) {
        apiKeyErrorNote = "Custom API Key notice: Connection to Google Gemini API timed out or failed. Falling back to clinical engine.";
      }
    }
  }

  // Clinical Heuristic Fallback
  const fallbackDisclaimer = apiKeyErrorNote
    ? `${apiKeyErrorNote} Guidance synthesized from WHO & US EPA clinical air quality advisories.`
    : "Guidance synthesized from WHO & US EPA clinical air quality advisories. Always seek immediate emergency medical care for acute respiratory or cardiovascular distress.";

  return {
    answer: generateHeuristicAdvice(req),
    source: "clinical_heuristic",
    disclaimer: fallbackDisclaimer,
  };
}

function generateHeuristicAdvice(req: AssistantRequest): string {
  const q = req.question.toLowerCase();
  const aqi = req.aqi ?? 85;
  const persona = req.persona;

  // Mask / respirator inquiries
  if (q.includes("mask") || q.includes("n95") || q.includes("respirator") || q.includes("cloth")) {
    if (aqi <= 50) {
      return `At an AQI of ${aqi} (Good), particulate masks are unnecessary for general protection. If you have extreme pollen allergies, a standard surgical or dust mask can filter larger coarse pollens.`;
    }
    return `At current AQI ${aqi} (${req.category ?? "Moderate to Unhealthy"}), cloth and standard surgical masks provide limited protection against PM2.5 because fine particles pass around the loose edges.

Recommendations for your role (${PERSONAS[persona].label}):
• Choose a certified N95, KN95, or FFP2 respirator with headbands or tight adjustable earloops.
• Ensure an airtight seal around the nose bridge and chin. Facial hair degrades the vacuum seal.
• For children, use specifically certified pediatric KN95/KF94 masks rather than loose adult sizes.`;
  }

  // Exercise / Jogging / Running / Walking outside
  if (q.includes("run") || q.includes("jog") || q.includes("exercise") || q.includes("walk") || q.includes("outside") || q.includes("play")) {
    if (aqi <= 50) {
      return `Current AQI in ${req.locationName} is ${aqi} (Good). Outdoor exercise, running, and children's park activities are completely safe and strongly encouraged today!`;
    }
    if (aqi <= 100) {
      return `Current AQI in ${req.locationName} is ${aqi} (Moderate). Most people can exercise outdoors safely. However, for ${PERSONAS[persona].label}, heavy aerobic endurance workouts should avoid peak traffic corridors where localized diesel exhaust is highest.`;
    }
    if (aqi <= 150) {
      return `Current AQI in ${req.locationName} is ${aqi} (Unhealthy for Sensitive Groups).
• Intense cardiovascular workouts (running, cycling) force deep lung deposition of PM2.5.
• Shift workouts indoors or replace them with low-intensity stretching.
• For young children and seniors: restrict outdoor playground activities to under 20-30 minutes.`;
    }
    return `Current AQI in ${req.locationName} is ${aqi} (${req.category ?? "Unhealthy to Hazardous"}).
• All strenuous outdoor exercise should be cancelled or moved indoors.
• Heavy breathing at this pollution level draws fine particulate matter directly into lung alveoli and systemic circulation.
• Stay indoors with continuous air filtration.`;
  }

  // Purifiers / Indoor / Windows / Ventilation
  if (q.includes("purifier") || q.includes("window") || q.includes("indoor") || q.includes("hepa") || q.includes("filter")) {
    if (aqi <= 50) {
      return `Air quality is Good (${aqi}). You can open windows for natural cross-ventilation to flush out indoor CO2, VOCs, and moisture. Purifiers can remain on low or auto mode.`;
    }
    return `Managing indoor air at AQI ${aqi}:
1. Windows: Keep external windows and balcony doors shut to prevent outdoor particulate ingress.
2. Purifier: Run a True HEPA (H13) air purifier continuously in bedrooms and main occupied rooms. Ensure the Clean Air Delivery Rate (CADR) matches your room volume.
3. Indoor sources: Avoid burning incense, candles, or frying foods without active kitchen range hood exhaust. Use damp cloths rather than dry brooms to dust surfaces.`;
  }

  // Default contextual advice tailored to persona and AQI
  if (persona === "parent") {
    return `Advice for Parents in ${req.locationName} (AQI ${aqi}):
• Children inhale approximately 50% more air per pound of body weight than adults, and stroller height is directly in the zone of motor vehicle tailpipe exhaust.
• ${aqi > 100 ? "Avoid outdoor strolls along main arterial roads. Keep indoor play spaces filtered with a HEPA air cleaner." : "Air quality is manageable. Keep walks in green spaces away from congested intersections."}
• If your child displays coughing, wheezing, or unusually rapid breathing, move indoors immediately and consult your pediatrician.`;
  }

  if (persona === "elderly") {
    return `Cardiovascular & Respiratory Guidance in ${req.locationName} (AQI ${aqi}):
• Fine particulate matter triggers systemic vascular inflammation, arterial stiffness, and blood pressure elevation in seniors.
• ${aqi > 100 ? "Remain indoors in air-filtered spaces today. Take cardiovascular and inhaler medications consistently." : "Moderate conditions: gentle outdoor walking is fine, but avoid cold morning smog hours."}
• Seek prompt medical evaluation if experiencing chest pressure, irregular heartbeat, or acute breathlessness.`;
  }

  if (persona === "worker") {
    return `Occupational Shift Advice in ${req.locationName} (AQI ${aqi}):
• An 8-hour shift involving physical exertion multiplies cumulative particulate exposure by 3x to 5x.
• ${aqi > 100 ? "Mandatory N95/FFP2 respirator with tight facial seal. Take hydration and recovery breaks in sealed, air-filtered break rooms or vehicle cabs." : "Maintain hydration and keep vehicle cabin air on recirculation mode."}
• Avoid idling heavy machinery right near where workers take meal breaks.`;
  }

  return `Community Action Guidance for ${req.locationName} (AQI ${aqi} - ${req.category ?? "Current"}):
• Community vulnerability: ${aqi > 100 ? "Alert neighborhood preschools, sports leagues, and senior centers to curtail outdoor programs." : "Air quality is acceptable; good window to inspect community ventilation and filter stockpiles."}
• Check on solitary elderly neighbors and street vendors who lack indoor air purification.
• Share verified AQI updates and promote public transit to curb peak urban emissions.`;
}
