import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getContent, isEditing } from "@/lib/content";
import { EditOverlay } from "@/components/editor/EditOverlay";

// The site's nav and footer around a page. The editor's own screens don't use it.
export async function SiteChrome({ children }: { children: ReactNode }) {
  const c = await getContent();
  return (
    <>
      <Nav nav={c.shared.nav} brand={c.shared.brand} />
      <main className="flex-1">{children}</main>
      <Footer />
      {(await isEditing()) ? <EditOverlay /> : null}
    </>
  );
}
