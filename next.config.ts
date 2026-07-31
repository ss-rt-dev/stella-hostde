import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ssh2", "cpu-features", "nan"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
      {
        protocol: "https",
        hostname: "cdn3.emoji.gg",
      },
      {
        protocol: "https",
        hostname: "cdn.emoji.gg",
      },
    ],
  },
};

export default nextConfig;
