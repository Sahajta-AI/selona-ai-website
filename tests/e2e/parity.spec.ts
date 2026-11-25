import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { routes, settle, readPage } from "./helpers";

// Proof 1: every page reads exactly like the baseline captured from 506e2ae,
// and looks the same at 1440px and 390px (small tolerance for pixel noise).
for (const [route, name] of routes) {
  test(`text parity: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "networkidle" });
    await settle(page);
    const baseline = JSON.parse(readFileSync(`docs/selona-editor/baseline/${name}.json`, "utf8"));
    expect(await readPage(page)).toEqual(baseline);
  });

  for (const width of [1440, 390]) {
    test(`look parity: ${name} @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(route, { waitUntil: "networkidle" });
      await settle(page);
      // the background loop pauses on a different frame each run; the baseline hides it the same way
      await page.addStyleTag({ content: "video{visibility:hidden!important}" });
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        timeout: 30_000,
      });
    });
  }
}
