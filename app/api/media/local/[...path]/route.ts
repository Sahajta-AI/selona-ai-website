import { readLocalFile } from "@/lib/content/store";

// Local development and tests only: serves files saved to the on-disk store.
// On Vercel the store is Blob and this always answers 404.
const TYPES: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", gif: "image/gif", mp4: "video/mp4", webm: "video/webm", json: "application/json" };
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const pathname = (await params).path.join("/");
  if (pathname.endsWith(".json")) return new Response("Not found", { status: 404 });
  const data = await readLocalFile(pathname);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), { headers: { "Content-Type": TYPES[pathname.split(".").pop()!] ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
}
