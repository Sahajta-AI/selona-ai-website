import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { isAllowed } from "@/lib/auth";
import { Conflict, findRecord, getDraft, listRecords, saveDraft } from "@/lib/content/versions";
import { PAGES, describeKey, flatten, getAt, isMediaKey, isTextKey, setAt, diffContent, type Content, type Json } from "@/lib/content/paths";

// The Claude connector: a private address per person. EDITOR_CONNECTOR_TOKENS is
// "email:sha256(token),…"; removing an entry switches that address off at once.
// It can only prepare drafts. Nothing here can publish.
export function connectorUser(token: string): string | null {
  const hash = createHash("sha256").update(token).digest("hex");
  for (const entry of (process.env.EDITOR_CONNECTOR_TOKENS || "").split(",")) {
    const [email, want] = entry.trim().split(":");
    if (!email || !want || want.length !== hash.length) continue;
    if (timingSafeEqual(Buffer.from(hash), Buffer.from(want)) && isAllowed(email)) return email.toLowerCase();
  }
  return null;
}

const pageFor = (key: string) => Object.values(PAGES).find((p) => p.groups[0] === key.split(".")[0]) ?? PAGES.home;
const text = (o: unknown) => ({ content: [{ type: "text" as const, text: typeof o === "string" ? o : JSON.stringify(o, null, 2) }] });
const fail = (message: string) => ({ ...text(message), isError: true });

/** Change the shared draft, retrying once if someone saved in between. */
async function changeDraft(by: string, fn: (c: Content) => Content) {
  for (let attempt = 0; ; attempt++) {
    const cur = await getDraft();
    try {
      return await saveDraft(fn(cur.content), by, cur.id);
    } catch (err) {
      if (!(err instanceof Conflict) || attempt > 0) throw err;
    }
  }
}

