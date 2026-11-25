import { editorRoute } from "@/lib/editor-api";
import { newFileName, writeFile } from "@/lib/content/store";

const MAX_BYTES = 4 * 1024 * 1024;
// Checked by the file's first bytes, not by its name.
const TYPES: { type: string; ext: string; video: boolean; test: (b: Buffer) => boolean }[] = [
  { type: "image/webp", ext: "webp", video: false, test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { type: "image/png", ext: "png", video: false, test: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { type: "image/jpeg", ext: "jpg", video: false, test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/gif", ext: "gif", video: false, test: (b) => b.subarray(0, 4).toString() === "GIF8" },
  { type: "video/mp4", ext: "mp4", video: true, test: (b) => b.subarray(4, 8).toString() === "ftyp" },
  { type: "video/webm", ext: "webm", video: true, test: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
];

// Replaces a picture or the background video: the right kind of file only, 4 MB at most.
export const POST = editorRoute(async (_email, _body, req) => {
  const form = await req.formData();
  const file = form.get("file");
  const wantVideo = form.get("kind") === "video";
  if (!(file instanceof File)) return Response.json({ error: "Please choose a file." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "That file is too big. Please use one under 4 MB." }, { status: 413 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = TYPES.find((t) => t.test(bytes));
  if (!kind || kind.video !== wantVideo)
    return Response.json({ error: wantVideo ? "Please choose a video (MP4 or WebM)." : "Please choose a picture (JPG, PNG, WebP or GIF)." }, { status: 415 });
  const saved = await writeFile(newFileName("media", kind.ext), bytes, kind.type);
  return { url: saved.url };
});
