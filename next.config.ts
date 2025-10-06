import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... other config options ...
  turbopack: {
    root: "./", // Set the root directory to the project root
  },
};

export default nextConfig;