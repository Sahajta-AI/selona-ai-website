import "server-only";
import { lookup } from "dns/promises";
import { BlockList, isIP } from "net";
import { newFileName, writeFile } from "@/lib/content/store";

// Pictures and videos for the website: checked by their first bytes, not their name.
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;
const TYPES: { type: string; ext: string; video: boolean; test: (b: Buffer) => boolean }[] = [
  { type: "image/webp", ext: "webp", video: false, test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { type: "image/png", ext: "png", video: false, test: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { type: "image/jpeg", ext: "jpg", video: false, test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/gif", ext: "gif", video: false, test: (b) => b.subarray(0, 4).toString() === "GIF8" },
  { type: "video/mp4", ext: "mp4", video: true, test: (b) => b.subarray(4, 8).toString() === "ftyp" },
  { type: "video/webm", ext: "webm", video: true, test: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
];

export class MediaProblem extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Checks the file is the right kind and size, then stores it. Returns its address. */
export async function saveMedia(bytes: Buffer, wantVideo: boolean) {
  if (bytes.length === 0) throw new MediaProblem("That file is empty.");
  if (bytes.length > MAX_MEDIA_BYTES) throw new MediaProblem("That file is too big. Please use one under 4 MB.", 413);
  const kind = TYPES.find((t) => t.test(bytes));
  if (!kind || kind.video !== wantVideo)
    throw new MediaProblem(wantVideo ? "Please choose a video (MP4 or WebM)." : "Please choose a picture (JPG, PNG, WebP or GIF).", 415);
  const saved = await writeFile(newFileName("media", kind.ext), bytes, kind.type);
  return saved.url;
}

// Addresses that must never be fetched from the server (its own network, cloud
// metadata). BlockList also checks IPv6 forms of IPv4 addresses (::ffff:10.0.0.1).
const PRIVATE = new BlockList();
for (const [net, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["224.0.0.0", 3]] as const)
  PRIVATE.addSubnet(net, bits, "ipv4");
for (const [net, bits] of [["::", 96], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const) PRIVATE.addSubnet(net, bits, "ipv6");
const isPrivateAddress = (ip: string) => PRIVATE.check(ip, isIP(ip) === 6 ? "ipv6" : "ipv4");

async function checkAddress(url: URL) {
  if (url.protocol !== "https:") throw new MediaProblem("Please use a web address that starts with https://.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local"))
    throw new MediaProblem("That address can't be used.");
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (!ips.length) throw new MediaProblem("That web address couldn't be reached.");
  if (ips.some(isPrivateAddress)) throw new MediaProblem("That address can't be used.");
}

/** Downloads a picture or video from a public https address (at most 4 MB, 3 redirects, 15 seconds). */
export async function fetchMedia(address: string): Promise<Buffer> {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    throw new MediaProblem("That isn't a web address.");
  }
  for (let hop = 0; hop < 4; hop++) {
    await checkAddress(url);
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { Accept: "image/*,video/*" } }).catch(() => null);
    if (!res) throw new MediaProblem("That web address couldn't be reached.");
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok || !res.body) throw new MediaProblem(`That web address answered with an error (${res.status}).`);
    if (Number(res.headers.get("content-length") || 0) > MAX_MEDIA_BYTES) throw new MediaProblem("That file is too big. Please use one under 4 MB.", 413);
    const chunks: Buffer[] = [];
    let size = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_MEDIA_BYTES) {
        await reader.cancel();
        throw new MediaProblem("That file is too big. Please use one under 4 MB.", 413);
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  throw new MediaProblem("That web address redirects too many times.");
}
