import "server-only";
import { listFiles, newFileName, readJSON, writeFile, type StoredFile } from "./store";
import { defaultContent, mergeContent, type Content, type Json } from "./paths";

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
  content: Content;
};
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

export async function findRecord(folder: Folder, id: string): Promise<VersionRecord | null> {
  let cursor: string | undefined;
  do {
    const page = await listFiles(folder, 1000, cursor);
    const f = page.files.find((x) => isFileOf(x, id));
    if (f) return readJSON<VersionRecord>(f);
    cursor = page.cursor;
  } while (cursor);
  return null;
}

async function write(folder: Folder, rec: Omit<VersionRecord, "id" | "at">): Promise<VersionRecord> {
  const name = newFileName(folder);
  const full = { ...rec, id: name.split("/").pop()!.replace(/\.json$/, ""), at: new Date().toISOString() };
  await writeFile(name, JSON.stringify(full), "application/json");
  return full;
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
  return { id: usable ? d.id : null, content: usable ? asContent(d.content) : live.content, liveId: live.id, live: live.content };
}

export class Conflict extends Error {}

export async function saveDraft(content: Content, by: string, expectedDraftId?: string | null) {
  const cur = await getDraft();
  if (expectedDraftId !== undefined && cur.id !== expectedDraftId) throw new Conflict("draft");
  return write("drafts", { kind: "draft", by, baseId: cur.liveId, content: asContent(content) });
}

export async function publish(content: Content, by: string, expectedLiveId: string, opts: { force?: boolean; kind?: "publish" | "restore"; name?: string } = {}) {
  const live = await getLive();
  if (live.id !== expectedLiveId && !opts.force) throw new Conflict("live");
  return write("published", { kind: opts.kind ?? "publish", by, name: opts.name, content: asContent(content) });
}

export async function ensureOriginalArchive() {
  const { files } = await listFiles("archives", 1);
  if (files.length) return;
  await write("archives", { kind: "archive", by: "Website (automatic)", name: ORIGINAL_ARCHIVE_NAME, content: defaultContent });
}

export async function archive(name: string, content: Content, by: string) {
  return write("archives", { kind: "archive", by, name, content: asContent(content) });
}
