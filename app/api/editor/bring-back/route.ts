import { editorRoute, refreshSite } from "@/lib/editor-api";
import { findRecord, publish, saveDraft } from "@/lib/content/versions";

// One step: puts a saved whole-site version live again (as a new version; nothing is deleted).
export const POST = editorRoute(async (email, body) => {
  const rec = await findRecord("archives", String(body.id ?? ""));
  if (!rec) return Response.json({ error: "That version couldn't be found." }, { status: 404 });
  const live = await publish(rec.content, email, String(body.liveId ?? ""), { force: body.force === true, kind: "restore", name: `Brought back: ${rec.name}` });
  await saveDraft(live.content, email);
  refreshSite();
  return { liveId: live.id, liveAt: live.at };
});
