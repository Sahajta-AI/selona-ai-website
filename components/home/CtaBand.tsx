import { Reveal, WordReveal } from "@/components/Reveal";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { getContent } from "@/lib/content";

export async function CtaBand() {
  const { cta, contact } = (await getContent()).shared;
  return (
    <section className="gutter bg-ink-deep py-20 text-white md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <Reveal>
          <p className="type-eyebrow text-sky">{cta.eyebrow}</p>
        </Reveal>
        <WordReveal
          as="h2"
          text={cta.heading}
          className="type-h2 max-w-2xl"
          onScroll
        />
        <Reveal delay={120}>
          <p className="type-lead max-w-2xl text-white/70">{cta.sub}</p>
        </Reveal>
        <Reveal className="flex flex-wrap items-center justify-center gap-3">
          <PrimaryButton href="/contact">{cta.primary}</PrimaryButton>
          <SecondaryButton href="/#control-layer" className="text-white">
            {cta.secondary}
          </SecondaryButton>
        </Reveal>
        <Reveal delay={300} className="mt-4">
          <a
            href={contact.bookingUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 underline underline-offset-4"
          >
            {cta.calendarLink}
          </a>
        </Reveal>
        <Reveal as="p" className="type-body text-white/60">
          {contact.enquiriesLabel} {contact.email}
        </Reveal>
      </div>
    </section>
  );
}
