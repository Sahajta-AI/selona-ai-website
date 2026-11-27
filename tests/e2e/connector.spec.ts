import { test, expect } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { bringBackOriginal, editText, editorApi, openEditor, publishAndWait, signIn, visitorText } from "./editor-helpers";

// Proof 9: a real MCP client connects, lists the tools, proposes a change and gets
// a review link; publishing from that link changes the site.
// Since 27 Nov (owner's decision) Claude can also publish, but only the exact draft
// the person previewed (by draft_id); see the tests further down.
test("Claude connector: propose → review link → Publish in the editor", async ({ page, baseURL }) => {
  await signIn(page);
  await bringBackOriginal(page);

  const client = new Client({ name: "e2e-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`/api/mcp/${process.env.E2E_CONNECTOR_TOKEN}`, baseURL)));
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  expect(names).toEqual([
    "bring_back_version", "change_list", "change_text", "find_text", "list_pages", "publish", "read_page",
    "replace_picture", "restore_as_draft", "save_version", "show_changes", "show_history", "undo_changes", "undo_last_publish",
  ]);
  // every tool that changes the live website is marked as such, so Claude asks first
  for (const t of tools.filter((t) => ["publish", "undo_last_publish", "bring_back_version"].includes(t.name))) expect(t.annotations?.destructiveHint).toBe(true);

  const found = await client.callTool({ name: "find_text", arguments: { phrase: "Discuss a pilot" } });
  const key = JSON.parse((found.content as { text: string }[])[0].text)[0].key;
  expect(key).toBe("pricing.tiers.0.cta");
  const res = await client.callTool({ name: "change_text", arguments: { changes: [{ key, new_text: "Start a pilot (via Claude)" }] } });
  const reply = (res.content as { text: string }[])[0].text;
  const link = reply.match(/https?:\/\/\S+\/editor\/open\?\S+/)![0];
  await client.close();

  // proposing changed nothing live
  const before = (await editorApi(page, "/api/editor/state")).json.liveId;
  expect((await visitorText(page, "/pricing", before)).text).not.toContain("Start a pilot (via Claude)");

  // the review link shows old vs new with Undo, then Publish
  await page.goto(link);
  const change = page.locator('[data-change="pricing.tiers.0.cta"]');
  await expect(change).toContainText("Discuss a pilot");
  await expect(change).toContainText("Start a pilot (via Claude)");
  await expect(change.getByRole("button", { name: "Undo this change" })).toBeVisible();
  await publishAndWait(page);
  const liveId = (await editorApi(page, "/api/editor/state")).json.liveId;
  expect((await visitorText(page, "/pricing", liveId)).text).toContain("Start a pilot (via Claude)");

  // no standing event stream (stateless): answered at once instead of hanging until the time limit
  const stream = await page.request.get(`/api/mcp/${process.env.E2E_CONNECTOR_TOKEN}`, { headers: { Accept: "text/event-stream" }, timeout: 10_000 });
  expect(stream.status()).toBe(405);

  // a wrong connector address is refused
  const bad = await page.request.post("/api/mcp/not-a-real-token", { data: {} });
  expect(bad.status()).toBe(401);
  await bringBackOriginal(page);
});

// A change prepared from Claude while the editor is already open must never go live
// unseen: Publish is refused with the "someone else changed this draft" warning.
test("Claude connector: a change prepared while the editor is open isn't published unseen", async ({ page, baseURL }) => {
  await signIn(page);
  await bringBackOriginal(page);
  await openEditor(page, "/pricing");
  // the person makes (and saves) their own change, so Publish is ready
  await editText(page, "Discuss a pilot", "Reviewed by the person");

  const client = new Client({ name: "e2e-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`/api/mcp/${process.env.E2E_CONNECTOR_TOKEN}`, baseURL)));
  await client.callTool({ name: "change_text", arguments: { changes: [{ key: "pricing.tiers.0.cta", new_text: "Unreviewed (via Claude)" }] } });
  await client.close();

  const liveBefore = (await editorApi(page, "/api/editor/state")).json.liveId;
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Someone else changed this draft", { timeout: 15_000 });
  expect((await editorApi(page, "/api/editor/state")).json.liveId).toBe(liveBefore);
  const visitor = (await visitorText(page, "/pricing", liveBefore)).text;
  expect(visitor).not.toContain("Unreviewed (via Claude)");
  expect(visitor).not.toContain("Reviewed by the person");

  // after loading the new draft the change is shown for review, and can then be published
  await page.getByRole("button", { name: "Load their version" }).click();
  await page.getByRole("button", { name: /^Changes/ }).click();
  await expect(page.locator('[data-change="pricing.tiers.0.cta"]')).toContainText("Unreviewed (via Claude)", { timeout: 30_000 });
  await bringBackOriginal(page);
});
