import { flatten, isTextKey, type Json } from "./paths";

// Finding words on the website the way a person (or Claude reading a screenshot)
// would type them: case, spacing, line breaks, curly quotes and dashes don't matter.
export const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’‚‛`´]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();

const words = (s: string) => normalize(s).replace(/[^\p{L}\p{N}\s]/gu, " ").split(" ").filter((w) => w.length > 1);

export type Match = { key: string; text: string; exact: boolean; score: number };

/**
 * Exact matches first (the phrase appears in the text). If there are none, the
 * closest texts: those sharing most of the phrase's words (at least half).
 */
export function findText(content: unknown, phrase: string, limit = 10): Match[] {
  const texts = flatten(content).filter((e): e is [string, string] => isTextKey(e[0]) && typeof e[1] === "string" && e[1].length > 0);
  const needle = normalize(phrase);
  const exact = texts.filter(([, v]) => normalize(v).includes(needle)).map(([key, text]) => ({ key, text, exact: true, score: 1 }));
  if (exact.length) return exact.slice(0, 50);
  const want = [...new Set(words(phrase))];
  if (!want.length) return [];
  return texts
    .map(([key, text]) => {
      const have = new Set(words(text));
      const shared = want.filter((w) => have.has(w)).length;
      // how much of the phrase is there, slightly favouring texts of a similar length
      const score = shared / want.length - Math.abs(have.size - want.length) / (40 * Math.max(have.size, want.length));
      return { key, text, exact: false, score: Math.round(score * 100) / 100 };
    })
    .filter((m) => m.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Every list on a page (its key and how many items), for adding, removing or moving items. */
export function listsIn(content: Json, prefix: string): { list: string; items: number }[] {
  const out: { list: string; items: number }[] = [];
  const walk = (v: Json, key: string) => {
    if (Array.isArray(v)) {
      out.push({ list: key, items: v.length });
      v.forEach((item, i) => walk(item, `${key}.${i}`));
    } else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, key ? `${key}.${k}` : k);
  };
  walk(content, prefix);
  return out;
}
