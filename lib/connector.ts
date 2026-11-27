import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { isAllowed, makeLinkTicket } from "@/lib/auth";
import { archive, Conflict, findRecord, getDraft, getLive, listRecords, saveDraft, VIA_CLAUDE } from "@/lib/content/versions";
import { bringBackArchive, NothingToDo, pendingChanges, publishDraft, undoLastPublish } from "@/lib/content/actions";
import { findText, listsIn } from "@/lib/content/find";
import { PAGES, describeKey, diffContent, flatten, getAt, isMediaKey, isTextKey, isVideoKey, setAt, type Change, type Content, type Json } from "@/lib/content/paths";
import { fetchMedia, MediaProblem, saveMedia } from "@/lib/media";

// The Claude connector: a private address per person. EDITOR_CONNECTOR_TOKENS is
// "email:sha256(token),…"; removing an entry switches that address off at once.
// It can do everything the editor can. Changes are drafts first; Claude gives the
// person a preview link and publishes only when the person asks it to (owner's
// decision, 27 Nov). Everything it does is recorded as "<email> (via Claude)".
export function connectorUser(token: string): string | null {
  const hash = createHash("sha256").update(token).digest("hex");
  for (const entry of (process.env.EDITOR_CONNECTOR_TOKENS || "").split(",")) {
    const [email, want] = entry.trim().split(":");
    if (!email || !want || want.length !== hash.length) continue;
    if (timingSafeEqual(Buffer.from(hash), Buffer.from(want)) && isAllowed(email)) return email.toLowerCase();
  }
  return null;
}

const INSTRUCTIONS = `This connector edits the Selona website (selona.ai): its words, pictures, videos and lists, on every page.

How to work:
1. Find what to change. If the person describes it or shares a screenshot, read the words in it and use find_text (it ignores case, spacing, line breaks and quote styles, and suggests close matches). Use read_page to see a whole page, its pictures and its lists. If several places match, ask which one, or use the page the screenshot shows.
2. Make the change with change_text, change_list or replace_picture. Each one saves a draft only: nothing is live yet.
3. Give the person the preview link from the reply (it opens the editor signed in, showing old and new side by side) and ask whether to publish.
4. Only when the person clearly says to publish, call publish with the draft_id from your last change or from show_changes. If the draft changed since (someone else edited), publish refuses: show the person the new list of changes and ask again.
Use plain, non-technical words with the person; they are not technical. Never mention keys or ids unless asked.
To go back: undo_changes drops changes that aren't live yet; undo_last_publish puts the website back as it was before the latest publish; show_history, restore_as_draft, save_version and bring_back_version work with older versions. Nothing is ever deleted.`;

const pageFor = (key: string) => Object.values(PAGES).find((p) => p.groups[0] === key.split(".")[0]) ?? PAGES.home;
const out = (o: unknown) => ({ content: [{ type: "text" as const, text: typeof o === "string" ? o : JSON.stringify(o, null, 2) }] });
const fail = (message: string) => ({ ...out(message), isError: true });

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

const show = (v: Json | undefined) => (v === undefined ? "(nothing)" : typeof v === "string" ? v : Array.isArray(v) ? `a list of ${v.length}` : JSON.stringify(v));
const describeChange = (c: Change) =>
  c.kind === "list"
    ? { where: describeKey(c.key), key: c.key, what: `list changed (${Array.isArray(c.before) ? c.before.length : 0} → ${Array.isArray(c.after) ? c.after.length : 0} items, or new order)` }
    : { where: describeKey(c.key), key: c.key, before: show(c.before), after: show(c.after) };

