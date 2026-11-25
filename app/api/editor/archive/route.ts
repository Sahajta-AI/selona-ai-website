import { editorRoute } from "@/lib/editor-api";
import { archive, getLive } from "@/lib/content/versions";

// Saves the whole live site under a name, to bring back later in one step.
export const POST = editorRoute(async (email, body) => {
  const name = String(body.name ?? "").trim().slice(0, 120);
  if (!name) return Response.json({ error: "Please give this version a name." }, { status: 400 });
  const rec = await archive(name, (await getLive()).content, email);
  return { id: rec.id, at: rec.at, name: rec.name };
});
