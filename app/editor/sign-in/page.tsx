import { redirect } from "next/navigation";
import { accessKeysEnabled, getEditor, googleEnabled } from "@/lib/auth";
import { safeNext } from "@/lib/editor-redirect";

const messages: Record<string, string> = {
  wrong: "That email and access key don't match. Please check them and try again.",
  locked: "Too many tries. Please wait 15 minutes and try again.",
  google: "Signing in with Google didn't work. Please try again.",
  expired: "You were signed out. Please sign in again.",
  link: "That link from Claude has expired (they last 24 hours). Please sign in, and you'll go straight to the changes.",
};

export default async function SignIn({ searchParams }: { searchParams: Promise<{ e?: string; next?: string }> }) {
  const { e, next } = await searchParams;
  if (await getEditor()) redirect(safeNext(next));
  const google = googleEnabled();
  const keys = accessKeysEnabled();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-3">
        <img src="/brand/selona-logo-official.svg" alt="Selona" className="h-7 w-auto self-start" />
        <h1 className="type-h2 text-ink-deep">Edit the Selona website</h1>
        <p className="text-body-60">Change the words and pictures on your website. Nothing goes live until you press Publish.</p>
      </div>
      {e && messages[e] ? (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {messages[e]}
        </p>
      ) : null}
      {google ? (
        <a
          href={`/api/editor/google${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-ink-deep px-6 text-base font-medium text-white hover:bg-ink"
        >
          Sign in with Google
        </a>
      ) : null}
      {keys ? (
        <form method="post" action="/api/editor/sign-in" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(13,22,48,0.08)]">
          <p className="text-sm text-body-60">{google ? "Or use your personal access key:" : "Sign in with your email and personal access key:"}</p>
          <input type="hidden" name="next" value={next ?? ""} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input name="email" type="email" required autoComplete="email" className="min-h-[46px] rounded-xl border border-line px-3 font-normal focus:outline-none focus:ring-2 focus:ring-action/30" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Access key
            <input name="key" type="password" required autoComplete="current-password" className="min-h-[46px] rounded-xl border border-line px-3 font-normal focus:outline-none focus:ring-2 focus:ring-action/30" />
          </label>
          <button type="submit" className="min-h-[48px] rounded-full bg-ink-deep px-6 text-base font-medium text-white hover:bg-ink">
            Sign in
          </button>
        </form>
      ) : null}
      {!google && !keys ? (
        <p className="text-body-60">Signing in isn&apos;t switched on yet. Please ask Pranamya to finish the set-up.</p>
      ) : null}
    </main>
  );
}
