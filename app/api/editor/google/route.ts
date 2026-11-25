import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { googleEnabled } from "@/lib/auth";
import { safeNext } from "@/lib/editor-redirect";

// Google sign-in (switches on once GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET exist).
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleEnabled()) return NextResponse.redirect(new URL("/editor/sign-in", url), 303);
  const state = randomBytes(24).toString("base64url");
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${url.origin}/api/editor/google/callback`,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  }).toString();
  const res = NextResponse.redirect(auth, 303);
  const cookie = { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax" as const, path: "/api/editor/google", maxAge: 600 };
  res.cookies.set("selona_oauth_state", state, cookie);
  res.cookies.set("selona_oauth_next", safeNext(url.searchParams.get("next")), cookie);
  return res;
}
