import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return (await getContent()).security.meta;
}

export default async function SecurityPage() {
  const c = await getContent();
  const t = c.security;
  const site = c.shared.contact;
  return (
    <section className="gutter pb-24">
      <PageHeader
        eyebrow={t.eyebrow}
        heading={t.heading}
        sub={t.sub}
      />

      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
        {t.sections.map((section, index) => (
          <Reveal
            key={index}
            delay={index * 55}
            className="rounded-lg border border-line bg-paper p-6 md:p-7"
          >
            <h2 className="type-h3 mb-3 text-ink-deep">{section.heading}</h2>
            <p className="type-body text-body-60">{section.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-3xl rounded-lg bg-mist px-6 py-6 text-center md:px-8">
        <p className="type-body text-body-60">
          {t.contactLine}{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-medium text-action hover:text-sky"
          >
            {site.email}
          </a>
          .
        </p>
      </Reveal>
    </section>
  );
}
