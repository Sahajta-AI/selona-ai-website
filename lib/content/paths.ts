// Helpers shared by the site, the editor and the Claude connector.
// A content "key" is a dotted path into the content object, e.g. "home.problems.items.2.name".
import defaults from "@/content/defaults.json";

export type Content = typeof defaults;
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export const defaultContent: Content = defaults;

export const PAGES: Record<string, { label: string; path: string; groups: string[] }> = {
  home: { label: "Home page", path: "/", groups: ["home", "shared"] },
  pricing: { label: "Pricing", path: "/pricing", groups: ["pricing", "shared"] },
  contact: { label: "Contact", path: "/contact", groups: ["contact", "shared"] },
  security: { label: "Security review", path: "/security", groups: ["security", "shared"] },
  privacy: { label: "Privacy policy", path: "/privacy", groups: ["privacy", "shared"] },
  applyNow: { label: "Apply now", path: "/apply-now", groups: ["applyNow", "shared"] },
  notFound: { label: "Page not found", path: "/this-page-does-not-exist", groups: ["notFound", "shared"] },
};

const SETTING = /(^|\.)(href|tone|highlighted|bookingUrl)$/;
export const isMediaKey = (key: string) => /src$/i.test(key);
export const isVideoKey = (key: string) => /video/i.test(key);
export const isTextKey = (key: string) => !SETTING.test(key) && !isMediaKey(key);

export function getAt(obj: unknown, key: string): Json | undefined {
  let cur = obj as Json | undefined;
  for (const part of key.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, Json>)[part];
  }
  return cur;
}

/** Returns a copy of obj with the value at key replaced (no mutation). */
export function setAt<T>(obj: T, key: string, value: Json): T {
  const [head, ...rest] = key.split(".");
  const copy = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string, unknown>;
  copy[head] = rest.length ? setAt(copy[head], rest.join("."), value) : value;
  return copy as T;
}

export function flatten(obj: unknown, prefix = ""): [string, Json][] {
  if (Array.isArray(obj)) return obj.flatMap((v, i) => flatten(v, `${prefix}${i}.`));
  if (obj && typeof obj === "object")
    return Object.entries(obj).flatMap(([k, v]) => flatten(v, `${prefix}${k}.`));
  return [[prefix.slice(0, -1), obj as Json]];
}

/** Every list (array) in the content, by key. */
export function listKeys(obj: unknown, prefix = ""): string[] {
  if (Array.isArray(obj))
    return [prefix.slice(0, -1), ...obj.flatMap((v, i) => listKeys(v, `${prefix}${i}.`))];
  if (obj && typeof obj === "object")
    return Object.entries(obj).flatMap(([k, v]) => listKeys(v, `${prefix}${k}.`));
  return [];
}

const SAFE_MEDIA = /^(\/[\w\-./]+|https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w\-./%]+)$/i;
const MAX_TEXT = 5000;

/**
 * Stored content laid over the repo default, so keys added to the code later still
 * show, and anything of the wrong shape falls back to the default instead of
 * breaking a page. List items are checked against the default list's first item.
 */
export function mergeContent(base: Json, stored: Json | undefined, key = ""): Json {
  if (stored === undefined || stored === null) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(stored)) return base;
    const template = base[0];
    return stored
      .slice(0, 100)
      .map((item) => (template === undefined ? (typeof item === "string" ? item : undefined) : mergeContent(template, item, `${key}.0`)))
      .filter((v): v is Json => v !== undefined);
  }
  if (base && typeof base === "object") {
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return base;
    const out: Record<string, Json> = {};
    for (const k of Object.keys(base)) out[k] = mergeContent((base as Record<string, Json>)[k], stored[k], key ? `${key}.${k}` : k);
    return out;
  }
  if (typeof stored !== typeof base) return base;
  if (typeof stored === "string") {
    if (isMediaKey(key) && !SAFE_MEDIA.test(stored)) return base;
    return stored.slice(0, MAX_TEXT);
  }
  return stored;
}

export type Change = { key: string; kind: "text" | "media" | "list"; before: Json | undefined; after: Json | undefined };

