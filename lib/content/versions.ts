import "server-only";
import { listFiles, newFileName, readJSON, writeFile, type StoredFile } from "./store";
import { defaultContent, diffContent, mergeContent, type Content, type Json } from "./paths";

// published/  every version that went live (a restore is a new version)
// drafts/     every saved draft; the newest one is the current draft
// archives/   whole-site versions saved by name
export type Folder = "published" | "drafts" | "archives";
export type VersionRecord = {
  id: string;
  at: string;
  by: string;
  kind: "publish" | "restore" | "draft" | "archive";
  name?: string; // archive name, or what a restore came from
  baseId?: string; // drafts: the live version it started from
  // drafts: holds changes prepared with Claude; published: went live with such changes
  claude?: boolean;
  // drafts: a copy put back on top after two saves landed at the same moment (see settleRace)
  copyOf?: string;
  content: Content;
};
/** Added to "by" for everything done through the Claude connector. */
export const VIA_CLAUDE = " (via Claude)";
export const isClaude = (by: string) => by.endsWith(VIA_CLAUDE);
export const ORIGINAL_ID = "original";
export const ORIGINAL_ARCHIVE_NAME = "Original site, before the editor (25 Nov 2026)";

// Blob adds a random suffix to each file name ("<id>-<suffix>.json"), so match on the id prefix.
const nameOf = (f: StoredFile) => f.pathname.split("/").pop()!.replace(/\.json$/, "");
const isFileOf = (f: StoredFile, id: string) => nameOf(f) === id || nameOf(f).startsWith(`${id}-`);

export async function latest(folder: Folder): Promise<VersionRecord | null> {
  const { files } = await listFiles(folder, 1);
  return files[0] ? readJSON<VersionRecord>(files[0]) : null;
}

export async function listRecords(folder: Folder, limit = 50): Promise<VersionRecord[]> {
  const { files } = await listFiles(folder, limit);
  return Promise.all(files.map((f) => readJSON<VersionRecord>(f)));
}

export type VersionMeta = { id: string; at: string; by: string; kind: VersionRecord["kind"]; name?: string; claude: boolean };
export const HISTORY_PAGE = 20;

/** One page of History, newest first: what each version is (not its content) and where the next page starts. */
export async function historyPage(folder: "published" | "archives", cursor?: string) {
  const { files, cursor: next } = await listFiles(folder, HISTORY_PAGE, cursor);
  const records = await Promise.all(files.map((f) => readJSON<VersionRecord>(f)));
  const items: VersionMeta[] = records.map(({ id, at, by, kind, name, claude }) => ({ id, at, by, kind, name, claude: Boolean(claude) }));
  return { items, next: next ?? null };
}

