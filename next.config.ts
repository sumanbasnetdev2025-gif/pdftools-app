import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

  // Add pdfjs-dist here
  serverExternalPackages: ["tesseract.js", "@sparticuz/chromium-min", "pdfjs-dist"],

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;