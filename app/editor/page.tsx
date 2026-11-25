import { redirect } from "next/navigation";
import { getEditor } from "@/lib/auth";

export default async function EditorHome() {
  const email = await getEditor();
  if (!email) redirect("/editor/sign-in");
  return (
    <main className="p-8">
      <p>Signed in as {email}.</p>
      <form method="post" action="/api/editor/sign-out">
        <button type="submit" className="underline">Sign out</button>
      </form>
    </main>
  );
}
