import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@monaco-editor/react"],
  reactStrictMode: false, // Monaco dislikes double-mount in dev
};

export default nextConfig;
