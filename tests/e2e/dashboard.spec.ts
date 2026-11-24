import { test, expect } from "@playwright/test";

test.describe("Urban Air Dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the external provider API call for deterministic tests
    await page.route("**/api/air-quality*", async (route) => {
      const url = new URL(route.request().url());
      const reqName = url.searchParams.get("name") ?? "Bengaluru";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          location: { name: reqName, admin: "Karnataka", country: "India", latitude: 12.97, longitude: 77.59 },
          provider: "Open-Meteo Air Quality API",
          standard: "US EPA AQI",
          kind: "modelled",
          measuredAt: "2026-11-22T06:00:00Z",
          fetchedAt: "2026-11-22T06:01:00Z",
          pollutants: { pm2_5: 38.5, pm10: 65, no2: 18.2, so2: 4.1, co: 0.6, o3: 28 },
          providerAqi: 108,
          calculatedAqi: 108,
          category: "Unhealthy for sensitive groups",
          notes: ["Open-Meteo values are modelled (CAMS) estimates, not readings from a nearby monitoring station."],
          hourly: [
            { time: "2026-11-22T06:00", aqi: 108, pm2_5: 38.5, pm10: 65, category: "Unhealthy for sensitive groups" },
            { time: "2026-11-22T07:00", aqi: 85, pm2_5: 28, pm10: 50, category: "Moderate" },
            { time: "2026-11-22T08:00", aqi: 45, pm2_5: 10, pm10: 20, category: "Good" },
          ],
        }),
      });
    });

    await page.goto("/");
  });

  test("renders main brand header, skip link, and hero AQI metrics", async ({ page }) => {
    await expect(page.locator("h1.brand-title")).toHaveText("Urban Air");
    await expect(page.locator("a.skip-link")).toBeAttached();

    // Verify Hero card loaded with mocked AQI
    await expect(page.locator(".location-title")).toContainText("Bengaluru");
    await expect(page.locator(".aqi-number")).toHaveText("108");
    await expect(page.locator(".category-badge-lg")).toContainText("Unhealthy for sensitive groups");
    await expect(page.locator(".non-color-symbol")).toHaveText("▲");
    await expect(page.locator(".data-honesty-pill")).toContainText("modelled");
  });

  test("allows switching personas and updates tailored advice banner", async ({ page }) => {
    const select = page.locator(".persona-select");
    await expect(select).toHaveValue("parent");
    await expect(page.locator(".persona-advice-banner")).toContainText("Parent of Young Children");

    // Switch to Elderly Care
    await select.selectOption("elderly");
    await expect(page.locator(".persona-advice-banner")).toContainText("Elderly-Care Household");
    await expect(page.locator(".persona-advice-banner")).toContainText(/cardiovascular/i);

    // Switch to Outdoor Worker
    await select.selectOption("worker");
    await expect(page.locator(".persona-advice-banner")).toContainText("Outdoor Worker");
    await expect(page.locator(".persona-advice-banner")).toContainText("respirator");
  });

  test("navigates through all feature tabs smoothly", async ({ page }) => {
    // 1. Routine Planner
    await page.click("#tab-routine");
    await expect(page.locator("#tabpanel-routine")).toBeVisible();
    await expect(page.locator(".best-window-callout")).toContainText("Recommended Window");

    // Click activity button
    await page.click("button:has-text('Dog Walking')");
    await expect(page.locator("button:has-text('Dog Walking')")).toHaveClass(/selected/);

    // 2. Indoor Guide
    await page.click("#tab-indoor");
    await expect(page.locator("#tabpanel-indoor")).toBeVisible();
    await expect(page.locator("#tabpanel-indoor")).toContainText("HEPA Purifier CADR Sizing");

    // 3. Impact Calculator
    await page.click("#tab-impact");
    await expect(page.locator("#tabpanel-impact")).toBeVisible();
    await expect(page.locator(".metric-val-lg").first()).toBeVisible();

    // 4. Community Mode
    await page.click("#tab-community");
    await expect(page.locator("#tabpanel-community")).toBeVisible();
    await expect(page.locator(".flyer-textarea")).toContainText("COMMUNITY AIR QUALITY HEALTH ADVISORY");

    // 5. Gemini Assistant
    await page.click("#tab-assistant");
    await expect(page.locator("#tabpanel-assistant")).toBeVisible();
    await expect(page.locator(".quick-prompts")).toBeVisible();

    // Click quick prompt chip
    await page.click("button.prompt-chip:has-text('Is it safe to go for a run right now?')");
    await expect(page.locator(".chat-response-card")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".chat-source-badge")).toBeVisible();
  });

  test("handles geolocation button click gracefully", async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 13.0827, longitude: 80.2707 });

    await page.click(".geo-btn:has-text('Use My Location')");
    // Verify location title updates to Current Location
    await expect(page.locator(".location-title")).toContainText("Current Location");
  });

  test("allows entering, saving, and clearing a custom Gemini API key through the frontend", async ({ page }) => {
    // Click header key button
    await page.click("button.header-key-btn");
    await expect(page.locator("#tabpanel-assistant")).toBeVisible();
    await expect(page.locator(".api-key-panel")).toBeVisible();

    // Fill in API key
    const keyInput = page.locator(".api-key-input");
    await keyInput.fill("AIzaSyDummyKeyForTesting12345");

    // Save key
    await page.click("button:has-text('Save Key')");
    await expect(page.locator(".api-key-badge")).toContainText("Custom Key Active");
    await expect(page.locator(".header-key-btn")).toContainText("API Key Configured");

    // Clear key
    await page.click("button:has-text('Clear')");
    await expect(page.locator(".api-key-badge")).toContainText("Default / Heuristic Mode");
  });
});
