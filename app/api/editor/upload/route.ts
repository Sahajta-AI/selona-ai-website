import { editorRoute } from "@/lib/editor-api";
import { MAX_MEDIA_BYTES, MediaProblem, saveMedia } from "@/lib/media";

// Replaces a picture or the background video: the right kind of file only, 4 MB at most.
export const POST = editorRoute(async (_email, _body, req) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Please choose a file." }, { status: 400 });
  if (file.size > MAX_MEDIA_BYTES) return Response.json({ error: "That file is too big. Please use one under 4 MB." }, { status: 413 });
  try {
    return { url: await saveMedia(Buffer.from(await file.arrayBuffer()), form.get("kind") === "video") };
  } catch (err) {
    if (err instanceof MediaProblem) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
});