export function buildConnector(email: string, origin: string) {
  const server = new McpServer({ name: "selona-website", version: "1.0.0" });
  const by = `${email} (via Claude)`;
  const reviewLink = (key: string) => `${origin}/editor?review=1&path=${encodeURIComponent(pageFor(key).path)}`;
  const reviewNote = (key: string) =>
    `Saved as a draft. Nothing is live yet. Open this link to see exactly what changed, undo any change, and press Publish: ${reviewLink(key)}`;

  server.registerTool(
    "list_pages",
    { description: "List the pages of the Selona website (selona.ai) and the sections on each. Use the page ids with read_page.", inputSchema: {} },
    async () => {
      const { content } = await getDraft();
      return text(
        Object.entries(PAGES).map(([id, p]) => ({
          page: id,
          name: p.label,
          address: p.path,
          sections: Object.keys((content as Record<string, object>)[p.groups[0]]).map((s) => ({ section: `${p.groups[0]}.${s}`, name: describeKey(`${p.groups[0]}.${s}`) })),
        })).concat([{ page: "shared", name: "Shown on every page (menu, footer, questions, buttons)", address: "/", sections: Object.keys(content.shared).map((s) => ({ section: `shared.${s}`, name: describeKey(`shared.${s}`) })) }]),
      );
    },
  );

  server.registerTool(
    "read_page",
    {
      description: "Read the current words on one page (the draft, which matches the live site unless someone has unpublished changes). Each piece of text has a key to use with propose_text_changes. Lists have a list key for propose_list_change.",
      inputSchema: { page: z.string().describe("Page id from list_pages, e.g. 'home', 'pricing', or 'shared' for the menu, footer and questions") },
    },
    async ({ page }) => {
      const { content, live } = await getDraft();
      const group = page === "shared" ? "shared" : PAGES[page]?.groups[0];
      if (!group) return fail(`There is no page called "${page}". Use list_pages to see the pages.`);
      const rows = flatten((content as Record<string, Json>)[group], `${group}.`)
        .filter(([k]) => isTextKey(k) || isMediaKey(k))
        .map(([key, value]) => ({ key, where: describeKey(key), text: value, ...(getAt(live, key) !== value ? { not_live_yet: true } : {}) }));
      return text({ page, rows });
    },
  );

  server.registerTool(
    "find_text",
    {
      description: "Find where a word or phrase appears anywhere on the website. Returns each match with its page and key.",
      inputSchema: { phrase: z.string().min(2).describe("Words to look for (not case sensitive)") },
    },
    async ({ phrase }) => {
      const { content } = await getDraft();
      const needle = phrase.toLowerCase();
      const matches = flatten(content)
        .filter(([k, v]) => isTextKey(k) && typeof v === "string" && v.toLowerCase().includes(needle))
        .map(([key, value]) => ({ key, where: describeKey(key), page: pageFor(key).label, text: value }));
      return text(matches.length ? matches : `"${phrase}" doesn't appear on the website.`);
    },
  );

  server.registerTool(
    "propose_text_changes",
    {
      description: "Prepare changes to words on the website as a draft. Nothing goes live: the person reviews the changes in the editor and presses Publish there. Use keys from read_page or find_text. Numbers are just text.",
      inputSchema: {
        changes: z.array(z.object({ key: z.string(), new_text: z.string().max(5000) })).min(1).max(50),
      },
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    async ({ changes }) => {
      const { content } = await getDraft();
      for (const c of changes) {
        if (!isTextKey(c.key) || typeof getAt(content, c.key) !== "string") return fail(`"${c.key}" isn't a piece of text on the website. Use find_text or read_page to get the right key.`);
      }
      await changeDraft(by, (draft) => changes.reduce((d, c) => setAt(d, c.key, c.new_text), draft));
      return text(changes.map((c) => `${describeKey(c.key)} → "${c.new_text}"`).join("\n") + `\n\n${reviewNote(changes[0].key)}`);
    },
  );

  server.registerTool(
    "propose_list_change",
    {
      description:
        "Prepare a change to a list on the website (use cases, problems, features, questions, price plan features, outputs…) as a draft: add an item, remove one, or move one. Nothing goes live until the person presses Publish in the editor.",
      inputSchema: {
        list: z.string().describe("The list key, e.g. 'home.useCases.items' (a key from read_page without the item number and field)"),
        action: z.enum(["add", "remove", "move"]),
        index: z.number().int().min(0).describe("Position of the item (0 = first). For add: the new item goes after this one and starts as a copy of it."),
        to: z.number().int().min(0).optional().describe("For move: the new position (0 = first)"),
        fields: z.record(z.string(), z.string()).optional().describe("For add: the new item's words, e.g. {\"name\": \"Cash flow forecasts\"}. For a list of plain words use {\"text\": \"…\"}."),
      },
    },
    async ({ list, action, index, to, fields }) => {
      const { content } = await getDraft();
      const items = getAt(content, list);
      if (!Array.isArray(items)) return fail(`"${list}" isn't a list. Use read_page to find list keys (the part before the item number).`);
      if (index >= items.length) return fail(`That list has ${items.length} items (0 to ${items.length - 1}).`);
      await changeDraft(by, (draft) => {
        const arr = [...(getAt(draft, list) as Json[])];
        if (action === "remove") arr.splice(index, 1);
        if (action === "move") {
          const [it] = arr.splice(index, 1);
          arr.splice(Math.min(to ?? index, arr.length), 0, it);
        }
        if (action === "add") {
          let item: Json = structuredClone(arr[index]);
          if (fields) {
            if (typeof item === "string") item = fields.text ?? Object.values(fields)[0] ?? item;
            else for (const [k, v] of Object.entries(fields)) if (typeof (item as Record<string, Json>)[k] === "string" && isTextKey(k)) (item as Record<string, Json>)[k] = v;
          }
          arr.splice(index + 1, 0, item);
        }
        return setAt(draft, list, arr);
      });
      return text(`${describeKey(list)}: ${action === "add" ? "item added" : action === "remove" ? "item removed" : "item moved"}.\n\n${reviewNote(list)}`);
    },
  );

  server.registerTool(
    "show_history",
    { description: "Show every published version of the website (when and who) and the saved whole-site versions. Use an id with prepare_restore.", inputSchema: {} },
    async () => {
      const [published, archives] = await Promise.all([listRecords("published", 50), listRecords("archives", 50)]);
      return text({
        published: published.map((v, i) => ({ id: v.id, when: v.at, who: v.by, ...(i === 0 ? { live_now: true } : {}), ...(v.name ? { note: v.name } : {}) })),
        saved_versions: archives.map((v) => ({ id: v.id, name: v.name, when: v.at, who: v.by })),
      });
    },
  );

  server.registerTool(
    "prepare_restore",
    {
      description: "Bring back an older version of the whole website as a draft (from show_history). Nothing goes live until the person reviews it in the editor and presses Publish.",
      inputSchema: { id: z.string().describe("A version id from show_history") },
    },
    async ({ id }) => {
      const rec = (await findRecord("published", id)) ?? (await findRecord("archives", id));
      if (!rec) return fail("That version couldn't be found. Use show_history to see the versions.");
      const before = (await getDraft()).content;
      await changeDraft(by, () => rec.content);
      const n = diffContent(before, rec.content).length;
      return text(`The version from ${rec.at}${rec.name ? ` ("${rec.name}")` : ""} is now the draft (${n} difference${n === 1 ? "" : "s"} from before).\n\n${reviewNote("home")}`);
    },
  );
  return server;
}
