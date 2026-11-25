// Captures visible text, title, meta description and full-page screenshots of every route.
// Usage: BASE_URL=http://localhost:3311 OUT_DIR=docs/selona-editor/baseline node scripts/editor/capture.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';

const base = process.env.BASE_URL || 'http://localhost:3311';
const outDir = process.env.OUT_DIR || 'docs/selona-editor/baseline';
export const routes = [
  ['/', 'home'], ['/pricing', 'pricing'], ['/contact', 'contact'], ['/security', 'security'],
  ['/privacy', 'privacy'], ['/apply-now', 'apply-now'], ['/definitely-missing', '404'],
];

export async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
}

export async function readPage(page) {
  return page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content ?? '',
    text: document.body.innerText,
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(outDir, { recursive: true });
  // shortcut: pinned playwright differs from the preinstalled browser; PW_CHROME overrides the path
  const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
  for (const [width, tag] of [[1440, '1440'], [390, '390']]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [route, name] of routes) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await settle(page);
      if (tag === '1440') writeFileSync(`${outDir}/${name}.json`, JSON.stringify(await readPage(page), null, 2) + '\n');
      await page.screenshot({ path: `${outDir}/${name}-${tag}.png`, fullPage: true });
      console.log(`captured ${name} @${tag}`);
    }
    await page.close();
  }
  await browser.close();
}
