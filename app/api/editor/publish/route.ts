import { editorRoute, refreshSite } from "@/lib/editor-api";
import { getDraft, publish, saveDraft } from "@/lib/content/versions";

// Puts the saved draft live. Warns (409) if someone else published after this
// editor was opened, unless "force" says to publish anyway.
export const POST = editorRoute(async (email, body) => {
  const draft = await getDraft();
  const rec = await publish(draft.content, email, String(body.liveId ?? ""), { force: body.force === true, name: typeof body.note === "string" ? body.note.slice(0, 200) : undefined });
  await saveDraft(rec.content, email); // the draft now matches what's live
  refreshSite();
  return { liveId: rec.id, liveAt: rec.at };
});
