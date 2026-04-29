import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Hide the floating Next.js dev-tools badge from the corner of every page —
  // it's noise during development and pollutes screenshots. Errors still
  // surface in the terminal and devtools console.
  devIndicators: false,
};

export default nextConfig;
