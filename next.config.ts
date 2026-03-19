import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // This is needed to allow loading images from all external URLs
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
