// Only ever send people back to a page inside the editor (no open redirects).
export const safeNext = (next: string | null | undefined) =>
  next && /^\/editor(\/|\?|$)/.test(next) && !next.startsWith("//") ? next : "/editor";
