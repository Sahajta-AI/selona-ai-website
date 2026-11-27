import { test, expect, type Page } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { bringBackOriginal, editorApi, signIn, visitorText } from "./editor-helpers";

// Claude can do everything the editor can (owner's decision, 27 Nov): change words,
// lists and pictures, show and undo changes, publish what the person previewed,
// undo a publish, save and bring back whole-site versions. Its review links sign
// the person in, and History shows what was done with Claude.

const PNG_1PX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function claude(baseURL: string) {
  const client = new Client({ name: "e2e-claude", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`/api/mcp/${process.env.E2E_CONNECTOR_TOKEN}`, baseURL)));
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const r = await client.callTool({ name, arguments: args });
    return { text: (r.content as { text: string }[])[0].text, error: Boolean(r.isError) };
  };
  return { call, close: () => client.close() };
}
const draftIdOf = (text: string) => text.match(/draft_id: (\S+)/)![1];
const linkOf = (text: string) => text.match(/https?:\/\/\S+\/editor\/open\?\S+/)![0];
const liveIdOf = async (page: Page) => (await editorApi(page, "/api/editor/state")).json.liveId as string;

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await bringBackOriginal(page);
});
test.afterAll(async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await signIn(page);
  await bringBackOriginal(page);
});

test("the preview link opens the changes in a browser that isn't signed in", async ({ browser, baseURL }) => {
  const c = await claude(baseURL!);
  const res = await c.call("change_text", { changes: [{ key: "pricing.tiers.0.cta", new_text: "Link test (via Claude)" }] });
  await c.close();
  expect(res.error).toBe(false);
  const link = linkOf(res.text);

  // a different browser, never signed in: the link goes straight to the review
  const fresh = await (await browser.newContext()).newPage();
  await fresh.goto(link);
  await expect(fresh).toHaveURL(/\/editor\?review=1&path=%2Fpricing/);
  await expect(fresh.locator('[data-change="pricing.tiers.0.cta"]')).toContainText("Link test (via Claude)");
  await expect(fresh.locator("[data-claude]").first()).toContainText("made with Claude");
  // it stays signed in afterwards (a 30-day session)
  const cookie = (await fresh.context().cookies()).find((k) => k.name === "selona_editor")!;
  expect(cookie.expires * 1000 - Date.now()).toBeGreaterThan(29 * 24 * 3600_000);
  await fresh.context().close();

  // a damaged or expired link asks to sign in, then goes to the same review
  const other = await (await browser.newContext()).newPage();
  await other.goto(link.replace(/t=[^&]+/, "t=forged.ticket"));
  await expect(other).toHaveURL(/\/editor\/sign-in\?e=link/);
  await expect(other.locator("main [role=alert]")).toContainText("expired");
  await other.getByLabel("Email").fill(process.env.E2E_EMAIL!);
  await other.getByLabel("Access key").fill(process.env.E2E_KEY!);
  await other.getByRole("button", { name: "Sign in" }).click();
  await expect(other).toHaveURL(/\/editor\?review=1&path=%2Fpricing/);
  await other.context().close();
});

test("Claude publishes only what the person previewed, and History says it was Claude", async ({ page, baseURL }) => {
  const c = await claude(baseURL!);
  const first = await c.call("change_text", { changes: [{ key: "pricing.tiers.0.cta", new_text: "Published by Claude" }] });
  const seen = draftIdOf(first.text);
  // nothing live until publish
  expect((await visitorText(page, "/pricing", await liveIdOf(page))).text).not.toContain("Published by Claude");

  // someone changes the draft after the person previewed it: publish refuses
  await c.call("change_text", { changes: [{ key: "pricing.heading", new_text: "Changed after the preview" }] });
  const refused = await c.call("publish", { draft_id: seen });
  expect(refused.error).toBe(true);
  expect(refused.text).toContain("Nothing was published");
  expect((await visitorText(page, "/pricing", await liveIdOf(page))).text).not.toContain("Published by Claude");

  // the person looks again and says publish: it goes live
  const changes = await c.call("show_changes");
  expect(changes.text).toContain("Changed after the preview");
  const ok = await c.call("publish", { draft_id: JSON.parse(changes.text).draft_id, note: "New pilot button" });
  expect(ok.error).toBe(false);
  expect(ok.text).toContain("Published 2 changes");
  const live = await liveIdOf(page);
  const visitor = (await visitorText(page, "/pricing", live)).text;
  expect(visitor).toContain("Published by Claude");
  expect(visitor).toContain("Changed after the preview");
  expect((await c.call("publish", { draft_id: "anything" })).text).toContain("nothing to publish");

  // History: in the connector and in the editor
  const history = JSON.parse((await c.call("show_history")).text);
  expect(history.published[0]).toMatchObject({ live_now: true, published_with_claude: true, note: "New pilot button" });
  await c.close();
  await page.goto("/editor");
  await page.getByRole("button", { name: "History" }).click();
  const top = page.locator("li", { hasText: "live now" }).first();
  await expect(top).toContainText("Done with Claude", { timeout: 20_000 });
  await expect(top).toContainText(process.env.E2E_EMAIL!);
});

test("a change made with Claude but published in the editor is marked in History", async ({ page, baseURL }) => {
  const c = await claude(baseURL!);
  await c.call("change_text", { changes: [{ key: "pricing.tiers.0.cta", new_text: "Prepared by Claude" }] });
  await c.close();
  await page.goto("/editor?review=1&path=%2Fpricing");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Live now ✓", { timeout: 60_000 });
  await page.getByRole("button", { name: "History" }).click();
  // History is read from the store when the tab opens: allow for a slow first load on Vercel
  await expect(page.locator("li", { hasText: "live now" }).first()).toContainText("Includes changes made with Claude", { timeout: 20_000 });
});

