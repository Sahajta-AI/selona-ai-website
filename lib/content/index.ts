import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import { unstable_cache } from "next/cache";
import { getDraft, getLive } from "./versions";
import { defaultContent, type Content } from "./paths";
import { markForEditing } from "./stega";
import { getEditor } from "@/lib/auth";

export type { Content } from "./paths";
const env = process.env.CONTENT_ENV || process.env.VERCEL_ENV || "development";

// Live content, cached until Publish refreshes the "content" tag. If the store
// is empty or can't be reached, the site shows the repo default instead.
const getPublished = unstable_cache(
  async (): Promise<{ id: string; content: Content }> => {
    try {
      const live = await getLive();
      return { id: live.id, content: live.content };
    } catch (err) {
      console.error("Content store unavailable, showing the default content:", (err as Error).message);
      return { id: "default", content: defaultContent };
    }
  },
  // keyed by environment so preview and production never share a cached copy
  ["published-content", env],
  // shortcut: an hourly refresh heals a cached fallback after a store outage; Publish refreshes at once
  { tags: ["content"], revalidate: 3600 },
);

/** Inside the editor (Draft Mode + a valid editor session): the shared draft, marked for editing. */
const editing = cache(async () => (await draftMode()).isEnabled && Boolean(await getEditor()));

export const getContent = cache(async (): Promise<Content> => {
  if (await editing()) return markForEditing((await getDraft()).content);
  return (await getPublished()).content;
});

/** Which version a page shows, so the editor can confirm "Live now". */
export const getContentVersion = cache(async () => ((await editing()) ? "draft" : (await getPublished()).id));
export const isEditing = editing;
