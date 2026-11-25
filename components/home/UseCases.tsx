import { Reveal, WordReveal } from "@/components/Reveal";
import { MiniArtifact, type Tone } from "@/components/home/VisualSystem";
import { getContent } from "@/lib/content";

export async function UseCases() {
  const useCases = (await getContent()).home.useCases;
  return (
    <section id="use-cases" className="gutter scroll-mt-28 py-14 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 md:gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="flex flex-col gap-4 lg:sticky lg:top-32">
          <Reveal>
            <p className="type-eyebrow text-action">{useCases.eyebrow}</p>
          </Reveal>
          <WordReveal
            as="h2"
            text={useCases.heading}
            className="type-display text-ink-deep"
            onScroll
          />
          <Reveal delay={120}>
            <p className="type-lead text-body-60">{useCases.sub}</p>
          </Reveal>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {useCases.items.map((item, i) => (
            <Reveal
              key={i}
              delay={i * 55}
              className="group flex min-h-full flex-col justify-between gap-4 overflow-hidden rounded-[22px] border border-line bg-paper p-3.5 shadow-[0_14px_40px_rgba(13,22,48,0.04)]"
            >
              <MiniArtifact label={item.label} title={item.title} meta={item.meta} tone={item.tone as Tone} />
              <div className="flex items-center justify-between gap-3 px-1 pb-1">
                <span className="text-base font-semibold text-ink-deep">{item.name}</span>
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-sm font-semibold text-action"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
