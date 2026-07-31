import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ssh2 hat native .node-Binaries – nicht von Webpack bundlen
  serverExternalPackages: ["ssh2", "cpu-features"],
  eslint: {
    // ESLint-Config auf Vercel inkonsistent – Build nicht blockieren
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: nur wenn weitere Type-Fehler deploy blockieren
    // ignoreBuildErrors: false,
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