export async function findRecord(folder: Folder, id: string): Promise<VersionRecord | null> {
  // a version saved a moment ago can take a few seconds to appear in Blob's listing
  for (let attempt = 0; attempt < 4; attempt++) {
    let cursor: string | undefined;
    do {
      const page = await listFiles(folder, 1000, cursor);
      const f = page.files.find((x) => isFileOf(x, id));
      if (f) return readJSON<VersionRecord>(f);
      cursor = page.cursor;
    } while (cursor);
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

async function write(folder: Folder, rec: Omit<VersionRecord, "id" | "at">): Promise<VersionRecord> {
  const name = newFileName(folder);
  const full = { ...rec, id: name.split("/").pop()!.replace(/\.json$/, ""), at: new Date().toISOString() };
  await writeFile(name, JSON.stringify(full), "application/json");
  await waitUntilNewest(folder, full.id);
  return full;
}

// Blob's listing can take a moment to show a new file. Each save waits until its
// file shows up in the listing, so every read after it (pages rebuilt after
// Publish, the review link, the conflict check) sees the new version.
async function waitUntilNewest(folder: Folder, id: string) {
  for (let i = 0; i < 40; i++) {
    // among the newest few: someone else may have saved right after us
    const { files } = await listFiles(folder, 5);
    if (files.some((f) => isFileOf(f, id))) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`The new ${folder} file didn't appear in the store in time`);
}

export const asContent = (c: unknown) => mergeContent(defaultContent as Json, c as Json) as Content;

/** The live content and its id ("original" while nothing has been published yet). */
export async function getLive() {
  const p = await latest("published");
  return { id: p?.id ?? ORIGINAL_ID, content: asContent(p?.content), record: p };
}

/** The current draft: the newest saved draft, or the live content if there is none. */
export async function getDraft() {
  const [live, d] = await Promise.all([getLive(), latest("drafts")]);
  const usable = d && (!live.record || d.at > live.record.at);
  return {
    id: usable ? d.id : null,
    content: usable ? asContent(d.content) : live.content,
    liveId: live.id,
    live: live.content,
    claude: Boolean(usable && d.claude),
    by: usable ? d.by : null,
    copyOf: usable ? (d.copyOf ?? null) : null,
    newestId: d?.id ?? null, // the newest draft file, even one older than the live version
  };
}

/** Is this the draft someone saw (by its id)? A copy put back after a race counts as the same draft. */
export const isDraft = (d: { id: string | null; copyOf: string | null }, id: string | null | undefined) =>
  (id ?? null) === d.id || (id != null && d.copyOf === id);

export class Conflict extends Error {}

export async function saveDraft(content: Content, by: string, expectedDraftId?: string | null) {
  const cur = await getDraft();
  if (expectedDraftId !== undefined && !isDraft(cur, expectedDraftId)) throw new Conflict("draft");
  const merged = asContent(content);
  // still holds something prepared with Claude: Claude saved it, or it carries on from such a draft
  const claude = diffContent(cur.live, merged).length > 0 && (isClaude(by) || cur.claude);
  const rec = await write("drafts", { kind: "draft", by, baseId: cur.liveId, content: merged, ...(claude ? { claude } : {}) });
  if (expectedDraftId !== undefined) await settleRace(rec.id, cur.newestId);
  return rec;
}

// Two saves at the same moment can both pass the check in saveDraft. The one
// written second notices (the draft just before it isn't the one it checked
// against), puts the first one back on top as a copy, and reports a conflict:
// its person sees "Someone else changed this draft", and nothing is lost unseen.
// shortcut: a save the store hasn't listed yet (listing lag) can still slip past.
async function settleRace(id: string, checkedId: string | null) {
  const { files } = await listFiles("drafts", 10);
  const i = files.findIndex((f) => isFileOf(f, id));
  const before = files[i + 1];
  if (i < 0 || !before || (checkedId !== null && isFileOf(before, checkedId))) return;
  const first = await readJSON<VersionRecord>(before);
  await write("drafts", { kind: "draft", by: first.by, baseId: first.baseId, content: first.content, claude: first.claude, copyOf: first.copyOf ?? first.id });
  throw new Conflict("draft");
}

export async function publish(
  content: Content,
  by: string,
  expectedLiveId: string,
  opts: { force?: boolean; kind?: "publish" | "restore"; name?: string; claude?: boolean } = {},
) {
  const live = await getLive();
  if (live.id !== expectedLiveId && !opts.force) throw new Conflict("live");
  const claude = opts.claude || isClaude(by);
  return write("published", { kind: opts.kind ?? "publish", by, name: opts.name, content: asContent(content), ...(claude ? { claude } : {}) });
}

export async function ensureOriginalArchive() {
  const { files } = await listFiles("archives", 1);
  if (files.length) return;
  await write("archives", { kind: "archive", by: "Website (automatic)", name: ORIGINAL_ARCHIVE_NAME, content: defaultContent });
}

export async function archive(name: string, content: Content, by: string) {
  return write("archives", { kind: "archive", by, name, content: asContent(content) });
}
