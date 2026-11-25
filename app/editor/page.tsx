import { redirect } from "next/navigation";
import { getEditor } from "@/lib/auth";
import { ensureOriginalArchive, getDraft, latest } from "@/lib/content/versions";
import { PAGES } from "@/lib/content/paths";
import { EditorApp } from "@/components/editor/EditorApp";

export default async function EditorHome({ searchParams }: { searchParams: Promise<{ path?: string; review?: string }> }) {
  const email = await getEditor();
  if (!email) redirect("/editor/sign-in");
  const { path, review } = await searchParams;
  try {
    await ensureOriginalArchive();
    const [draft, live] = await Promise.all([getDraft(), latest("published")]);
    const startPath = Object.values(PAGES).some((p) => p.path === path) ? path! : "/";
    return (
      <EditorApp
        initial={{ email, draft: draft.content, draftId: draft.id, live: draft.live, liveId: draft.liveId, liveAt: live?.at ?? null, liveBy: live?.by ?? null }}
        startPath={startPath}
        startTab={review ? "changes" : "page"}
      />
    );
  } catch (err) {
    console.error("Editor could not load:", (err as Error).message);
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="type-h2 text-ink-deep">The editor can&apos;t open right now</h1>
        <p className="text-body-60">The place where the website&apos;s words are kept isn&apos;t answering. The website itself is fine. Please try again in a few minutes.</p>
        <form method="post" action="/api/editor/sign-out">
          <button type="submit" className="btn-ed">Sign out</button>
        </form>
      </main>
    );
  }
}
