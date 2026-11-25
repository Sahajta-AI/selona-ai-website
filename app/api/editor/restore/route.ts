import { editorRoute } from "@/lib/editor-api";
import { findRecord, getDraft, saveDraft } from "@/lib/content/versions";

// Brings back an older version as a draft, to preview and then publish.
export const POST = editorRoute(async (email, body) => {
  const folder = body.folder === "archives" ? "archives" : "published";
  const rec = await findRecord(folder, String(body.id ?? ""));
  if (!rec) return Response.json({ error: "That version couldn't be found." }, { status: 404 });
  const cur = await getDraft();
  const saved = await saveDraft(rec.content, email, cur.id);
  return { draftId: saved.id, draft: saved.content };
});
