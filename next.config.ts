import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
