import { editorRoute } from "@/lib/editor-api";
import { ensureOriginalArchive, listRecords } from "@/lib/content/versions";

// History (every published version) and the saved whole-site versions.
export const GET = editorRoute(async () => {
  await ensureOriginalArchive();
  const [published, archives] = await Promise.all([listRecords("published", 100), listRecords("archives", 100)]);
  const meta = ({ id, at, by, kind, name }: { id: string; at: string; by: string; kind: string; name?: string }) => ({ id, at, by, kind, name });
  return { published: published.map(meta), archives: archives.map(meta) };
});
