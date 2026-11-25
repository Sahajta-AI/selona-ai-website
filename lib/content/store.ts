import "server-only";
import { put, list, get } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

// Every write is a new file (nothing is ever overwritten or deleted), named so
// that the newest file of a folder sorts first: list(limit 1) = latest.
// Preview and production keep their files apart under their own prefix.
const env = process.env.CONTENT_ENV || process.env.VERCEL_ENV || "development";
const prefix = `selona-content/${env}/`;
// Blob auth: Vercel's short-lived OIDC identity + BLOB_STORE_ID (no long-lived secret), or a read-write token.
const useBlob = Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
// shortcut: local disk store for development and local tests only; Vercel always uses Blob
const localDir = path.join(process.cwd(), ".content-store");

export type StoredFile = { pathname: string; url: string; uploadedAt: string };

export function newFileName(folder: string, ext = "json") {
  const inverted = String(9999999999999 - Date.now()).padStart(13, "0");
  return `${folder}/${inverted}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

export async function writeFile(name: string, body: string | Buffer, contentType: string): Promise<StoredFile> {
  if (!useBlob) {
    if (process.env.VERCEL) throw new Error("Content store is not connected");
    const file = path.join(localDir, prefix, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
    return { pathname: prefix + name, url: `/api/editor/local-file/${prefix}${name}`, uploadedAt: new Date().toISOString() };
  }
  // Random suffix: file addresses can't be guessed; listing needs the server token.
  const r = await put(prefix + name, body, { access: "public", contentType, addRandomSuffix: true });
  return { pathname: r.pathname, url: r.url, uploadedAt: new Date().toISOString() };
}

export async function listFiles(folder: string, limit = 1000, cursor?: string) {
  if (!useBlob) {
    const dir = path.join(localDir, prefix, folder);
    const names = (await fs.readdir(dir).catch(() => [] as string[])).sort();
    const start = cursor ? Number(cursor) : 0;
    const files = names.slice(start, start + limit).map((n) => ({
      pathname: `${prefix}${folder}/${n}`,
      url: `/api/editor/local-file/${prefix}${folder}/${n}`,
      uploadedAt: "",
    }));
    const next = start + limit;
    return { files, cursor: next < names.length ? String(next) : undefined };
  }
  const r = await list({ prefix: `${prefix}${folder}/`, limit, cursor });
  return {
    files: r.blobs.map((b) => ({ pathname: b.pathname, url: b.url, uploadedAt: b.uploadedAt.toISOString() })),
    cursor: r.hasMore ? r.cursor : undefined,
  };
}

export async function readJSON<T>(file: StoredFile): Promise<T> {
  if (!useBlob) return JSON.parse(await fs.readFile(path.join(localDir, file.pathname), "utf8"));
  const r = await get(file.url, { access: "public" });
  if (!r || r.statusCode !== 200 || !r.stream) throw new Error(`Could not read ${file.pathname}`);
  return JSON.parse(await new Response(r.stream).text());
}

export async function readLocalFile(pathname: string) {
  if (useBlob || process.env.VERCEL || !pathname.startsWith(prefix) || pathname.includes("..")) return null;
  return fs.readFile(path.join(localDir, pathname)).catch(() => null);
}
