"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#user-menu-nav"))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const avatarLetter =
    user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const tools = [
    { href: "/merge", label: "🔗 Merge" },
    { href: "/split", label: "✂️ Split" },
    { href: "/compress", label: "🗜️ Compress" },
    { href: "/rotate", label: "🔄 Rotate" },
    { href: "/watermark", label: "💧 Watermark" },
    { href: "/protect", label: "🔒 Protect" },
    { href: "/ocr", label: "🔍 OCR" },
    { href: "/edit", label: "✏️ Edit" },
  ];

  const converts = [
    { href: "/convert/pdf-to-word", label: "PDF → Word" },
    { href: "/convert/pdf-to-jpg", label: "PDF → JPG" },
    { href: "/convert/jpg-to-pdf", label: "JPG → PDF" },
    { href: "/convert/word-to-pdf", label: "Word → PDF" },
    { href: "/convert/pdf-to-excel", label: "PDF → Excel" },
    { href: "/convert/excel-to-pdf", label: "Excel → PDF" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        .nav-dropdown {
          opacity: 0;
          visibility: hidden;
          transform: translateY(8px);
          transition: all 0.18s ease;
        }
        .nav-group:hover .nav-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled
            ? "rgba(10,10,10,0.95)"
            : "rgba(10,10,10,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1a1a1a",
          fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              flexShrink: 0,
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
                letterSpacing: "-0.01em",
              }}
            >
              PDF<span style={{ color: "#F59E0B" }}>Master</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flex: 1,
              justifyContent: "center",
            }}
            className="hidden-mobile"
          >
            {/* Tools dropdown */}
            <div className="nav-group" style={{ position: "relative" }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Tools <ChevronDown style={{ width: "13px", height: "13px" }} />
              </button>
              <div
                className="nav-dropdown"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "280px",
                  background: "#141414",
                  border: "1px solid #222",
                  borderRadius: "16px",
                  padding: "8px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2px",
                }}
              >
                {tools.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: "#a0a0a0",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                      transition: "all 0.15s",
                      display: "block",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = "#1e1e1e";
                      (e.target as HTMLElement).style.color = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = "transparent";
                      (e.target as HTMLElement).style.color = "#a0a0a0";
                    }}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Convert dropdown */}
            <div className="nav-group" style={{ position: "relative" }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Convert <ChevronDown style={{ width: "13px", height: "13px" }} />
              </button>
              <div
                className="nav-dropdown"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "240px",
                  background: "#141414",
                  border: "1px solid #222",
                  borderRadius: "16px",
                  padding: "8px",
                }}
              >
                {converts.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: "#a0a0a0",
                      fontSize: "0.82rem",
                      fontWeight: "500",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = "#1e1e1e";
                      (e.target as HTMLElement).style.color = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = "transparent";
                      (e.target as HTMLElement).style.color = "#a0a0a0";
                    }}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>

            {[
              { href: "/pricing", label: "Pricing" },
              { href: "/blog", label: "Blog" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: "#888",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#f0f0f0")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#888")
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {loading ? (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#1a1a1a",
                }}
              />
            ) : user ? (
              <div id="user-menu-nav" style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#141414",
                    border: "1px solid #222",
                    borderRadius: "10px",
                    padding: "6px 10px 6px 6px",
                    cursor: "pointer",
                    color: "#a0a0a0",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "7px",
                      background: "#F59E0B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0a0a0a",
                      fontSize: "0.75rem",
                      fontWeight: "800",
                    }}
                  >
                    {avatarLetter}
                  </div>
                  <ChevronDown style={{ width: "12px", height: "12px" }} />
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 8px)",
                      width: "220px",
                      background: "#141414",
                      border: "1px solid #222",
                      borderRadius: "16px",
                      overflow: "hidden",
                      zIndex: 200,
                    }}
                  >
                    <div
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #1e1e1e",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          color: "#e0e0e0",
                        }}
                      >
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#555",
                          marginTop: "2px",
                        }}
                      >
                        {user.email}
                      </p>
                    </div>
                    <div style={{ padding: "6px" }}>
                      {[
                        {
                          href: "/dashboard",
                          icon: LayoutDashboard,
                          label: "Dashboard",
                        },
                        {
                          href: "/settings",
                          icon: Settings,
                          label: "Settings",
                        },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            color: "#888",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.background =
                              "#1e1e1e";
                            (e.target as HTMLElement).style.color = "#e0e0e0";
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.background =
                              "transparent";
                            (e.target as HTMLElement).style.color = "#888";
                          }}
                        >
                          <Icon
                            style={{ width: "15px", height: "15px" }}
                          />
                          {label}
                        </Link>
                      ))}
                      <div
                        style={{
                          height: "1px",
                          background: "#1e1e1e",
                          margin: "4px 0",
                        }}
                      />
                      <button
                        onClick={handleSignOut}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.target as HTMLElement).style.background =
                            "#1a0a0a")
                        }
                        onMouseLeave={(e) =>
                          ((e.target as HTMLElement).style.background =
                            "transparent")
                        }
                      >
                        <LogOut style={{ width: "15px", height: "15px" }} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9px",
                    textDecoration: "none",
                    color: "#888",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "color 0.15s",
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "9px",
                    textDecoration: "none",
                    color: "#0a0a0a",
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    background: "#F59E0B",
                    transition: "opacity 0.15s",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9px",
                background: "#141414",
                border: "1px solid #222",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#888",
              }}
              className="mobile-menu-btn"
            >
              {menuOpen ? (
                <X style={{ width: "16px", height: "16px" }} />
              ) : (
                <Menu style={{ width: "16px", height: "16px" }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              borderTop: "1px solid #1a1a1a",
              background: "#0a0a0a",
              padding: "16px 24px 24px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              {[...tools, ...converts].map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: "#888",
                    fontSize: "0.8rem",
                    fontWeight: "500",
                    background: "#141414",
                    border: "1px solid #1e1e1e",
                  }}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      textAlign: "center",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: "#888",
                      fontSize: "0.85rem",
                      background: "#141414",
                      border: "1px solid #222",
                    }}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid #2a1010",
                      background: "transparent",
                      color: "#ef4444",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      textAlign: "center",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: "#888",
                      fontSize: "0.85rem",
                      background: "#141414",
                      border: "1px solid #222",
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      textAlign: "center",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: "#0a0a0a",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      background: "#F59E0B",
                    }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}