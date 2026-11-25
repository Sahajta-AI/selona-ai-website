import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images replaced in the editor are served from the Vercel Blob store.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    // The editor and its API are private: never indexed or cached by browsers.
    const privateHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "no-store" },
    ];
    return [
      { source: "/editor/:path*", headers: privateHeaders },
      { source: "/editor", headers: privateHeaders },
      { source: "/api/:path*", headers: privateHeaders },
    ];
  },
};

export default nextConfig;
