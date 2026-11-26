import { test, expect } from "@playwright/test";
import { bringBackOriginal, editText, editorApi, openEditor, publishAndWait, signIn, visitorText } from "./editor-helpers";

// Proofs 3–8 and 10, run in order on one site; each starts from the original site.
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await bringBackOriginal(page);
});

test("3: edit one line → preview → publish → the site shows it", async ({ page }) => {
  await openEditor(page);
  await editText(page, "ThinkAIWork by Selona", "Edited by the test 12");
  // not live yet
  expect((await visitorText(page, "/")).text).not.toContain("Edited by the test 12");
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.frameLocator("iframe").getByText("Edited by the test 12").first()).toBeVisible();
  await page.getByRole("button", { name: "Back to editing" }).click();
  await publishAndWait(page);
  const { liveId } = (await editorApi(page, "/api/editor/state")).json;
  expect((await visitorText(page, "/", liveId)).text).toContain("Edited by the test 12");
});

test("4: Ctrl+Z, Undo and Redo work", async ({ page }) => {
  await openEditor(page, "/pricing");
  const frame = page.frameLocator("iframe");
  await editText(page, "Choose the right starting point", "Undo test heading");
  await page.locator("header").click({ position: { x: 5, y: 5 } }); // focus back on the editor
  await page.keyboard.press("ControlOrMeta+z");
  await expect(frame.locator("h1")).toHaveText("Choose the right starting point for your finance workflows.");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(frame.locator("h1")).toHaveText("Undo test heading");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(frame.locator("h1")).toHaveText("Choose the right starting point for your finance workflows.");
  await expect(page.getByRole("status")).toHaveText(/Everything is live|Saved as a draft/, { timeout: 15_000 });
});

