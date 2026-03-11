import Link from "next/link";

export default function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

        .footer-link {
          text-decoration: none;
          color: #444;
          font-size: 0.85rem;
          transition: color 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .footer-link:hover {
          color: #F59E0B;
        }

        .footer-bottom-link {
          text-decoration: none;
          color: #ffffff;
          font-size: 0.8rem;
          transition: color 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .footer-bottom-link:hover {
          color: #F59E0B;
        }

        .footer-social {
          padding: 6px 12px;
          border-radius: 8px;
          background: #141414;
          border: 1px solid #1e1e1e;
          text-decoration: none;
          color: #555;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .footer-social:hover {
          color: #F59E0B;
          border-color: rgba(245,158,11,0.3);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>

      <footer
        style={{
          background: "#0a0a0a",
          borderTop: "1px solid #141414",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "60px 24px 0",
          }}
        >
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textDecoration: "none",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "9px",
                    background: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                  }}
                >
                  📄
                </div>

                <span
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "1.1rem",
                    color: "#f5f5f0",
                  }}
                >
                  PDF<span style={{ color: "#F59E0B" }}>Master</span>
                </span>
              </Link>

              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#444",
                  lineHeight: 1.7,
                  maxWidth: "260px",
                }}
              >
                30+ professional PDF tools. Free, fast and private. No installs
                required. We are still under development phase...
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "20px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { label: "Twitter", href: "#" },
                  { label: "GitHub", href: "#" },
                  { label: "Discord", href: "#" },
                ].map((s) => (
                  <a key={s.label} href={s.href} className="footer-social">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  marginBottom: "16px",
                }}
              >
                Tools
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  ["Merge PDF", "/merge"],
                  ["Split PDF", "/split"],
                  ["Compress PDF", "/compress"],
                  ["Sign PDF", "/sign"],
                  ["Protect PDF", "/protect"],
                  ["OCR PDF", "/ocr"],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="footer-link">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  marginBottom: "16px",
                }}
              >
                Company
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  ["About Us", "/about"],
                  ["Blog", "/blog"],
                  ["Pricing", "/pricing"],
                  ["Contact", "/contact"],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="footer-link">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  marginBottom: "16px",
                }}
              >
                Legal
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  ["Privacy Policy", "/privacy"],
                  ["Terms of Service", "/terms"],
                  ["Cookie Policy", "/cookies"],
                  ["GDPR", "/gdpr"],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="footer-link">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              borderTop: "1px solid #141414",
              marginTop: "48px",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.8rem", color: "#ffffff" }}>
              © {new Date().getFullYear()} PDFMaster. All rights reserved.
            </p>

            <p style={{ fontSize: "0.8rem", color: "#999" }}>
              Developed by{" "}
              <a
                href="https://cws-nep.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#F59E0B",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                CWSolutions Nepal
              </a>
            </p>

            <p style={{ fontSize: "0.8rem", color: "#777" }}>
              Contact: +977-9704738463 | Mail: cwsolutions2025@gmail.com
            </p>

            <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
              {[
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
                ["Cookies", "/cookies"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="footer-bottom-link">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}