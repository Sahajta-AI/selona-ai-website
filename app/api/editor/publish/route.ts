import { editorRoute } from "@/lib/editor-api";
import { publishDraft } from "@/lib/content/actions";

// Puts the saved draft live. Warns (409) if someone else published after this
// editor was opened, unless "force" says to publish anyway.
// Only the draft this editor has seen goes live: if the shared draft changed since
// (another editor, or a change prepared from Claude), it refuses with a draft
// conflict so nothing unreviewed is published. "force" never skips this check.
export const POST = editorRoute(async (email, body) => {
  const rec = await publishDraft(email, {
    draftId: "draftId" in body ? ((body.draftId as string | null) ?? null) : undefined,
    liveId: String(body.liveId ?? ""),
    force: body.force === true,
    note: typeof body.note === "string" ? body.note.slice(0, 200) : undefined,
  });
  return { liveId: rec.id, liveAt: rec.at };
});
