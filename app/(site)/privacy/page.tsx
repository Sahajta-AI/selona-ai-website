import type { Metadata } from "next";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return (await getContent()).privacy.meta;
}

export default async function PrivacyPage() {
  const t = (await getContent()).privacy;
  return (
    <section className="gutter pb-24">
      <div className="mx-auto max-w-3xl pt-36 md:pt-44">
        <p className="type-eyebrow mb-4 text-action">{t.eyebrow}</p>
        <h1 className="type-display mb-3">{t.heading}</h1>
        <p className="type-body mb-10 text-body-60">{t.updated}</p>
        <p className="type-lead mb-12 text-body-60">{t.intro}</p>

        <div className="flex flex-col gap-10">
          {t.sections.map((section, si) => (
            <section key={si} className="border-t border-line pt-8">
              <h2 className="type-h3 mb-3 text-ink-deep">{section.heading}</h2>
              {section.paragraphs.map((paragraph, pi) => (
                <p
                  key={pi}
                  className="type-body mb-3 text-body-60"
                >
                  {paragraph}
                </p>
              ))}
              {section.list.length > 0 && (
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  {section.list.map((item, li) => (
                    <li key={li} className="type-body text-body-60">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
