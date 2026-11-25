import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getLive } from "./versions";
import { defaultContent, type Content } from "./paths";

export type { Content } from "./paths";

// Live content, cached until Publish refreshes the "content" tag. If the store
// is empty or can't be reached, the site shows the repo default instead.
const getPublishedContent = unstable_cache(
  async (): Promise<Content> => {
    try {
      return (await getLive()).content;
    } catch (err) {
      console.error("Content store unavailable, showing the default content:", (err as Error).message);
      return defaultContent;
    }
  },
  ["published-content"],
  // shortcut: an hourly refresh heals a cached fallback after a store outage; Publish refreshes at once
  { tags: ["content"], revalidate: 3600 },
);

export const getContent = cache(async (): Promise<Content> => getPublishedContent());
