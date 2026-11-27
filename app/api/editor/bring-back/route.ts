import { editorRoute } from "@/lib/editor-api";
import { bringBackArchive } from "@/lib/content/actions";

// One step: puts a saved whole-site version live again (as a new version; nothing is deleted).
export const POST = editorRoute(async (email, body) => {
  const out = await bringBackArchive(email, String(body.id ?? ""), { liveId: String(body.liveId ?? ""), force: body.force === true });
  if (!out) return Response.json({ error: "That version couldn't be found." }, { status: 404 });
  return { liveId: out.live.id, liveAt: out.live.at };
});
