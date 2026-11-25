import Link from "next/link";
import { PrimaryButton } from "@/components/Buttons";
import { getContent } from "@/lib/content";
import { SiteChrome } from "@/components/SiteChrome";

export default async function NotFound() {
  const t = (await getContent()).notFound;
  return (
    <SiteChrome>
    <section className="gutter flex min-h-[70vh] flex-col items-center justify-center gap-6 pt-28 text-center">
      <p className="type-eyebrow text-ink">{t.code}</p>
      <h1 className="type-display max-w-xl">{t.heading}</h1>
      <p className="type-lead max-w-md text-body-60">{t.body}</p>
      <div className="flex items-center gap-4">
        <PrimaryButton href="/">{t.home}</PrimaryButton>
        <Link
          href="/contact"
          className="text-sm font-medium text-action hover:text-sky"
        >
          {t.contact}
        </Link>
      </div>
    </section>
    </SiteChrome>
  );
}
