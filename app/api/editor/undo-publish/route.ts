import { editorRoute, refreshSite } from "@/lib/editor-api";
import { asContent, Conflict, listRecords, publish, saveDraft } from "@/lib/content/versions";

// One step: puts the website back to how it was before the latest publish.
// The undo is itself a new version; nothing is deleted.
export const POST = editorRoute(async (email, body) => {
  const [latest, before] = await listRecords("published", 2);
  if (!latest) return Response.json({ error: "Nothing has been published from the editor yet, so there's nothing to undo." }, { status: 400 });
  // only undo the publish the person is looking at, never one that landed since
  if (latest.id !== String(body.id ?? "")) throw new Conflict("live");
  const live = await publish(asContent(before?.content), email, latest.id, { kind: "restore", name: "Undid the last publish" });
  await saveDraft(live.content, email);
  refreshSite();
  return { liveId: live.id, liveAt: live.at };
});
