import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "tesseract.js",
    "@sparticuz/chromium-min",
    "node-qpdf2",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent pdfjs from being bundled on server
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;