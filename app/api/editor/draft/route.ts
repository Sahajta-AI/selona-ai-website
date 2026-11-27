import { editorRoute } from "@/lib/editor-api";
import { saveDraft } from "@/lib/content/versions";
import type { Content } from "@/lib/content/paths";

// Saves the shared draft. Nothing goes live until Publish.
export const POST = editorRoute(async (email, body) => {
  if (!body.content || typeof body.content !== "object") return Response.json({ error: "Nothing to save." }, { status: 400 });
  const saved = await saveDraft(body.content as Content, email, (body.draftId as string | null | undefined) ?? null);
  return { draftId: saved.id, savedAt: saved.at };
});
