import { editorRoute } from "@/lib/editor-api";
import { undoLastPublish } from "@/lib/content/actions";

// One step: puts the website back to how it was before the latest publish.
// The undo is itself a new version; nothing is deleted.
export const POST = editorRoute(async (email, body) => {
  const live = await undoLastPublish(email, String(body.id ?? ""));
  return { liveId: live.id, liveAt: live.at };
});
