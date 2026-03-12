"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const toolGroups = [
  {
    category: "Organize",
    color: "#F59E0B",
    tools: [
      { href: "/merge", emoji: "🔗", label: "Merge PDF" },
      { href: "/split", emoji: "✂️", label: "Split PDF" },
      { href: "/organize", emoji: "📋", label: "Organize Pages" },
      { href: "/rotate", emoji: "🔄", label: "Rotate PDF" },
      { href: "/crop", emoji: "🔲", label: "Crop PDF" },
      { href: "/page-numbers", emoji: "🔢", label: "Page Numbers" },
    ],
  },
  {
    category: "Optimize",
    color: "#10B981",
    tools: [
      { href: "/compress", emoji: "🗜️", label: "Compress PDF" },
      { href: "/repair", emoji: "🔧", label: "Repair PDF" },
      { href: "/ocr", emoji: "🔍", label: "OCR PDF" },
      { href: "/edit", emoji: "✏️", label: "Edit PDF" },
      { href: "/redact", emoji: "🖊️", label: "Redact PDF" },
      { href: "/compare", emoji: "⚖️", label: "Compare PDF" },
    ],
  },
  {
    category: "Secure",
    color: "#8B5CF6",
    tools: [
      { href: "/protect", emoji: "🔒", label: "Protect PDF" },
      { href: "/unlock", emoji: "🔓", label: "Unlock PDF" },
      { href: "/sign", emoji: "✍️", label: "Sign PDF" },
      { href: "/watermark", emoji: "💧", label: "Watermark" },
      { href: "/scan-to-pdf", emoji: "📷", label: "Scan to PDF" },
      { href: "/convert/pdf-to-pdfa", emoji: "🗄️", label: "PDF/A" },
    ],
  },
  {
    category: "Convert",
    color: "#EF4444",
    tools: [
      { href: "/convert/pdf-to-word", emoji: "📝", label: "PDF → Word" },
      { href: "/convert/pdf-to-jpg", emoji: "🖼️", label: "PDF → JPG" },
      { href: "/convert/jpg-to-pdf", emoji: "🗃️", label: "JPG → PDF" },
      { href: "/convert/word-to-pdf", emoji: "📄", label: "Word → PDF" },
      { href: "/convert/pdf-to-excel", emoji: "📊", label: "PDF → Excel" },
      { href: "/convert/excel-to-pdf", emoji: "📉", label: "Excel → PDF" },
    ],
  },
  {
    category: "Image Tools",
    color: "#06B6D4",
    tools: [
      { href: "/image-resize", emoji: "📐", label: "Image Resize" },
      { href: "/background-remover", emoji: "✨", label: "BG Remover" },
      { href: "/passport-photo", emoji: "🪪", label: "Passport Photo" },
      { href: "/image-convert", emoji: "🔄", label: "Image Convert" },
      { href: "/compress-image", emoji: "🗜️", label: "Compress Image" },
    ],
  },
];

const stats = [
  { value: "30+", label: "PDF Tools" },
  { value: "10M+", label: "Files Processed" },
  { value: "500K+", label: "Happy Users" },
  { value: "100%", label: "Free Core Tools" },
];

