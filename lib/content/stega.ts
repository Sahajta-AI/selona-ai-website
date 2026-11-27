// Invisible markers that name a piece of content, used only inside the editor:
// "Hello" + START + key encoded with 4 zero-width characters + END.
// The editor's in-page script (components/editor/EditOverlay.tsx) reads them, strips them
// and makes that text editable; it keeps its own small decoder so visitors' browsers
// never download the content file this one imports.
import { isTextKey } from "./paths";

const START = "⁣";
const END = "⁤";
const DIGITS = ["‌", "‍", "⁠", "﻿"];

function encodeKey(key: string) {
  const bytes = new TextEncoder().encode(key);
  let out = "";
  for (const b of bytes) for (let shift = 6; shift >= 0; shift -= 2) out += DIGITS[(b >> shift) & 3];
  return START + out + END;
}

/** Content with a marker after every editable text (page titles and descriptions stay clean). */
export function markForEditing<T>(content: T, prefix = ""): T {
  if (Array.isArray(content)) return content.map((v, i) => markForEditing(v, `${prefix}${i}.`)) as T;
  if (content && typeof content === "object")
    return Object.fromEntries(Object.entries(content).map(([k, v]) => [k, markForEditing(v, `${prefix}${k}.`)])) as T;
  const key = prefix.slice(0, -1);
  if (typeof content === "string" && isTextKey(key) && !/(^|\.)meta\./.test(key) && !/titleTemplate$/.test(key))
    return (content + encodeKey(key)) as T;
  return content as T;
}
