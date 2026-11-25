import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  (await draftMode()).disable();
  const res = NextResponse.redirect(new URL("/editor/sign-in", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