/** What differs between two versions; a list whose length or order changed counts as one change. */
export function diffContent(before: unknown, after: unknown, key = ""): Change[] {
  if (Array.isArray(before) && Array.isArray(after)) {
    const reordered = JSON.stringify(before) !== JSON.stringify(after) && sameItemSet(before, after);
    if (before.length !== after.length || reordered) return [{ key, kind: "list", before: before as Json, after: after as Json }];
    return before.flatMap((b, i) => diffContent(b, after[i], key ? `${key}.${i}` : String(i)));
  }
  if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].flatMap((k) =>
      diffContent((before as Record<string, unknown>)[k], (after as Record<string, unknown>)[k], key ? `${key}.${k}` : k),
    );
  }
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  return [{ key, kind: isMediaKey(key) ? "media" : "text", before: before as Json, after: after as Json }];
}

// Same items in a different order = a reorder, which is shown as one list change.
function sameItemSet(a: unknown[], b: unknown[]) {
  const s = (x: unknown[]) => x.map((v) => JSON.stringify(v)).sort().join("\n");
  return s(a) === s(b);
}

// Plain words for the parts of a content key, so nothing technical shows in the editor.
const WORDS: Record<string, string> = {
  shared: "Every page", home: "Home page", pricing: "Pricing page", contact: "Contact page", security: "Security page",
  privacy: "Privacy page", applyNow: "Apply page", notFound: "Page not found",
  meta: "Page details", title: "Title", titleTemplate: "Title ending (after each page name)", description: "Description for search engines",
  nav: "Top menu", footer: "Bottom of the page", cta: "Button", primary: "Main button", secondary: "Second button",
  eyebrow: "Small heading", heading: "Heading", sub: "Text under the heading", intro: "Introduction", lead: "Introduction",
  hero: "Top of the page", headline: "Big headline", subheadline: "Text under the headline", items: "List", links: "Links",
  label: "Label", body: "Text", name: "Name", note: "Note", logoSrc: "Logo", logoAlt: "Logo description",
  imageSrc: "Picture", imageAlt: "Picture description", visualSrc: "Picture", visualAlt: "Picture description",
  videoSrc: "Background video (computer)", videoMobileSrc: "Background video (phone)", homeLabel: "Logo link name (for screen readers)",
  openMenu: "Menu button name (closed)", closeMenu: "Menu button name (open)", calendarLink: "Calendar link", enquiriesLabel: "'For enquiries' words",
  email: "Email address", form: "Contact form messages", sending: "While sending", submit: "Send button", invalid: "When something is missing",
  errorBefore: "When sending fails", success: "After sending", faq: "Questions and answers", q: "Question", a: "Answer",
  tiers: "Price plans", features: "What's included", model: "Plan type", credibility: "Facts strip", showcase: "Product picture",
  problems: "The problem", mechanism: "Control layer", workflow: "Workflow example", steps: "Steps", step: "Step number",
  layers: "Product layers", useCases: "Use cases", trust: "Trust and control", beta: "Private beta", stats: "Numbers", value: "Number",
  testimonials: "Quotes", quote: "Quote", attribution: "Who said it", artifacts: "Small cards",
  labels: "Form field names", roles: "Open roles", role: "Role", details: "Details", sections: "Sections", paragraphs: "Paragraphs",
  list: "Bullet points", updated: "Last updated", coverItems: "What we cover", coverTitle: "Heading", bookingText: "Booking text",
  bookingLink: "Booking link", code: "Error code", columns: "Columns", tagline: "Tagline", bottomLine: "Last line", brand: "Logo",
  mobileLinks: "Extra menu links on phones", inputs: "Inputs", outputs: "Outputs", layer: "Control layer parts", controls: "Controls",
  models: "Model names", modelFlex: "Model choice text", feedback: "Feedback", surfaceLabel: "Card label", surfaceTitle: "Card title",
};

/** Plain-words name for a key, for people: "home.problems.items.2.name" → "Home page › The problem › List › item 3 › Name". */
export function describeKey(key: string) {
  const parts = key.split(".");
  return parts
    .map((p, i) => {
      if (/^\d+$/.test(p)) return `item ${Number(p) + 1}`;
      // "meta" inside a small card is its little side text, not page details
      if (p === "meta" && i > 0 && parts[i - 2] === "artifacts") return "Small text";
      if (p === "meta" && i > 1 && /^\d+$/.test(parts[i - 1])) return "Small text";
      return WORDS[p] ?? p.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    })
    .join(" › ");
}
