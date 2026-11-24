# Urban Air – Architecture (Phases 1–4)

## Personas
- **Parent of young children:** Focus on developing lungs, stroller-height tailpipe exhaust, school/playground safety, and nursery HEPA filtration.
- **Elderly-care household:** Focus on cardiovascular risk, blood pressure, COPD/asthma exacerbation, and morning smog temperature inversions.
- **Outdoor worker / commuter:** Focus on 8+ hour cumulative exposure, high-exertion alveolar intake, N95/FFP2 seal integrity, and vehicle air recirculation.
- **Community organiser:** Focus on collective alert dissemination, vulnerable neighbor check-ins, school recess policies, and public clean-air shelters.

## Core Features (Built)

### 1. Dashboard UI & Geolocation
- Modern, accessible, high-contrast dashboard with live EPA AQI numbers, category badges, non-color visual symbols (`✓`, `•`, `▲`, `⚠`, `⛔`, `☠`), and data honesty indicators (`modelled` CAMS vs `measured`).
- Browser Geolocation API ("📍 Use My Location") with high-accuracy coordinates and user feedback.
- Debounced location search dropdown querying `/api/search`.
- Pollutant breakdown grid (PM2.5, PM10, NO2, O3, SO2, CO) with units and sub-indices.
- Discrepancy flagging for provider vs computed AQI variance (>10 points).

### 2. Routine Planner
- 18-hour hourly AQI forecast timeline.
- Multi-activity evaluation (Jogging & Cardio, School Walk / Drop-off, Dog Walking, Outdoor Work Shift, Evening Errands).
- Identifies optimal exposure windows and outputs categorized risk ratings ("Optimal", "Acceptable", "Risky", "Avoid").

### 3. Indoor Air Engineering Guide
- Interactive HEPA Clean Air Delivery Rate (CADR) calculator computing CFM and m³/h based on room area and ceiling height for 5 Air Changes per Hour (ACH).
- Dynamic natural ventilation advisor (open vs shut windows based on current AQI).
- Indoor particulate mitigation checklist (cooking exhaust, eliminating unvented combustion, damp wiping).

### 4. Health Impact Calculator
- Personal inhaled PM2.5 dose simulation based on daily outdoor hours, respiratory protection (None, Cloth, Surgical, N95/FFP2), and home HEPA filtration.
- Epidemiological cigarette particle equivalence metric (Berkeley Earth ~22 µg/m³ 24h intake baseline) with transparent scientific caveat notes.
- Inhaled harm reduction percentage vs unprotected baseline.

### 5. Community Mode
- Formatted neighborhood health advisory flyer generator ready for noticeboard printing or WhatsApp/SMS dissemination.
- Vulnerable neighbor welfare check protocol and school recess safety guidelines.

### 6. Gemini Environmental Health Assistant
- Server-side route `/api/assistant` powered by Gemini 1.5 Flash (`GEMINI_API_KEY` or user-configured key).
- **Frontend Key Configuration**: Users can enter, inspect (show/hide), and save their personal Gemini API key directly via the UI; keys persist client-side in `localStorage` and override or supplement server keys.
- Persona-tailored prompt engineering with evidence-based WHO and EPA air quality guidelines.
- Resilient clinical heuristic fallback engine ensuring 100% availability even without an external API key or during network disruptions.

### 7. Security & Rate Limiting
- Token-bucket / sliding-window in-memory rate limiting (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`, HTTP 429).
- Defense-in-depth Next.js middleware enforcing:
  - Strict Content-Security-Policy (CSP) headers.
  - `X-Frame-Options: DENY`.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: geolocation=(self)`.

### 8. Testing & Quality Assurance
- **Vitest:** 34 unit and integration tests covering AQI computation, Open-Meteo provider caching, persona advice, routine planner, impact calculator, assistant heuristics, and API rate limits.
- **Playwright E2E:** 7 automated browser tests covering brand header, persona switching, tab navigation, geolocation, and mock API integration.
- **Accessibility (a11y):** Automated `@axe-core/playwright` WCAG 2.1 AA audits confirming zero critical or serious accessibility violations, keyboard tab navigation, and non-color category indicators.

### 9. Containerization
- Multi-stage production `Dockerfile` with minimal `node:22-alpine` runner, non-root user `nextjs`, and standalone build output.
- `docker-compose.yml` for single-command deployment.
