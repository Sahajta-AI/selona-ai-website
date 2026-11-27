import { editorRoute } from "@/lib/editor-api";
import { ensureOriginalArchive, historyPage } from "@/lib/content/versions";

// History (every published version) and the saved whole-site versions, 20 at a time.
// ?folder=published|archives&cursor=… loads the next 20 of one list.
export const GET = editorRoute(async (_email, _body, req) => {
  const q = new URL(req.url).searchParams;
  const folder = q.get("folder");
  if (folder === "published" || folder === "archives") return historyPage(folder, q.get("cursor") || undefined);
  await ensureOriginalArchive();
  const [published, archives] = await Promise.all([historyPage("published"), historyPage("archives")]);
  return { published: published.items, publishedNext: published.next, archives: archives.items, archivesNext: archives.next };
});
