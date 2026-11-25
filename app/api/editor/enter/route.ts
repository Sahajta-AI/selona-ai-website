import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { getEditor } from "@/lib/auth";

// Opens a site page inside the editor: Draft Mode on, then go to the page.
export async function GET(req: Request) {
  if (!(await getEditor())) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const path = new URL(req.url).searchParams.get("path") || "/";
  const safe = /^\/(?!\/)(?!api\/)(?!editor)[\w\-./]*$/.test(path) ? path : "/";
  (await draftMode()).enable();
  return NextResponse.redirect(new URL(safe, req.url), 303);
}
