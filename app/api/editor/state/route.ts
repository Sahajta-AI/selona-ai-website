import { editorRoute } from "@/lib/editor-api";
import { ensureOriginalArchive, getDraft, latest } from "@/lib/content/versions";

// What the editor starts from: the shared draft, the live version and who published it.
export const GET = editorRoute(async (email) => {
  await ensureOriginalArchive();
  const [draft, live] = await Promise.all([getDraft(), latest("published")]);
  return { email, draft: draft.content, draftId: draft.id, live: draft.live, liveId: draft.liveId, liveAt: live?.at ?? null, liveBy: live?.by ?? null, draftClaude: draft.claude };
});
