import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "RosiNedelchevaSite";
const githubPages = process.env.GITHUB_PAGES === "true";
const staticExport = githubPages || process.env.STATIC_EXPORT === "true";
const basePath = githubPages ? `/${repository}` : "";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  images: {
    unoptimized: staticExport,
  },
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  trailingSlash: true,
};

export default nextConfig;
