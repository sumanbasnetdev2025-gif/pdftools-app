import { notFound } from "next/navigation";
import Link from "next/link";
import { blogPosts, getPostBySlug } from "@/lib/blog/posts";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | PDFMaster Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

const categoryColors: Record<string, string> = {
  Tutorial: "#3B82F6",
  Guide: "#8B5CF6",
  Security: "#EF4444",
  Tips: "#F59E0B",
  Education: "#10B981",
  Accessibility: "#06B6D4",
};

function renderMarkdown(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (line.startsWith("| ")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const [headerLine, , ...bodyLines] = tableLines;
      const headers = headerLine.split("|").filter(Boolean).map((h) => h.trim());
      const rows = bodyLines.map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
      elements.push(
        <table key={key++}>
          <thead><tr>{headers.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((row, j) => <tr key={j}>{row.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
        </table>
      );
      continue;
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={key++}>
          {items.map((item, j) => {
            const parts = item.split(/\*\*(.*?)\*\*/g);
            return <li key={j}>{parts.map((p, k) => k % 2 === 1 ? <strong key={k}>{p}</strong> : p)}</li>;
          })}
        </ul>
      );
      continue;
    } else if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={key++}>
          {items.map((item, j) => {
            const parts = item.split(/\*\*(.*?)\*\*/g);
            return <li key={j}>{parts.map((p, k) => k % 2 === 1 ? <strong key={k}>{p}</strong> : p)}</li>;
          })}
        </ol>
      );
      continue;
    } else if (line.trim() !== "") {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <p key={key++}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>
      );
    }
    i++;
  }
  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const color = categoryColors[post.category] || "#666";
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <style>{`
        .post-root { min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #d0d0d0; }
        .post-hero { padding: 64px 24px 48px; border-bottom: 1px solid #1a1a1a; text-align: center; }
        .post-back { display: inline-flex; align-items: center; gap: 6px; color: #444; font-size: 0.8rem; text-decoration: none; margin-bottom: 32px; transition: color 0.15s; }
        .post-back:hover { color: #F59E0B; }
        .post-cat { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; margin-bottom: 20px; }
        .post-title { font-family: 'DM Serif Display', serif; font-size: clamp(1.8rem, 4vw, 3rem); color: #f0f0f0; line-height: 1.15; max-width: 720px; margin: 0 auto 20px; }
        .post-desc { font-size: 1rem; color: #555; max-width: 600px; margin: 0 auto 24px; line-height: 1.7; }
        .post-meta { display: flex; align-items: center; justify-content: center; gap: 16px; font-size: 0.78rem; color: #444; }
        .post-body { max-width: 720px; margin: 0 auto; padding: 56px 24px; }
        .post-body h2 { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: #f0f0f0; margin: 40px 0 16px; padding-bottom: 10px; border-bottom: 1px solid #1a1a1a; }
        .post-body p { font-size: 0.95rem; line-height: 1.85; color: #888; margin-bottom: 16px; }
        .post-body ul, .post-body ol { padding-left: 20px; margin-bottom: 20px; }
        .post-body li { font-size: 0.92rem; color: #888; line-height: 1.8; margin-bottom: 6px; }
        .post-body strong { color: #d0d0d0; font-weight: 600; }
        .post-body table { width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 10px; overflow: hidden; }
        .post-body th { background: #111; color: #888; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 12px 16px; text-align: left; border-bottom: 1px solid #1e1e1e; }
        .post-body td { padding: 12px 16px; font-size: 0.88rem; color: #666; border-bottom: 1px solid #141414; }
        .post-body tr:last-child td { border-bottom: none; }
        .post-cta { background: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 16px; padding: 32px; text-align: center; margin: 48px 0; }
        .post-cta h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; color: #f0f0f0; margin-bottom: 10px; }
        .post-cta p { font-size: 0.875rem; color: #555; margin-bottom: 20px; }
        .post-cta a { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 10px; background: #F59E0B; color: #0a0a0a; font-weight: 700; font-size: 0.875rem; text-decoration: none; transition: opacity 0.15s; }
        .post-cta a:hover { opacity: 0.88; }
        .related-section { border-top: 1px solid #1a1a1a; padding: 56px 24px; }
        .related-inner { max-width: 1100px; margin: 0 auto; }
        .related-title { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: #f0f0f0; margin-bottom: 28px; }
        .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .related-card { background: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; text-decoration: none; display: flex; flex-direction: column; gap: 8px; transition: all 0.15s; }
        .related-card:hover { border-color: #2a2a2a; transform: translateY(-1px); }
        .related-emoji { font-size: 1.5rem; }
        .related-cat { font-size: 0.68rem; font-weight: 700; }
        .related-card-title { font-family: 'DM Serif Display', serif; font-size: 0.95rem; color: #d0d0d0; line-height: 1.4; }
        .related-card-date { font-size: 0.7rem; color: #333; margin-top: auto; }
      `}</style>

      <div className="post-root">
        <div className="post-hero">
          <Link href="/blog" className="post-back">← Back to Blog</Link>
          <div>
            <span className="post-cat" style={{ backgroundColor: `${color}22`, color }}>
              {post.category}
            </span>
          </div>
          <h1 className="post-title">{post.title}</h1>
          <p className="post-desc">{post.description}</p>
          <div className="post-meta">
            <span>📅 {post.date}</span>
            <span>⏱ {post.readTime}</span>
          </div>
        </div>

        <div className="post-body">
          {renderMarkdown(post.content)}
          <div className="post-cta">
            <h3>Try it yourself — free</h3>
            <p>PDFMaster gives you 30+ PDF tools directly in your browser. No install, no signup required.</p>
            <Link href="/">Explore All Tools →</Link>
          </div>
        </div>

        <div className="related-section">
          <div className="related-inner">
            <h2 className="related-title">More Articles</h2>
            <div className="related-grid">
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="related-card">
                  <span className="related-emoji">{p.emoji}</span>
                  <span className="related-cat" style={{ color: categoryColors[p.category] || "#666" }}>{p.category}</span>
                  <span className="related-card-title">{p.title}</span>
                  <span className="related-card-date">{p.date}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}