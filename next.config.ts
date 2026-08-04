import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keine Source Maps im Browser → kein lesbarer TSX/Original-Code in DevTools
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["ssh2", "cpu-features", "nan"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    // weniger Noise / Hinweise im Client-Bundle
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
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
