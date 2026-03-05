import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "@sparticuz/chromium-min", "node-qpdf2"],
  experimental: { serverActions: { bodySizeLimit: "50mb" } },
  turbopack: {},
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/pdf.worker.min.mjs",
        headers: [
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = { ...config.resolve.alias, canvas: false };
    }
    // Copy pdfjs worker to public folder during build
    config.plugins.push({
      apply(compiler: any) {
        compiler.hooks.afterEmit.tap("CopyWorker", () => {
          try {
            const fs = require("fs");
            const path = require("path");
            const src = path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
            const dest = path.join(process.cwd(), "public", "pdf.worker.min.mjs");
            if (fs.existsSync(src) && !fs.existsSync(dest)) {
              fs.copyFileSync(src, dest);
            }
          } catch (e) {}
        });
      },
    });
    return config;
  },
};

export default nextConfig;