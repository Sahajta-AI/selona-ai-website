import { test, expect } from "@playwright/test";
import { defaultContent, diffContent, flatten, getAt, mergeContent, setAt, listKeys, type Json } from "@/lib/content/paths";

test("setAt copies and changes one value", () => {
  const next = setAt(defaultContent, "home.problems.items.1.name", "Changed");
  expect(getAt(next, "home.problems.items.1.name")).toBe("Changed");
  expect(getAt(defaultContent, "home.problems.items.1.name")).toBe("Context drift");
});

test("mergeContent keeps defaults for missing or wrong-typed keys", () => {
  const merged = mergeContent(defaultContent as Json, { home: { hero: { headline: "New" } }, pricing: 5 } as Json);
  expect(getAt(merged, "home.hero.headline")).toBe("New");
  expect(getAt(merged, "home.hero.eyebrow")).toBe("ThinkAIWork by Selona");
  expect(getAt(merged, "pricing.heading")).toBe(defaultContent.pricing.heading);
});

test("diffContent reports text edits, list length changes and reorders", () => {
  const edited = setAt(defaultContent, "home.hero.headline", "New");
  expect(diffContent(defaultContent, edited)).toEqual([{ key: "home.hero.headline", kind: "text", before: defaultContent.home.hero.headline, after: "New" }]);
  const items = [...defaultContent.home.useCases.items];
  const swapped = setAt(defaultContent, "home.useCases.items", [items[1], items[0], ...items.slice(2)] as Json);
  expect(diffContent(defaultContent, swapped).map((c) => [c.key, c.kind])).toEqual([["home.useCases.items", "list"]]);
  const shorter = setAt(defaultContent, "home.useCases.items", items.slice(1) as Json);
  expect(diffContent(defaultContent, shorter)).toHaveLength(1);
  expect(diffContent(defaultContent, defaultContent)).toEqual([]);
});

test("flatten and listKeys cover the whole content", () => {
  expect(flatten(defaultContent).length).toBeGreaterThan(400);
  expect(listKeys(defaultContent)).toContain("shared.faq.items");
});
