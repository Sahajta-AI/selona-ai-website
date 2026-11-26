import Link from "next/link";

export default function NoAccess() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 py-16">
      <h1 className="type-h2 text-ink-deep">You don&apos;t have access</h1>
      <p className="text-body-60">This page is only for the people who look after the Selona website.</p>
      <Link href="/" className="text-action underline underline-offset-4">Go to the website</Link>
    </main>
  );
}