test("Claude can change lists and pictures, and undo changes before they go live", async ({ page, baseURL }) => {
  const c = await claude(baseURL!);
  const home = JSON.parse((await c.call("read_page", { page: "home" })).text);
  const list = home.lists.find((l: { list: string }) => l.list === "home.useCases.items");
  expect(list.items).toBeGreaterThan(1);
  const picture = home.pictures_and_videos.find((p: { kind: string }) => p.kind === "picture");

  // a list item added, then moved to the top
  expect((await c.call("change_list", { list: "home.useCases.items", action: "add", index: 0, fields: { name: "Added by Claude" } })).error).toBe(false);
  await c.call("change_list", { list: "home.useCases.items", action: "move", index: 1, to: 0 });
  // a picture replaced (file bytes); unsafe addresses refused
  const pic = await c.call("replace_picture", { key: picture.key, image_base64: PNG_1PX });
  expect(pic.error).toBe(false);
  expect((await c.call("replace_picture", { key: picture.key, image_url: "https://localhost/x.png" })).text).toContain("can't be used");
  expect((await c.call("replace_picture", { key: picture.key, image_url: "http://example.com/x.png" })).text).toContain("https://");
  expect((await c.call("replace_picture", { key: picture.key, image_base64: Buffer.from("not a picture").toString("base64") })).error).toBe(true);
  // a text change, then undone on its own
  await c.call("change_text", { changes: [{ key: "home.hero.headline", new_text: "Undo me" }] });
  const undo = await c.call("undo_changes", { keys: ["home.hero.headline"] });
  expect(undo.text).toContain("Undid 1 change");

  const changes = JSON.parse((await c.call("show_changes")).text);
  expect(changes.changes.map((x: { key: string }) => x.key).sort()).toEqual(["home.useCases.items", picture.key].sort());
  await c.call("publish", { draft_id: changes.draft_id });
  const live = await liveIdOf(page);
  const { text } = await visitorText(page, "/", live);
  expect(text).toContain("Added by Claude");
  expect(text).not.toContain("Undo me");
  // the new picture is what's live now, and it can be fetched
  const state = (await editorApi(page, "/api/editor/state")).json;
  const livePicture = picture.key.split(".").reduce((o: Record<string, unknown>, k: string) => o[k] as Record<string, unknown>, state.live) as unknown as string;
  expect(livePicture).not.toBe(picture.address.replace(baseURL!, ""));
  expect((await page.request.get(livePicture)).headers()["content-type"]).toBe("image/png");

  // dropping every waiting change
  await c.call("change_text", { changes: [{ key: "home.hero.headline", new_text: "Drop me" }] });
  expect((await c.call("undo_changes")).text).toContain("Dropped every change");
  expect((await c.call("show_changes")).text).toContain("Nothing is waiting");
  await c.close();
});

test("Claude can save a version, bring it back, and undo the last publish", async ({ page, baseURL }) => {
  const c = await claude(baseURL!);
  const name = `Claude test ${Date.now()}`;
  expect((await c.call("save_version", { name })).text).toContain(name);

  // three changes go live
  const r = await c.call("change_text", {
    changes: [
      { key: "home.hero.headline", new_text: "One" },
      { key: "pricing.heading", new_text: "Two" },
      { key: "contact.heading", new_text: "Three" },
    ],
  });
  await c.call("publish", { draft_id: draftIdOf(r.text) });
  expect((await visitorText(page, "/", await liveIdOf(page))).text).toContain("One");

  // undo that publish: back to the saved state
  let history = JSON.parse((await c.call("show_history")).text);
  expect((await c.call("undo_last_publish", { id: "not-the-live-one" })).error).toBe(true);
  const undone = await c.call("undo_last_publish", { id: history.published[0].id });
  expect(undone.error).toBe(false);
  expect((await visitorText(page, "/", await liveIdOf(page))).text).not.toContain("One");

  // change again, then bring the saved version back in one step
  const r2 = await c.call("change_text", { changes: [{ key: "home.hero.headline", new_text: "Four" }] });
  await c.call("publish", { draft_id: draftIdOf(r2.text) });
  history = JSON.parse((await c.call("show_history")).text);
  const saved = history.saved_versions.find((v: { name: string }) => v.name === name);
  expect((await c.call("bring_back_version", { id: saved.id })).text).toContain("is back");
  const home = (await visitorText(page, "/", await liveIdOf(page))).text;
  expect(home).not.toContain("Four");
  expect(home).toContain("The control layer");
  await c.close();
});

test("Claude finds words read from a screenshot, even when they don't match exactly", async ({ baseURL }) => {
  const c = await claude(baseURL!);
  const exact = JSON.parse((await c.call("find_text", { phrase: "THE CONTROL LAYER\nstarting  with finance AI" })).text);
  expect(exact[0].key).toBe("home.hero.headline");
  const close = JSON.parse((await c.call("find_text", { phrase: "The control layer starting with finanse AI" })).text);
  expect(close.matches[0]).toMatchObject({ key: "home.hero.headline" });
  expect(close.note).toContain("closest");
  const onPage = JSON.parse((await c.call("find_text", { phrase: "Discuss a pilot", page: "pricing" })).text);
  expect(onPage.every((m: { key: string }) => m.key.startsWith("pricing."))).toBe(true);
  await c.close();
});
