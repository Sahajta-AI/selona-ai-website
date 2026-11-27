import "server-only";
import { requireEditor } from "@/lib/auth";
import { Conflict } from "@/lib/content/versions";
import { NothingToDo } from "@/lib/content/actions";
export { refreshSite } from "@/lib/content/actions";

/** Wraps an editor API route: signed-in editors only, JSON in and out, plain-words errors. */
export function editorRoute(handler: (email: string, body: Record<string, unknown>, req: Request) => Promise<Response | object>) {
  return async (req: Request) => {
    const auth = await requireEditor();
    if ("response" in auth) return auth.response;
    let body: Record<string, unknown> = {};
    if (req.method !== "GET" && req.headers.get("content-type")?.includes("application/json")) {
      const text = await req.text();
      if (text.length > 2_000_000) return Response.json({ error: "That change is too big to save." }, { status: 413 });
      try {
        body = JSON.parse(text || "{}");
      } catch {
        return Response.json({ error: "Something went wrong. Please try again." }, { status: 400 });
      }
    }
    try {
      const out = await handler(auth.email, body, req);
      return out instanceof Response ? out : Response.json(out);
    } catch (err) {
      if (err instanceof Conflict) return Response.json({ conflict: err.message }, { status: 409 });
      if (err instanceof NothingToDo) return Response.json({ error: err.message }, { status: 400 });
      console.error("Editor error:", (err as Error).message);
      return Response.json({ error: "We couldn't save that just now. Please try again in a minute." }, { status: 503 });
    }
  };
}

