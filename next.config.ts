import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ssh2 native – nicht bundlen (sonst spawn/ENOENT-Probleme auf Vercel)
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
    ],
  },
};

export default nextConfig;
