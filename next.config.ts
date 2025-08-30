import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
