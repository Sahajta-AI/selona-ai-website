import { test, expect } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { bringBackOriginal, editorApi, publishAndWait, signIn, visitorText } from "./editor-helpers";

// Proof 9: a real MCP client connects, lists the tools, proposes a change and gets
// a review link; publishing from that link changes the site; the connector can't publish.
test("Claude connector: propose → review link → Publish in the editor", async ({ page, baseURL }) => {
  await signIn(page);
  await bringBackOriginal(page);

  const client = new Client({ name: "e2e-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`/api/mcp/${process.env.E2E_CONNECTOR_TOKEN}`, baseURL)));
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  expect(names).toEqual(["find_text", "list_pages", "prepare_restore", "propose_list_change", "propose_text_changes", "read_page", "show_history"]);
  expect(names.some((n) => /publish/i.test(n))).toBe(false); // it can only prepare drafts

  const found = await client.callTool({ name: "find_text", arguments: { phrase: "Discuss a pilot" } });
  const key = JSON.parse((found.content as { text: string }[])[0].text)[0].key;
  expect(key).toBe("pricing.tiers.0.cta");
  const res = await client.callTool({ name: "propose_text_changes", arguments: { changes: [{ key, new_text: "Start a pilot (via Claude)" }] } });
  const reply = (res.content as { text: string }[])[0].text;
  const link = reply.match(/https?:\/\/\S+\/editor\?review=1\S*/)![0];
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

  // a wrong connector address is refused
  const bad = await page.request.post("/api/mcp/not-a-real-token", { data: {} });
  expect(bad.status()).toBe(401);
  await bringBackOriginal(page);
});
