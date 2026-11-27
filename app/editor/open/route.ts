import { NextResponse } from "next/server";
import { getEditor, readLinkTicket, sessionCookie } from "@/lib/auth";
import { safeNext } from "@/lib/editor-redirect";

// Review links from the Claude connector: /editor/open?t=<ticket>&next=/editor?review=1…
// The ticket (signed, 24 hours, one person) signs that person in, so a link opened
// in another browser or window goes straight to the changes. Someone already
// signed in just carries on as themselves.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, url), 303);
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("Cache-Control", "no-store");
    return res;
  };
  if (await getEditor()) return go(next);
  const email = readLinkTicket(url.searchParams.get("t"));
  if (!email) return go(`/editor/sign-in?e=link&next=${encodeURIComponent(next)}`);
  const res = go(next);
  res.cookies.set(sessionCookie(email));
  return res;
}
