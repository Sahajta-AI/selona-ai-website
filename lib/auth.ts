import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { listFiles, newFileName, writeFile } from "@/lib/content/store";

// Who may use the editor: EDITOR_ALLOWED_EMAILS (comma separated). Sessions are
// signed with EDITOR_SESSION_SECRET and last 30 days, so people sign in once
// (owner's decision, 27 Nov). Removing an email from the list ends that person's
// access at once, even with a session cookie; changing EDITOR_SESSION_SECRET signs
// everyone out.
export const SESSION_COOKIE = "selona_editor";
const SESSION_HOURS = 30 * 24;
// Review links from the Claude connector sign the person in for this long.
const LINK_HOURS = 24;

export const allowedEmails = () =>
  (process.env.EDITOR_ALLOWED_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const isAllowed = (email: string) => allowedEmails().includes(email.trim().toLowerCase());

const secret = () => process.env.EDITOR_SESSION_SECRET || "";
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function makeSessionValue(email: string) {
  const body = b64(JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + SESSION_HOURS * 3600_000 }));
  return `${body}.${sign(body)}`;
}

// A signed value carries a purpose ("p"), so a review-link ticket can never be
// used as a session cookie, or the other way round.
function readSigned(value: string | undefined, purpose: string | undefined): string | null {
  if (!value || secret().length < 32) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac || !safeEqual(mac, sign(body))) return null;
  try {
    const { email, exp, p } = JSON.parse(Buffer.from(body, "base64url").toString());
    return p === purpose && typeof email === "string" && exp > Date.now() && isAllowed(email) ? email : null;
  } catch {
    return null;
  }
}

export const readSessionValue = (value: string | undefined) => readSigned(value, undefined);

/** A ticket inside a review link from Claude: opens the editor signed in as that person, for 24 hours. */
export function makeLinkTicket(email: string) {
  const body = b64(JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + LINK_HOURS * 3600_000, p: "link" }));
  return `${body}.${sign(body)}`;
}
export const readLinkTicket = (value: string | undefined | null) => readSigned(value ?? undefined, "link");

/** The signed-in editor's email, or null. Checked on the server for every editor page and API call. */
export async function getEditor(): Promise<string | null> {
  return readSessionValue((await cookies()).get(SESSION_COOKIE)?.value);
}

export const sessionCookie = (email: string) => ({
  name: SESSION_COOKIE,
  value: makeSessionValue(email),
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" && !process.env.EDITOR_LOCAL_HTTP,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
});

export const signInReady = () => secret().length >= 32 && allowedEmails().length > 0;
export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) && signInReady();
// Backup sign-in with a personal access key: off unless switched on.
export const accessKeysEnabled = () => process.env.EDITOR_ACCESS_KEYS_ENABLED === "true" && signInReady();

export const hashKey = (key: string) => createHash("sha256").update(key.trim()).digest("hex");
export const newAccessKey = () => randomBytes(32).toString("base64url");

/** EDITOR_ACCESS_KEY_HASHES = "email:sha256hex,email:sha256hex" (only hashes are ever stored). */
export function checkAccessKey(email: string, key: string) {
  const want = (process.env.EDITOR_ACCESS_KEY_HASHES || "")
    .split(",")
    .map((p) => p.trim().split(":"))
    .find(([e]) => e?.toLowerCase() === email.trim().toLowerCase())?.[1];
  return Boolean(want) && isAllowed(email) && safeEqual(hashKey(key), want!);
}

// Limited attempts: failed sign-ins are recorded in the store (shared by all
// server instances). 5 failures in 15 minutes block that email from that network
// address; 20 block the address. An email is never blocked everywhere, so a stranger
// who knows it can't lock its owner out (keys are 256-bit, so guessing isn't the
// risk). If the store can't be reached, sign-in is refused (fails closed).
const WINDOW_MS = 15 * 60_000;
const tag = (s: string) => createHash("sha256").update(s.toLowerCase()).digest("hex").slice(0, 24);
const folders = (email: string, ip: string) => [
  { folder: `auth-fails/e-${tag(`${email}|${ip}`)}`, max: 5 },
  { folder: `auth-fails/i-${tag(ip)}`, max: 20 },
];

export async function clientAddress() {
  return ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

export async function tooManyFailures(email: string, ip: string) {
  const results = await Promise.all(
    folders(email, ip).map(async ({ folder, max }) => {
      const { files } = await listFiles(folder, max);
      // newest first; each file name starts with an inverted timestamp
      const recent = files.filter((f) => Date.now() - (9999999999999 - Number(f.pathname.split("/").pop()!.slice(0, 13))) < WINDOW_MS);
      return recent.length >= max;
    }),
  );
  return results.some(Boolean);
}

export async function recordFailure(email: string, ip: string) {
  await Promise.all(folders(email, ip).map(({ folder }) => writeFile(newFileName(folder), "{}", "application/json")));
}

/** For API routes: the signed-in editor's email, or a 401 response to return. */
export async function requireEditor(): Promise<{ email: string } | { response: Response }> {
  const email = await getEditor();
  return email ? { email } : { response: Response.json({ error: "Please sign in again." }, { status: 401 }) };
}
