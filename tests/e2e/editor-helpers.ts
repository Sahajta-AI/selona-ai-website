import { expect, type Page } from "@playwright/test";

// Every editor API route; each must answer 401 without a sign-in.
export const EDITOR_API_ROUTES: [string, string][] = [
  ["GET", "/api/editor/enter?path=/"],
  ["GET", "/api/editor/state"],
  ["POST", "/api/editor/draft"],
  ["POST", "/api/editor/publish"],
  ["GET", "/api/editor/versions"],
  ["POST", "/api/editor/restore"],
  ["POST", "/api/editor/archive"],
  ["POST", "/api/editor/bring-back"],
  ["POST", "/api/editor/upload"],
];

export async function signIn(page: Page, which: 1 | 2 = 1) {
  const email = which === 1 ? process.env.E2E_EMAIL : process.env.E2E_EMAIL_2;
  const key = which === 1 ? process.env.E2E_KEY : process.env.E2E_KEY_2;
  if (!email || !key) throw new Error("Set E2E_EMAIL/E2E_KEY (see .env.e2e.local)");
  await page.goto("/editor/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Access key").fill(key);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/sign-in/);
}

export const ORIGINAL = "Original site, before the editor (25 Nov 2026)";

/** Signed-in API calls from the test (same cookies as the page). */
export async function editorApi(page: Page, path: string, body?: object) {
  const res = body
    ? await page.request.post(path, { data: body })
    : await page.request.get(path);
  return { status: res.status(), json: await res.json().catch(() => ({})) };
}

/** Puts the original site back live (the same one-step action the editor offers). */
export async function bringBackOriginal(page: Page) {
  const state = await editorApi(page, "/api/editor/state");
  const { json } = await editorApi(page, "/api/editor/versions");
  const original = json.archives.find((a: { name: string }) => a.name === ORIGINAL);
  const r = await editorApi(page, "/api/editor/bring-back", { id: original.id, liveId: state.json.liveId, force: true });
  expect(r.status).toBe(200);
  return r.json.liveId as string;
}

/** The public page as a visitor sees it (a fresh browser with no editor cookies). */
export async function visitorText(page: Page, path: string, liveId?: string) {
  const ctx = await page.context().browser()!.newContext();
  const p = await ctx.newPage();
  for (let i = 0; i < 20; i++) {
    await p.goto(`${path}${path.includes("?") ? "&" : "?"}v=${Date.now()}`, { waitUntil: "domcontentloaded" });
    const version = await p.locator('meta[name="content-version"]').getAttribute("content");
    if (!liveId || version === liveId) break;
    await p.waitForTimeout(1000);
  }
  const text = await p.evaluate(() => document.body.innerText);
  const html = await p.content();
  await ctx.close();
  return { text, html };
}

/** Edit one piece of text in the editor's frame by clicking it and typing. */
export async function editText(page: Page, current: string, next: string) {
  const frame = page.frameLocator("iframe");
  const el = frame.locator("[data-ck]", { hasText: current }).first();
  await el.scrollIntoViewIfNeeded();
  await el.click();
  await expect(el).toHaveAttribute("contenteditable", "plaintext-only");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(next);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText(/Saved as a draft/, { timeout: 15_000 });
}

export async function publishAndWait(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Live now ✓", { timeout: 60_000 });
}

export async function openEditor(page: Page, path = "/") {
  await page.goto(`/editor?path=${encodeURIComponent(path)}`);
  await expect(page.frameLocator("iframe").locator("[data-ck]").first()).toBeVisible({ timeout: 30_000 });
}
