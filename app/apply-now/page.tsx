import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { Faq } from "@/components/Faq";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return (await getContent()).applyNow.meta;
}

export default async function ApplyNowPage() {
  const c = await getContent();
  const t = c.applyNow;
  const site = c.shared.contact;
  return (
    <>
      <section className="gutter">
        <PageHeader
          eyebrow={t.eyebrow}
          heading={t.heading}
          sub={t.sub}
        />

        <div className="mx-auto grid max-w-5xl gap-6 pb-10 md:grid-cols-2">
          {t.roles.map((r, i) => (
            <Reveal
              key={i}
              delay={i * 100}
              className="flex flex-col gap-2 rounded-lg border border-line bg-tint/50 p-8"
            >
              <p className="type-eyebrow text-ink">{r.eyebrow}</p>
              <h2 className="type-h3">{r.role}</h2>
              <p className="type-body text-body-60">{r.details}</p>
            </Reveal>
          ))}
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 pb-10 md:grid-cols-2">
          <Reveal className="flex flex-col gap-2 rounded-lg border border-line bg-tint/50 p-8">
            <p className="type-body text-body-60">{t.enquiriesLabel}</p>
            <a
              href={`mailto:${site.email}`}
              className="type-h3 inline-flex min-h-[44px] min-w-[44px] items-center text-action hover:text-sky"
            >
              {site.email}
            </a>
          </Reveal>
          <Reveal
            delay={100}
            className="flex flex-col gap-2 rounded-lg border border-line bg-tint/50 p-8"
          >
            <p className="type-body text-body-60">{t.bookingText}</p>
            <a
              href={site.bookingUrl}
              target="_blank"
              rel="noopener"
              className="type-h3 inline-flex min-h-[44px] min-w-[44px] items-center text-action hover:text-sky"
            >
              {t.bookingLink}
            </a>
          </Reveal>
        </div>

        <Reveal className="mx-auto max-w-2xl rounded-lg border border-line p-8 md:p-10">
          {/* FormSubmit delivery is text-only, so the form asks for a link to
              the resume instead of a file upload. */}
          <ContactForm
            submitLabel={c.shared.form.submit}
            messages={c.shared.form}
            email={site.email}
            fields={[
              { name: "name", label: t.labels.name },
              { name: "email", label: t.labels.email, type: "email" },
              { name: "role", label: t.labels.role },
              { name: "resume", label: t.labels.resume },
            ]}
          />
        </Reveal>
      </section>
      <Faq faq={c.shared.faq} email={site.email} enquiriesLabel={site.enquiriesLabel} />
    </>
  );
}
