import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    // All imagery is processed and served locally — no external CDNs.
  },
};

export default nextConfig;
