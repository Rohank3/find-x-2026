import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone mode for Docker builds; disable on Vercel to allow native serverless routing
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
