import { getContent } from "@/lib/content";

export async function CredibilityStrip() {
  const { label, items } = (await getContent()).home.credibility;
  return (
    <section aria-label={label} className="gutter bg-paper py-5">
      <div className="mx-auto max-w-6xl border-y border-line py-4">
        <p className="text-center text-sm font-medium leading-6 text-body-60">
          {items.map((item, index) => (
            <span key={index}>
              {index > 0 && (
                <span aria-hidden="true" className="px-2 text-line">
                  ·
                </span>
              )}
              {item}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
