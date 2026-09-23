import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "RosiNedelchevaSite";
const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = githubPages ? `/${repository}` : "";

const nextConfig: NextConfig = {
  ...(githubPages ? { output: "export" as const } : {}),
  images: {
    unoptimized: githubPages,
  },
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  trailingSlash: true,
};

export default nextConfig;
