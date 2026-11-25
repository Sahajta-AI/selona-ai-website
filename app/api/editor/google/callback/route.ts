import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { googleEnabled, isAllowed, sessionCookie } from "@/lib/auth";
import { safeNext } from "@/lib/editor-redirect";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const fail = () => NextResponse.redirect(new URL("/editor/sign-in?e=google", url), 303);
  const state = jar.get("selona_oauth_state")?.value;
  if (!googleEnabled() || !state || state !== url.searchParams.get("state") || !url.searchParams.get("code")) return fail();

  // Server-to-server code exchange; the token comes straight from Google over TLS.
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: url.searchParams.get("code")!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${url.origin}/api/editor/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail();
  const { access_token } = await tokenRes.json();
  const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
  if (!userRes.ok) return fail();
  const { email, email_verified } = await userRes.json();
  if (!email || email_verified !== true || !isAllowed(email)) return NextResponse.redirect(new URL("/editor/no-access", url), 303);

  const res = NextResponse.redirect(new URL(safeNext(jar.get("selona_oauth_next")?.value), url), 303);
  res.cookies.set(sessionCookie(email));
  res.cookies.delete({ name: "selona_oauth_state", path: "/api/editor/google" });
  res.cookies.delete({ name: "selona_oauth_next", path: "/api/editor/google" });
  return res;
}
