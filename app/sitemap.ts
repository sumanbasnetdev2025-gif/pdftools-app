import { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pdftools-app-three.vercel.app";

  const toolRoutes = [
    "/merge", "/split", "/compress", "/rotate", "/watermark",
    "/sign", "/edit", "/protect", "/ocr", "/compare",
    "/convert/pdf-to-jpg", "/convert/pdf-to-word",
    "/convert/word-to-pdf", "/convert/excel-to-pdf",
    "/image-resize", "/background-remover", "/passport-photo",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...toolRoutes,
    ...blogRoutes,
  ];
}