import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { asContent, Conflict, findRecord, getDraft, getLive, listRecords, publish, saveDraft } from "./versions";
import { diffContent } from "./paths";

// The actions that change the live website, shared by the editor and the Claude
// connector so both follow exactly the same rules. Nothing is ever deleted: each
// one writes a new version.

/** After a change goes live: every page shows it on its next visit, no redeploy. */
export function refreshSite() {
  revalidateTag("content", { expire: 0 });
  revalidatePath("/", "layout");
}

/**
 * Puts the shared draft live.
 * draftId: the draft the person has seen. If the draft changed since (someone else,
 *   or Claude), it is refused, so nothing unseen goes live. undefined skips the check.
 * liveId: the live version the person started from; refused if someone published
 *   since, unless force.
 */
export async function publishDraft(by: string, opts: { draftId?: string | null; liveId: string; force?: boolean; note?: string }) {
  const draft = await getDraft();
  if (opts.draftId !== undefined && (opts.draftId ?? null) !== draft.id) throw new Conflict("draft");
  const rec = await publish(draft.content, by, opts.liveId, { force: opts.force, name: opts.note, claude: draft.claude });
  await saveDraft(rec.content, by); // the draft now matches what's live
  refreshSite();
  return rec;
}

export class NothingToDo extends Error {}

/** Puts the website back to how it was before the latest publish (id = that publish). */
export async function undoLastPublish(by: string, id: string) {
  const [latest, before] = await listRecords("published", 2);
  if (!latest) throw new NothingToDo("Nothing has been published from the editor yet, so there's nothing to undo.");
  // only undo the publish the person is looking at, never one that landed since
  if (latest.id !== id) throw new Conflict("live");
  const live = await publish(asContent(before?.content), by, latest.id, { kind: "restore", name: "Undid the last publish" });
  await saveDraft(live.content, by);
  refreshSite();
  return live;
}

/** Puts a saved whole-site version live again. liveId: as for publishDraft. */
export async function bringBackArchive(by: string, id: string, opts: { liveId: string; force?: boolean }) {
  const rec = await findRecord("archives", id);
  if (!rec) return null;
  const live = await publish(rec.content, by, opts.liveId, { force: opts.force, kind: "restore", name: `Brought back: ${rec.name}` });
  await saveDraft(live.content, by);
  refreshSite();
  return { live, name: rec.name };
}

/** What is waiting to go live: the draft compared with the live website. */
export async function pendingChanges() {
  const draft = await getDraft();
  return { draft, changes: diffContent(draft.live, draft.content) };
}

export { getLive };
