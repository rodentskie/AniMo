import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    optimizePackageImports: ["@chakra-ui/react"],
  },
};

export default nextConfig;