export function buildConnector(email: string, origin: string) {
  const server = new McpServer({ name: "selona-website", version: "2.0.0" }, { instructions: INSTRUCTIONS });
  const by = `${email}${VIA_CLAUDE}`;
  const previewLink = (path: string) =>
    `${origin}/editor/open?t=${makeLinkTicket(email)}&next=${encodeURIComponent(`/editor?review=1&path=${encodeURIComponent(path)}`)}`;
  const afterDraft = async (key: string, summary: string) => {
    const { draft, changes } = await pendingChanges();
    return out(
      `${summary}\n\nSaved as a draft. Nothing is live yet.\n` +
        `Preview link (opens the editor signed in, old and new side by side; valid 24 hours): ${previewLink(pageFor(key).path)}\n` +
        `Waiting to go live in total: ${changes.length} change${changes.length === 1 ? "" : "s"}.\n` +
        `draft_id: ${draft.id}\n\nAsk the person to look at the preview, then call publish with this draft_id only if they say to publish.`,
    );
  };
  // The site refreshes as soon as this request finishes (revalidation is applied after
  // the response), so there's nothing to wait for here.
  const liveReply = (path: string, what: string) => out(`${what} The website shows it within a few seconds: ${origin}${path}`);
  const guard = async <T,>(fn: () => Promise<T>) => {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof MediaProblem || err instanceof NothingToDo) return fail(err.message);
      if (err instanceof Conflict)
        return fail(
          err.message === "draft"
            ? "Someone changed the draft at the same moment. Nothing was saved. Please call show_changes and try again."
            : "Someone else published in the meantime, so nothing was changed. Use show_history to see what's live now.",
        );
      console.error("Connector error:", (err as Error).message);
      return fail("The website's store didn't answer just now. Nothing was changed. Please try again in a minute.");
    }
  };

  // ---- reading ----------------------------------------------------------------
  server.registerTool(
    "list_pages",
    {
      description: "List the pages of the Selona website (selona.ai) and the sections on each. Use the page ids with read_page.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      guard(async () => {
        const { content } = await getDraft();
        return out(
          Object.entries(PAGES)
            .map(([id, p]) => ({
              page: id,
              name: p.label,
              address: `${origin}${p.path}`,
              sections: Object.keys((content as Record<string, object>)[p.groups[0]]).map((s) => describeKey(`${p.groups[0]}.${s}`)),
            }))
            .concat([{ page: "shared", name: "Shown on every page (menu, footer, questions, buttons)", address: origin, sections: Object.keys(content.shared).map((s) => describeKey(`shared.${s}`)) }]),
        );
      }),
  );

  server.registerTool(
    "read_page",
    {
      description:
        "Read everything on one page as it will look after the changes waiting to go live: each piece of text with its key (for change_text), each picture or video with its key and address (for replace_picture), and each list with its key and number of items (for change_list).",
      inputSchema: { page: z.string().describe("Page id from list_pages, e.g. 'home', 'pricing', or 'shared' for the menu, footer and questions") },
      annotations: { readOnlyHint: true },
    },
    async ({ page }) =>
      guard(async () => {
        const { content, live } = await getDraft();
        const group = page === "shared" ? "shared" : PAGES[page]?.groups[0];
        if (!group) return fail(`There is no page called "${page}". Use list_pages to see the pages.`);
        const all = flatten((content as Record<string, Json>)[group], `${group}.`);
        const mark = (key: string, value: Json) => (getAt(live, key) !== value ? { not_live_yet: true } : {});
        return out({
          page,
          address: `${origin}${page === "shared" ? "/" : PAGES[page].path}`,
          text: all.filter(([k]) => isTextKey(k)).map(([key, value]) => ({ key, where: describeKey(key), text: value, ...mark(key, value) })),
          pictures_and_videos: all.filter(([k]) => isMediaKey(k)).map(([key, value]) => ({ key, where: describeKey(key), kind: isVideoKey(key) ? "video" : "picture", address: String(value).startsWith("/") ? `${origin}${value}` : value, ...mark(key, value) })),
          lists: listsIn((content as Record<string, Json>)[group], group).map((l) => ({ ...l, where: describeKey(l.list) })),
        });
      }),
  );

  server.registerTool(
    "find_text",
    {
      description:
        "Find where words appear anywhere on the website, for example words read from a screenshot. Ignores case, spacing, line breaks, quote and dash styles. If nothing matches exactly, returns the closest texts. Returns each match's key, page and full text.",
      inputSchema: {
        phrase: z.string().min(2).max(2000).describe("The words to look for (a few distinctive words work best)"),
        page: z.string().optional().describe("Only look on this page (page id from list_pages)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ phrase, page }) =>
      guard(async () => {
        const { content } = await getDraft();
        const group = page ? (page === "shared" ? "shared" : PAGES[page]?.groups[0]) : undefined;
        if (page && !group) return fail(`There is no page called "${page}". Use list_pages to see the pages.`);
        const scope = group ? { [group]: (content as Record<string, Json>)[group] } : content;
        const matches = findText(scope, phrase).map((m) => ({ key: m.key, where: describeKey(m.key), page: pageFor(m.key).label, text: m.text, ...(m.exact ? {} : { close_match: m.score }) }));
        if (!matches.length) return out(`"${phrase}" doesn't appear on the website, and nothing is close. Try fewer or more distinctive words, or read_page.`);
        return out(matches.some((m) => "close_match" in m) ? { note: "No exact match. These are the closest texts; check with the person if unsure.", matches } : matches);
      }),
  );

  server.registerTool(
    "show_changes",
    {
      description: "Show every change waiting to go live (old and new), with a preview link and the draft_id needed to publish.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      guard(async () => {
        const { draft, changes } = await pendingChanges();
        if (!changes.length) return out("Nothing is waiting to go live: the draft matches the website.");
        return out({
          changes: changes.map(describeChange),
          preview_link: previewLink(pageFor(changes[0].key).path),
          draft_id: draft.id,
          last_changed_by: draft.by,
        });
      }),
  );

  // ---- changing (drafts) -----------------------------------------------------------
  const changeText = async ({ changes }: { changes: { key: string; new_text: string }[] }) =>
    guard(async () => {
      const { content } = await getDraft();
      for (const c of changes)
        if (!isTextKey(c.key) || typeof getAt(content, c.key) !== "string")
          return fail(`"${c.key}" isn't a piece of text on the website. Use find_text or read_page to get the right key.`);
      await changeDraft(by, (draft) => changes.reduce((d, c) => setAt(d, c.key, c.new_text), draft));
      return afterDraft(changes[0].key, changes.map((c) => `${describeKey(c.key)}: "${getAt(content, c.key)}" → "${c.new_text}"`).join("\n"));
    });
  const changeTextSchema = {
    description:
      "Change words on the website (headings, text, buttons, menu, footer, questions, page titles and descriptions for search engines; numbers are just text). Saves a draft only. Then give the person the preview link and ask before publishing.",
    inputSchema: { changes: z.array(z.object({ key: z.string(), new_text: z.string().max(5000) })).min(1).max(50) },
    annotations: { destructiveHint: false, idempotentHint: true },
  };
  server.registerTool("change_text", changeTextSchema, changeText);
  // the name used before 27 Nov, kept so existing chats keep working
  server.registerTool("propose_text_changes", { ...changeTextSchema, description: `Same as change_text. ${changeTextSchema.description}` }, changeText);

  const changeList = async ({ list, action, index, to, fields }: { list: string; action: "add" | "remove" | "move"; index: number; to?: number; fields?: Record<string, string> }) =>
    guard(async () => {
      const { content } = await getDraft();
      const items = getAt(content, list);
      if (!Array.isArray(items)) return fail(`"${list}" isn't a list. Use read_page to see the lists on a page.`);
      if (index >= items.length) return fail(`That list has ${items.length} items (0 to ${items.length - 1}).`);
      if (action === "remove" && items.length === 1) return fail("That's the last item in the list, so it can't be removed.");
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
      const done = action === "add" ? `item added after number ${index + 1}` : action === "remove" ? `item ${index + 1} removed` : `item ${index + 1} moved to position ${Math.min(to ?? index, items.length - 1) + 1}`;
      return afterDraft(list, `${describeKey(list)}: ${done}.`);
    });
  const changeListSchema = {
    description:
      "Change a list on the website (use cases, problems, features, questions, price plan features, outputs, menu links…): add an item, remove one, or move one. Saves a draft only. To change the words of an item, use change_text with the item's keys.",
    inputSchema: {
      list: z.string().describe("The list key from read_page, e.g. 'home.useCases.items'"),
      action: z.enum(["add", "remove", "move"]),
      index: z.number().int().min(0).describe("Position of the item (0 = first). For add: the new item goes after this one and starts as a copy of it."),
      to: z.number().int().min(0).optional().describe("For move: the new position (0 = first)"),
      fields: z.record(z.string(), z.string()).optional().describe("For add: the new item's words, e.g. {\"name\": \"Cash flow forecasts\"}. For a list of plain words use {\"text\": \"…\"}."),
    },
  };
  server.registerTool("change_list", changeListSchema, changeList);
  server.registerTool("propose_list_change", { ...changeListSchema, description: `Same as change_list. ${changeListSchema.description}` }, changeList);

  server.registerTool(
    "replace_picture",
    {
      description:
        "Replace a picture (or a background video) on the website with one from a public https web address, or with the file's bytes in base64. JPG, PNG, WebP or GIF pictures; MP4 or WebM videos; at most 4 MB. Saves a draft only. Use read_page to find the picture's key.",
      inputSchema: {
        key: z.string().describe("The picture's key from read_page (it ends in 'Src')"),
        image_url: z.string().max(2000).optional().describe("A public https address of the new picture or video"),
        image_base64: z.string().max(4_000_000).optional().describe("Or the file itself, base64 encoded (files under about 3 MB this way)"),
      },
    },
    async ({ key, image_url, image_base64 }) =>
      guard(async () => {
        const { content } = await getDraft();
        if (!isMediaKey(key) || typeof getAt(content, key) !== "string") return fail(`"${key}" isn't a picture or video on the website. Use read_page to find picture keys.`);
        if (!image_url === !image_base64) return fail("Please give either image_url or image_base64 (one of them).");
        const bytes = image_url ? await fetchMedia(image_url) : Buffer.from(image_base64!.replace(/^data:[^,]*,/, ""), "base64");
        const url = await saveMedia(bytes, isVideoKey(key));
        await changeDraft(by, (draft) => setAt(draft, key, url));
        return afterDraft(key, `${describeKey(key)}: replaced with the new ${isVideoKey(key) ? "video" : "picture"}.`);
      }),
  );

  server.registerTool(
    "undo_changes",
    {
      description: "Drop changes that aren't live yet, so those parts go back to what the website shows now. Give the keys from show_changes, or leave keys out to drop every change waiting to go live. Doesn't touch the live website.",
      inputSchema: { keys: z.array(z.string()).max(200).optional().describe("Keys from show_changes; leave out to drop all") },
    },
    async ({ keys }) =>
      guard(async () => {
        const { draft, changes } = await pendingChanges();
        if (!changes.length) return out("There's nothing to undo: no changes are waiting to go live.");
        const unknown = (keys ?? []).filter((k) => !changes.some((c) => c.key === k));
        if (unknown.length) return fail(`These aren't waiting to go live: ${unknown.join(", ")}. Use show_changes to see the keys.`);
        await changeDraft(by, (d) => (keys?.length ? keys.reduce((acc, k) => setAt(acc, k, getAt(draft.live, k) as Json), d) : draft.live));
        const left = (await pendingChanges()).changes.length;
        return out(`${keys?.length ? `Undid ${keys.length} change${keys.length === 1 ? "" : "s"}` : "Dropped every change waiting to go live"}. ${left ? `${left} change${left === 1 ? "" : "s"} still waiting to go live.` : "The draft now matches the website."}`);
      }),
  );

  // ---- going live -------------------------------------------------------------
  server.registerTool(
    "publish",
    {
      description:
        "Put the changes waiting to go live onto the real website. Only call this when the person has seen the preview (or the list of changes) and clearly asked to publish. Needs the draft_id from the last change or from show_changes; if anything changed since, nothing is published and you should show the person the new changes first.",
      inputSchema: {
        draft_id: z.string().describe("The draft_id from your last change or show_changes"),
        note: z.string().max(200).optional().describe("Optional short note for History, in the person's words"),
      },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async ({ draft_id, note }) =>
      guard(async () => {
        const { draft, changes } = await pendingChanges();
        if (!changes.length) return out("There's nothing to publish: the website already shows everything.");
        if (draft.id !== draft_id)
          return fail(
            `Nothing was published: the changes waiting to go live are different from the ones the person saw (someone edited since). Show the person this list and ask again. Current draft_id: ${draft.id}\n${JSON.stringify(changes.map(describeChange), null, 2)}`,
          );
        const rec = await publishDraft(by, { draftId: draft_id, liveId: draft.liveId, note });
        return liveReply(pageFor(changes[0].key).path, `Published ${changes.length} change${changes.length === 1 ? "" : "s"}. History records it as done with Claude.`);
      }),
  );

  server.registerTool(
    "show_history",
    {
      description: "Show every version that went live (when, who, and whether it was done with Claude) and the saved whole-site versions. Use ids with restore_as_draft, undo_last_publish and bring_back_version.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      guard(async () => {
        const [published, archives] = await Promise.all([listRecords("published", 50), listRecords("archives", 50)]);
        return out({
          published: published.map((v, i) => ({
            id: v.id,
            when: v.at,
            who: v.by.replace(VIA_CLAUDE, ""),
            ...(v.by.endsWith(VIA_CLAUDE) ? { published_with_claude: true } : v.claude ? { included_changes_made_with_claude: true } : {}),
            ...(i === 0 ? { live_now: true } : {}),
            ...(v.name ? { note: v.name } : {}),
          })),
          saved_versions: archives.map((v) => ({ id: v.id, name: v.name, when: v.at, who: v.by })),
        });
      }),
  );

  server.registerTool(
    "undo_last_publish",
    {
      description: "Put the website straight back to how it was before the latest publish. Ask the person first. Needs the id of the version marked live_now in show_history. The undo is itself a new version; nothing is deleted.",
      inputSchema: { id: z.string().describe("The id of the live_now version from show_history") },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      guard(async () => {
        const live = await undoLastPublish(by, id);
        return liveReply("/", "The last publish is undone: the website is back to how it was before.");
      }),
  );

  const restoreAsDraft = async ({ id }: { id: string }) =>
    guard(async () => {
      const rec = (await findRecord("published", id)) ?? (await findRecord("archives", id));
      if (!rec) return fail("That version couldn't be found. Use show_history to see the versions.");
      const before = (await getDraft()).content;
      await changeDraft(by, () => rec.content);
      const n = diffContent(before, rec.content).length;
      return afterDraft("home", `The version from ${rec.at}${rec.name ? ` ("${rec.name}")` : ""} is now the draft (${n} difference${n === 1 ? "" : "s"} from before).`);
    });
  const restoreSchema = {
    description: "Make an older version of the whole website (from show_history, either a published version or a saved one) the draft, to preview before publishing. Replaces changes waiting to go live. Doesn't change the live website.",
    inputSchema: { id: z.string().describe("A version id from show_history") },
  };
  server.registerTool("restore_as_draft", restoreSchema, restoreAsDraft);
  server.registerTool("prepare_restore", { ...restoreSchema, description: `Same as restore_as_draft. ${restoreSchema.description}` }, restoreAsDraft);

  server.registerTool(
    "save_version",
    {
      description: "Save the whole website as it is live now under a name, so it can be brought back later in one step.",
      inputSchema: { name: z.string().min(1).max(120).describe("A name the person will recognise, e.g. 'Before the March changes'") },
    },
    async ({ name }) =>
      guard(async () => {
        const rec = await archive(name.trim(), (await getLive()).content, by);
        return out(`Saved the website as "${rec.name}". It's in Saved versions (id ${rec.id}).`);
      }),
  );

  server.registerTool(
    "bring_back_version",
    {
      description: "Put a saved whole-site version (from show_history's saved_versions) live again in one step. Ask the person first. Nothing is deleted: today's version stays in History.",
      inputSchema: { id: z.string().describe("A saved version id from show_history") },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      guard(async () => {
        const live = await getLive();
        const res = await bringBackArchive(by, id, { liveId: live.id });
        if (!res) return fail("That saved version couldn't be found. Use show_history to see them.");
        return liveReply("/", `"${res.name}" is back on the website.`);
      }),
  );

  return server;
}
