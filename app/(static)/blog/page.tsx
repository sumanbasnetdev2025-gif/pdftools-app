import Link from "next/link";
import { blogPosts } from "@/lib/blog/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — PDF Tips, Guides & Tutorials | PDFMaster",
  description: "Learn how to compress, convert, merge, sign and protect PDFs. Expert guides and tutorials from the PDFMaster team.",
  openGraph: {
    title: "Blog — PDF Tips, Guides & Tutorials | PDFMaster",
    description: "Learn how to compress, convert, merge, sign and protect PDFs. Expert guides and tutorials.",
    type: "website",
  },
};

const categoryColors: Record<string, string> = {
  Tutorial: "#3B82F6",
  Guide: "#8B5CF6",
  Security: "#EF4444",
  Tips: "#F59E0B",
  Education: "#10B981",
  Accessibility: "#06B6D4",
};

export default function BlogPage() {
  return (
    <>
      <style>{`
        .blog-root { min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; }
        .blog-hero { padding: 80px 24px 48px; text-align: center; border-bottom: 1px solid #1a1a1a; }
        .blog-hero-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #F59E0B; margin-bottom: 16px; }
        .blog-hero-title { font-family: 'DM Serif Display', serif; font-size: clamp(2rem, 5vw, 3.5rem); color: #f0f0f0; margin-bottom: 16px; line-height: 1.1; }
        .blog-hero-title em { font-style: italic; color: #F59E0B; }
        .blog-hero-sub { font-size: 1rem; color: #555; max-width: 480px; margin: 0 auto; line-height: 1.7; }
        .blog-container { max-width: 1100px; margin: 0 auto; padding: 56px 24px; }
        .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .blog-card { background: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 16px; overflow: hidden; text-decoration: none; display: flex; flex-direction: column; transition: all 0.2s; }
        .blog-card:hover { border-color: #2a2a2a; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
        .blog-card-thumb { height: 160px; display: flex; align-items: center; justify-content: center; font-size: 3rem; background: #111; border-bottom: 1px solid #1a1a1a; }
        .blog-card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .blog-card-meta { display: flex; align-items: center; gap: 10px; }
        .blog-cat { font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
        .blog-read-time { font-size: 0.72rem; color: #444; }
        .blog-card-title { font-family: 'DM Serif Display', serif; font-size: 1.1rem; color: #e0e0e0; line-height: 1.4; flex: 1; }
        .blog-card-desc { font-size: 0.82rem; color: #555; line-height: 1.6; }
        .blog-card-date { font-size: 0.72rem; color: #333; margin-top: auto; padding-top: 12px; border-top: 1px solid #141414; }
      `}</style>

      <div className="blog-root">
        <div className="blog-hero">
          <p className="blog-hero-label">PDFMaster Blog</p>
          <h1 className="blog-hero-title">PDF Tips, Guides &amp; <em>Tutorials</em></h1>
          <p className="blog-hero-sub">Learn how to get more from your PDFs — from compression to security, conversion to accessibility.</p>
        </div>

        <div className="blog-container">
          <div className="blog-grid">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-card-thumb">{post.emoji}</div>
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="blog-cat" style={{ backgroundColor: `${categoryColors[post.category] || "#666"}22`, color: categoryColors[post.category] || "#999" }}>
                      {post.category}
                    </span>
                    <span className="blog-read-time">{post.readTime}</span>
                  </div>
                  <h2 className="blog-card-title">{post.title}</h2>
                  <p className="blog-card-desc">{post.description}</p>
                  <p className="blog-card-date">{post.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}