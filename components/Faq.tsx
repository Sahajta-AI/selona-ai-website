"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import type { Content } from "@/lib/content/paths";

export function Faq({
  faq,
  email,
  enquiriesLabel,
}: {
  faq: Content["shared"]["faq"];
  email: string;
  enquiriesLabel: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="gutter scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-3 text-center">
          <Reveal as="h2" className="type-h2">
            {faq.heading}
          </Reveal>
          <Reveal as="p" className="type-lead text-body-60">
            {faq.sub}
          </Reveal>
        </div>

        <ul className="flex flex-col gap-3">
          {faq.items.map((f, i) => {
            const open = openIndex === i;
            return (
              <Reveal as="li" key={i} delay={i * 60}>
                <div className="rounded-lg border border-line bg-paper">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
                  >
                    <span className="type-h3">{f.q}</span>
                    <span
                      aria-hidden="true"
                      className={`text-2xl text-action transition-transform duration-300 ${open ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="type-body px-6 pb-6 text-body-60">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>

        <p className="type-body text-center text-body-60">
          {enquiriesLabel}{" "}
          <a
            href={`mailto:${email}`}
            className="inline-flex min-h-[44px] items-center align-middle text-action hover:text-sky"
          >
            {email}
          </a>
        </p>
      </div>
    </section>
  );
}
