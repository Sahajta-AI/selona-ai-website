import { test, expect } from "@playwright/test";
import { getAt, setAt, type Json } from "@/lib/content/paths";
import { bringBackOriginal, editorApi, signIn } from "./editor-helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await bringBackOriginal(page);
});

test("History comes 20 at a time, and 'Show older' loads the rest", async ({ page }) => {
  // enough versions for two pages (each bring-back is a new version)
  let first = (await editorApi(page, "/api/editor/versions")).json;
  for (let i = 0; !first.publishedNext && i < 21; i++) {
    await bringBackOriginal(page);
    first = (await editorApi(page, "/api/editor/versions")).json;
  }
  expect(first.published).toHaveLength(20);
  const older = (await editorApi(page, `/api/editor/versions?folder=published&cursor=${encodeURIComponent(first.publishedNext)}`)).json;
  expect(older.items.length).toBeGreaterThan(0);
  const firstIds = new Set(first.published.map((v: { id: string }) => v.id));
  expect(older.items.some((v: { id: string }) => firstIds.has(v.id))).toBe(false);
  expect(older.items[0].at <= first.published[19].at).toBe(true);

  await page.goto("/editor");
  await page.getByRole("button", { name: "History" }).click();
  const items = page.locator("aside section > ul > li");
  await expect(items).toHaveCount(20, { timeout: 20_000 });
  await page.getByRole("button", { name: "Show older" }).click();
  await expect.poll(() => items.count(), { timeout: 20_000 }).toBeGreaterThan(20);
});

test("two saves at the same moment: one is kept, the other is told, nothing is lost unseen", async ({ page }) => {
  const state = (await editorApi(page, "/api/editor/state")).json;
  const save = (text: string) =>
    editorApi(page, "/api/editor/draft", { content: setAt(state.draft as Json, "home.hero.headline", text), draftId: state.draftId });
  const [a, b] = await Promise.all([save("Saved by A"), save("Saved by B")]);
  expect([a.status, b.status].sort()).toEqual([200, 409]);
  const winner = a.status === 200 ? { r: a, text: "Saved by A" } : { r: b, text: "Saved by B" };

  // the draft is the kept save, and its person carries on without a false warning
  const now = (await editorApi(page, "/api/editor/state")).json;
  expect(getAt(now.draft, "home.hero.headline")).toBe(winner.text);
  const next = await editorApi(page, "/api/editor/draft", { content: setAt(now.draft as Json, "pricing.heading", "Next change"), draftId: winner.r.json.draftId });
  expect(next.status).toBe(200);
  // and can publish what they saw
  const pub = await editorApi(page, "/api/editor/publish", { liveId: now.liveId, draftId: next.json.draftId });
  expect(pub.status).toBe(200);
});

test.afterAll(async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await signIn(page);
  await bringBackOriginal(page);
});
