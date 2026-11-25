import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { Faq } from "@/components/Faq";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return (await getContent()).contact.meta;
}

export default async function ContactPage() {
  const c = await getContent();
  const contactIntro = c.contact;
  const site = c.shared.contact;
  return (
    <>
      <section className="gutter">
        <PageHeader
          eyebrow={contactIntro.eyebrow}
          heading={contactIntro.heading}
          sub={contactIntro.sub}
        />

        <div className="mx-auto grid max-w-5xl gap-8 pb-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="flex flex-col gap-5 rounded-lg border border-line bg-tint/60 p-6 md:p-8">
            <h2 className="type-h3 text-ink-deep">{contactIntro.coverTitle}</h2>
            <ul className="flex flex-col gap-3 text-body-60">
              {contactIntro.coverItems.map((item, i) => (
                <li key={i} className="type-body">{item}</li>
              ))}
            </ul>
            <p className="type-body text-body-60">
              {site.enquiriesLabel}{" "}
              <a
                href={`mailto:${site.email}`}
                className="inline-flex min-h-[44px] min-w-[44px] items-center align-middle text-action hover:text-sky"
              >
                {site.email}
              </a>
            </p>
          </Reveal>

          <Reveal className="rounded-lg border border-line bg-paper p-6 md:p-8">
            <ContactForm
              submitLabel={contactIntro.submit}
              messages={c.shared.form}
              email={site.email}
              fields={[
                { name: "name", label: contactIntro.labels.name, autoComplete: "name" },
                {
                  name: "email",
                  label: contactIntro.labels.email,
                  type: "email",
                  autoComplete: "email",
                },
                {
                  name: "company",
                  label: contactIntro.labels.company,
                  autoComplete: "organization",
                },
                {
                  name: "role",
                  label: contactIntro.labels.role,
                  autoComplete: "organization-title",
                },
                {
                  name: "workflow",
                  label: contactIntro.labels.workflow,
                  textarea: true,
                },
              ]}
            />
          </Reveal>
        </div>
      </section>
      <Faq faq={c.shared.faq} email={site.email} enquiriesLabel={site.enquiriesLabel} />
    </>
  );
}