test("5: replace a picture → it shows", async ({ page }) => {
  await openEditor(page, "/");
  // a small real PNG made in the browser
  const png = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 200;
    const g = c.getContext("2d")!;
    g.fillStyle = "#c026d3";
    g.fillRect(0, 0, 320, 200);
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    return Array.from(new Uint8Array(await b!.arrayBuffer()));
  });
  await page.getByRole("button", { name: "This page" }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("listitem").filter({ hasText: "Home page › Product picture › Picture" }).getByRole("button", { name: "Replace" }).click();
  await (await chooser).setFiles({ name: "new.png", mimeType: "image/png", buffer: Buffer.from(png) });
  await expect(page.getByRole("status")).toHaveText(/Saved as a draft/, { timeout: 15_000 });
  const { draft } = (await editorApi(page, "/api/editor/state")).json;
  const url: string = draft.home.showcase.imageSrc;
  expect(url).toMatch(/media\/.+\.webp$/);
  await expect(page.frameLocator("iframe").locator(`img[src*="${url.split("/").pop()}"]`)).toBeVisible();
  await publishAndWait(page);
  const { liveId } = (await editorApi(page, "/api/editor/state")).json;
  expect((await visitorText(page, "/", liveId)).html).toContain(url.split("/").pop());
  // the upload refuses files that aren't pictures
  const bad = await page.request.post("/api/editor/upload", { multipart: { kind: "image", file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") } } });
  expect(bad.status()).toBe(415);
});

test("6: add, remove and reorder a list item → it shows", async ({ page }) => {
  await openEditor(page, "/");
  const frame = page.frameLocator("iframe");
  await frame.locator("#use-cases [data-ck]", { hasText: /^Variance analysis$/ }).click();
  await page.getByRole("button", { name: "Move up" }).first().click(); // innermost list: use cases
  await expect(page.getByRole("status")).toHaveText(/Saved as a draft/, { timeout: 15_000 });
  let { draft } = (await editorApi(page, "/api/editor/state")).json;
  const names = () => draft.home.useCases.items.map((i: { name: string }) => i.name);
  expect(names().slice(0, 2)).toEqual(["Variance analysis", "Board deck commentary"]);

  await openEditor(page, "/");
  await frame.locator("#use-cases [data-ck]", { hasText: /^Audit evidence packs$/ }).click();
  await page.getByRole("button", { name: "Add another" }).first().click();
  await expect(page.getByRole("status")).toHaveText(/Saved as a draft/, { timeout: 15_000 });
  await openEditor(page, "/");
  await editText(page, "Audit evidence packs", "Investor update packs");
  await frame.locator("#use-cases [data-ck]", { hasText: /^CFO operating reviews$/ }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Remove" }).first().click();
  await expect(page.getByRole("status")).toHaveText(/Saved as a draft/, { timeout: 15_000 });
  ({ draft } = (await editorApi(page, "/api/editor/state")).json);
  expect(names()).toEqual(["Variance analysis", "Board deck commentary", "VAT/GST reconciliation", "Stakeholder updates", "Management accounts", "Forecast commentary", "Investor update packs", "Audit evidence packs"]);
  await publishAndWait(page);
  const { liveId } = (await editorApi(page, "/api/editor/state")).json;
  const { text } = await visitorText(page, "/", liveId);
  expect(text.indexOf("Variance analysis")).toBeLessThan(text.indexOf("Board deck commentary"));
  expect(text).toContain("Investor update packs");
  expect(text).not.toContain("CFO operating reviews");
});

test("7: restore an older version → the site goes back", async ({ page }) => {
  await openEditor(page, "/security");
  await editText(page, "Built for controlled finance AI workflows.", "Security heading version B");
  await publishAndWait(page);
  await openEditor(page, "/security");
  await editText(page, "Security heading version B", "Security heading version C");
  await publishAndWait(page);
  await page.getByRole("button", { name: "History" }).click();
  // the version before the latest (B) → restore as draft → publish
  await page.getByRole("button", { name: "Restore as draft" }).first().click();
  await expect(page.getByRole("status")).toHaveText(/is now your draft|Saved as a draft/, { timeout: 15_000 });
  await expect(page.frameLocator("iframe").locator("h1")).toHaveText("Security heading version B", { timeout: 15_000 });
  await publishAndWait(page);
  const { liveId } = (await editorApi(page, "/api/editor/state")).json;
  expect((await visitorText(page, "/security", liveId)).text).toContain("Security heading version B");
  const versions = (await editorApi(page, "/api/editor/versions")).json.published;
  expect(versions.length).toBeGreaterThanOrEqual(3); // nothing deleted; the restore is a new version
});

test("7b: undo the last publish in one click → the site goes back", async ({ page }) => {
  await openEditor(page, "/security");
  await editText(page, "Built for controlled finance AI workflows.", "Security heading to undo");
  await publishAndWait(page);
  const mistake = (await editorApi(page, "/api/editor/state")).json.liveId;
  expect((await visitorText(page, "/security", mistake)).text).toContain("Security heading to undo");
  await page.getByRole("button", { name: "History" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Undo this publish" }).click();
  await expect(page.getByRole("status")).toHaveText("Live now ✓", { timeout: 60_000 });
  await expect(page.frameLocator("iframe").locator("h1")).toHaveText("Built for controlled finance AI workflows.", { timeout: 15_000 });
  const { liveId } = (await editorApi(page, "/api/editor/state")).json;
  expect(liveId).not.toBe(mistake);
  const visitor = (await visitorText(page, "/security", liveId)).text;
  expect(visitor).toContain("Built for controlled finance AI workflows.");
  expect(visitor).not.toContain("Security heading to undo");
  // nothing deleted: the mistake stays in History, and the undo is a new version on top
  const published = (await editorApi(page, "/api/editor/versions")).json.published;
  expect(published[0]).toMatchObject({ id: liveId, name: "Undid the last publish" });
  expect(published[1].id).toBe(mistake);
  // an undo aimed at a version that is no longer the newest is refused, not applied
  expect((await editorApi(page, "/api/editor/undo-publish", { id: mistake })).status).toBe(409);
});

test("8: archive the whole site → change three things → bring it back → matches exactly", async ({ page }) => {
  const pages = ["/", "/pricing", "/contact"];
  const before = await Promise.all(pages.map(async (p) => (await visitorText(page, p)).text));
  const name = `Test archive ${Date.now()}`;
  await openEditor(page, "/");
  await page.getByRole("button", { name: "Saved versions" }).click();
  await page.getByPlaceholder("For example").fill(name);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(/Saved\. You can bring this version back/);

  await editText(page, "The control layer starting with finance AI", "Three changes one");
  await openEditor(page, "/pricing");
  await editText(page, "Discuss a pilot", "Three changes two");
  await openEditor(page, "/contact");
  await editText(page, "What we will cover", "Three changes three");
  await publishAndWait(page);
  const changed = (await editorApi(page, "/api/editor/state")).json.liveId;
  expect((await visitorText(page, "/contact", changed)).text).toContain("Three changes three");

  await page.getByRole("button", { name: "Saved versions" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("listitem").filter({ hasText: name }).getByRole("button", { name: "Bring back this version" }).click();
  await expect(page.getByRole("status")).toHaveText("Live now ✓", { timeout: 60_000 });
  const liveId = (await editorApi(page, "/api/editor/state")).json.liveId;
  const after = await Promise.all(pages.map(async (p) => (await visitorText(page, p, liveId)).text));
  expect(after).toEqual(before);
});

test("10: two people editing at once see a warning, not a silent overwrite", async ({ page, browser }) => {
  const other = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await signIn(other, 2);
  await openEditor(page, "/");
  await openEditor(other, "/");
  await editText(other, "View use cases", "Edited by the other person");
  await publishAndWait(other);
  // the first person still has the editor open from before; their next change is refused with a warning
  const frame = page.frameLocator("iframe");
  const el = frame.locator("[data-ck]", { hasText: "See how it works" }).first();
  await el.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Racing edit");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alertdialog")).toContainText("Someone else changed this draft", { timeout: 15_000 });
  // and publishing over a newer live version is refused unless confirmed
  const stale = await editorApi(page, "/api/editor/publish", { liveId: "an-old-version" });
  expect(stale.status).toBe(409);
  await other.context().close();
});

test.afterAll(async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await signIn(page);
  await bringBackOriginal(page);
});
