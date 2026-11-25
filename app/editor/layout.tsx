import type { Metadata } from "next";

// The editor is private: never indexed, never linked from the site.
export const metadata: Metadata = {
  title: "Website editor",
  robots: { index: false, follow: false, nocache: true },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-mist text-ink">{children}</div>;
}