const features = [
  { icon: "⚡", title: "Instant Processing", desc: "Tools run in your browser using WebAssembly. No server wait times." },
  { icon: "🔐", title: "100% Private", desc: "Files never leave your device for local operations. Zero data stored." },
  { icon: "📱", title: "Works Everywhere", desc: "Desktop, tablet, mobile. Any device, any browser, any OS." },
  { icon: "♾️", title: "No File Limits", desc: "Process as many files as you need. No artificial restrictions." },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; }

        .page-root {
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          width: 100%;
        }

        /* ── Hero ── */
        .hero-section {
          position: relative;
          overflow: hidden;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.12) 0%, transparent 70%),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 100% 100%, 40px 40px, 40px 40px;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px 72px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 100px;
          padding: 6px 16px;
          margin-bottom: 28px;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 8px #F59E0B;
          flex-shrink: 0;
        }
        .hero-badge-text {
          font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: #F59E0B;
        }
        .hero-heading {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.4rem, 7vw, 6rem);
          line-height: 1.05;
          color: #f5f5f0;
          max-width: 700px;
          margin-bottom: 20px;
        }
        .hero-heading-italic { color: #F59E0B; font-style: italic; }
        .hero-desc {
          font-size: clamp(0.9rem, 2vw, 1.05rem);
          color: #6b6b6b;
          max-width: 460px;
          line-height: 1.75;
          margin-bottom: 36px;
        }
        .cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 56px;
        }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #F59E0B; color: #0a0a0a;
          padding: 13px 24px; border-radius: 12px;
          font-weight: 700; font-size: 0.9rem;
          text-decoration: none; transition: opacity 0.2s;
          white-space: nowrap;
        }
        .cta-primary:hover { opacity: 0.88; }
        .cta-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #888;
          padding: 13px 24px; border-radius: 12px;
          font-weight: 600; font-size: 0.9rem;
          text-decoration: none; border: 1px solid #2a2a2a;
          transition: all 0.2s; white-space: nowrap;
        }
        .cta-secondary:hover { border-color: #3a3a3a; color: #e0e0e0; }
        .stats-row {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          padding-top: 40px;
          border-top: 1px solid #1a1a1a;
        }
        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem; color: #f5f5f0; line-height: 1;
        }
        .stat-label { font-size: 0.72rem; color: #444; margin-top: 4px; }

        /* ── Tools ── */
        .tools-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 64px 24px;
        }
        .category-row {
          display: flex; align-items: center;
          gap: 12px; margin-bottom: 16px; margin-top: 36px;
        }
        .category-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .category-label {
          font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: #444; white-space: nowrap;
        }
        .category-line { flex: 1; height: 1px; background: #1a1a1a; }
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 8px;
        }
        .tool-card {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 16px; border-radius: 12px;
          text-decoration: none; background: #111111;
          border: 1px solid #1c1c1c;
          transition: background 0.18s, border-color 0.18s, transform 0.18s;
          min-width: 0;
        }
        .tool-card:hover { background: #181818; border-color: #2c2c2c; transform: translateY(-2px); }
        .tool-emoji { font-size: 1.2rem; line-height: 1; flex-shrink: 0; }
        .tool-label {
          font-size: 0.82rem; font-weight: 600; color: #707070;
          transition: color 0.18s; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .tool-card:hover .tool-label { color: #f0f0f0; }

        /* ── Features ── */
        .features-strip {
          border-top: 1px solid #141414;
          border-bottom: 1px solid #141414;
          background: #0d0d0d;
        }
        .features-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 56px 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 36px;
        }
        .feature-icon { font-size: 1.8rem; display: block; margin-bottom: 12px; }
        .feature-title { font-size: 0.95rem; font-weight: 700; color: #d0d0d0; margin-bottom: 6px; }
        .feature-desc { font-size: 0.82rem; color: #444; line-height: 1.65; }

        /* ── CTA Banner ── */
        .cta-banner-section {
          max-width: 1200px; margin: 0 auto; padding: 64px 24px;
        }
        .cta-banner {
          background: linear-gradient(135deg, #161200 0%, #0f0f0f 50%, #0a0f1a 100%);
          border: 1px solid #231c00; border-radius: 20px;
          padding: 48px 40px;
          display: flex; align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; gap: 24px;
        }
        .cta-banner-heading {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          color: #f5f5f0; line-height: 1.15; margin-bottom: 8px;
        }
        .cta-banner-sub { font-size: 0.875rem; color: #444; }
        .cta-banner-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .banner-btn-primary {
          background: #F59E0B; color: #0a0a0a;
          padding: 12px 24px; border-radius: 12px;
          font-weight: 700; font-size: 0.875rem;
          text-decoration: none; transition: opacity 0.2s;
          white-space: nowrap;
        }
        .banner-btn-primary:hover { opacity: 0.88; }
        .banner-btn-secondary {
          background: transparent; color: #666;
          padding: 12px 24px; border-radius: 12px;
          font-weight: 600; font-size: 0.875rem;
          text-decoration: none; border: 1px solid #2a2a2a;
          transition: all 0.2s; white-space: nowrap;
        }
        .banner-btn-secondary:hover { border-color: #3a3a3a; color: #999; }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .hero-content { padding: 56px 16px 48px; }
          .cta-row { gap: 10px; }
          .stats-row { gap: 20px; }
          .tools-grid { grid-template-columns: 1fr 1fr; }
          .features-inner { grid-template-columns: 1fr 1fr; gap: 28px; }
          .cta-banner { padding: 28px 20px; }
          .cta-banner-actions { width: 100%; }
          .banner-btn-primary, .banner-btn-secondary { flex: 1; text-align: center; }
        }

        /* ── Tablet ── */
        @media (min-width: 641px) and (max-width: 1024px) {
          .hero-content { padding: 72px 24px 64px; }
          .tools-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
          .features-inner { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="page-root">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span className="hero-badge-text">30+ Free PDF Tools</span>
            </div>
            <h1 className="hero-heading">
              Every PDF tool<br />
              <span className="hero-heading-italic">you'll ever need.</span>
            </h1>
            <p className="hero-desc">
              Merge, split, compress, convert, sign — professional PDF tools that work entirely in your browser. No installs. No limits.
            </p>
            <div className="cta-row">
              <Link href="/merge" className="cta-primary">
                Start for Free <ArrowRight style={{ width: "16px", height: "16px" }} />
              </Link>
              <Link href="/signup" className="cta-secondary">Create Account</Link>
            </div>
            <div className="stats-row">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="stat-value">{s.value}</p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className="tools-section">
          {toolGroups.map((group) => (
            <div key={group.category}>
              <div className="category-row">
                <span className="category-dot" style={{ background: group.color, boxShadow: `0 0 10px ${group.color}88` }} />
                <span className="category-label">{group.category}</span>
                <span className="category-line" />
              </div>
              <div className="tools-grid">
                {group.tools.map((tool) => (
                  <Link key={tool.href} href={tool.href} className="tool-card">
                    <span className="tool-emoji">{tool.emoji}</span>
                    <span className="tool-label">{tool.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="features-strip">
          <div className="features-inner">
            {features.map((f) => (
              <div key={f.title}>
                <span className="feature-icon">{f.icon}</span>
                <p className="feature-title">{f.title}</p>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="cta-banner-section">
          <div className="cta-banner">
            <div>
              <h2 className="cta-banner-heading">
                Ready to master<br />
                <span style={{ color: "#F59E0B", fontStyle: "italic" }}>your PDFs?</span>
              </h2>
              <p className="cta-banner-sub">Free account. No credit card. Start in seconds.</p>
            </div>
            <div className="cta-banner-actions">
              <Link href="/signup" className="banner-btn-primary">Get Started Free</Link>
              <Link href="/pricing" className="banner-btn-secondary">View Pricing</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}