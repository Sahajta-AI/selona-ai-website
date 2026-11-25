import type { Page } from "@playwright/test";

// Same routes and reading method as scripts/editor/capture.mjs, which made the baseline.
export const routes: [string, string][] = [
  ["/", "home"], ["/pricing", "pricing"], ["/contact", "contact"], ["/security", "security"],
  ["/privacy", "privacy"], ["/apply-now", "apply-now"], ["/definitely-missing", "404"],
];

export async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
}

export async function readPage(page: Page) {
  return page.evaluate(() => ({
    title: document.title,
    description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? "",
    text: document.body.innerText,
  }));
}
