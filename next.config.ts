import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images replaced in the editor are served from the Vercel Blob store.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
