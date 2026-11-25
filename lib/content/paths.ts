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

/** Stored content laid over the repo default, so keys added to the code later still show. */
export function mergeContent(base: Json, stored: Json | undefined): Json {
  if (stored === undefined || stored === null) return base;
  if (Array.isArray(base)) return Array.isArray(stored) ? stored : base;
  if (base && typeof base === "object") {
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return base;
    const out: Record<string, Json> = {};
    for (const k of Object.keys(base)) out[k] = mergeContent((base as Record<string, Json>)[k], stored[k]);
    return out;
  }
  return typeof stored === typeof base ? stored : base;
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

/** Plain-words name for a key, for people: "home.problems.items.2.name" → "Home › Problems › item 3 › Name". */
export function describeKey(key: string) {
  return key
    .split(".")
    .map((p) => (/^\d+$/.test(p) ? `item ${Number(p) + 1}` : p.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())))
    .join(" › ");
}
