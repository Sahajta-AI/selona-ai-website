import { NextResponse } from "next/server";
import { accessKeysEnabled, checkAccessKey, clientAddress, isAllowed, recordFailure, sessionCookie, tooManyFailures } from "@/lib/auth";
import { safeNext } from "@/lib/editor-redirect";

// Backup sign-in: email + personal access key (only its hash is stored).
export async function POST(req: Request) {
  const back = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);
  if (!accessKeysEnabled()) return back("/editor/sign-in");
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 200);
  const key = String(form.get("key") || "").slice(0, 200);
  const ip = await clientAddress();
  if (await tooManyFailures(email, ip)) return back("/editor/sign-in?e=locked");
  if (!checkAccessKey(email, key)) {
    await recordFailure(email, ip);
    return back(email && !isAllowed(email) ? "/editor/no-access" : "/editor/sign-in?e=wrong");
  }
  const res = back(safeNext(String(form.get("next") || "")));
  res.cookies.set(sessionCookie(email));
  return res;
}
