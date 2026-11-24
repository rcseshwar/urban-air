import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Urban Air Accessibility Audit (WCAG 2.1 AA)", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the external provider API call
    await page.route("**/api/air-quality*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          location: { name: "Bengaluru", latitude: 12.97, longitude: 77.59 },
          provider: "Open-Meteo Air Quality API",
          standard: "US EPA AQI",
          kind: "modelled",
          measuredAt: "2026-11-22T06:00:00Z",
          fetchedAt: "2026-11-22T06:01:00Z",
          pollutants: { pm2_5: 35.0, pm10: 60.0, no2: 15.0, so2: 3.0, co: 0.5, o3: 25.0 },
          providerAqi: 99,
          calculatedAqi: 99,
          category: "Moderate",
          notes: ["Open-Meteo values are modelled (CAMS) estimates."],
          hourly: [
            { time: "2026-11-22T06:00", aqi: 99, pm2_5: 35.0, pm10: 60.0, category: "Moderate" },
          ],
        }),
      });
    });

    await page.goto("/");
  });

  test("passes automated axe-core accessibility checks with zero critical or serious violations", async ({ page }) => {
    // Wait for the hero card to be populated
    await page.waitForSelector(".hero-card");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(criticalOrSerious).toEqual([]);
  });

  test("verifies non-color visual symbols accompany all AQI categories", async ({ page }) => {
    const symbolElement = page.locator(".non-color-symbol");
    await expect(symbolElement).toBeVisible();
    const symbolText = await symbolElement.textContent();
    expect(symbolText?.trim().length).toBeGreaterThan(0);
  });

  test("verifies accessible keyboard navigation for tabs", async ({ page }) => {
    const overviewTab = page.locator("#tab-overview");
    const routineTab = page.locator("#tab-routine");

    await overviewTab.focus();
    await expect(overviewTab).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(routineTab).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#tabpanel-routine")).toBeVisible();
  });
});
