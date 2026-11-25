import Link from "next/link";
import { Logo } from "./Logo";
import { getContent } from "@/lib/content";

export async function Footer() {
  const { footer, contact, brand } = (await getContent()).shared;
  return (
    <footer className="gutter bg-mist pt-20 pb-28 md:pb-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <p className="type-h3 max-w-xl">{footer.tagline}</p>

        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {footer.columns.map((col, ci) => (
            <div key={ci}>
              <h3 className="type-eyebrow mb-4 text-body-60">{col.title}</h3>
              <ul className="flex flex-col gap-1">
                {col.links.map((l, li) => (
                  <li key={li}>
                    <Link
                      href={l.href}
                      className="type-body inline-flex min-h-[44px] min-w-[44px] items-center py-2.5 text-ink transition-colors duration-200 hover:text-sky"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="type-eyebrow mb-4 text-body-60">{footer.enquiriesTitle}</h3>
            <a
              href={`mailto:${contact.email}`}
              className="type-body inline-flex min-h-[44px] min-w-[44px] items-center py-2.5 text-ink transition-colors duration-200 hover:text-sky"
            >
              {contact.email}
            </a>
          </div>
        </div>

        <div className="border-t border-line pt-10">
          <Logo src={brand.logoSrc} alt={brand.logoAlt} className="h-auto w-full max-w-4xl opacity-90" />
        </div>

        <div className="flex flex-col gap-1 text-sm text-body-60 md:flex-row md:items-center md:justify-between">
          <p className="py-2.5">{footer.bottomLine}</p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="inline-flex min-h-[44px] items-center px-2 hover:text-sky"
            >
              {footer.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
