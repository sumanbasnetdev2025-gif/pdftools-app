"use client";
import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, AlertCircle, Download, RotateCcw } from "lucide-react";

export default function ProtectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [useOwner, setUseOwner] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const getStrength = (p: string) => {
    if (!p) return null;
    if (p.length < 4) return { label: "Too weak", color: "#ef4444", w: "25%" };
    if (p.length < 7) return { label: "Weak", color: "#f97316", w: "50%" };
    if (p.length < 10) return { label: "Good", color: "#eab308", w: "75%" };
    return { label: "Strong", color: "#22c55e", w: "100%" };
  };

  const strength = getStrength(userPassword);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Only PDF files accepted.");
      return;
    }
    setFile(f);
    setError(null);
    setDone(false);
  };

  const handleProtect = async () => {
    if (!file || !userPassword) return;
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userPassword", userPassword);
      if (useOwner && ownerPassword) fd.append("ownerPassword", ownerPassword);

      const res = await fetch("/api/protect", { method: "POST", body: fd });

      if (!res.ok) {
        const data = await res.json();
        // If server tools not installed, do client-side warning
        if (res.status === 501) {
          setError(
            "Server-side encryption not available. Install qpdf or Ghostscript on your server. " +
              (data.install?.windows || "")
          );
        } else {
          setError(data.error || "Protection failed.");
        }
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".pdf", "_protected.pdf");
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setUserPassword("");
    setOwnerPassword("");
    setDone(false);
    setError(null);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e0e0e0",
      padding: "48px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        .protect-input {
          width: 100%;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 10px;
          padding: 11px 14px;
          color: #e0e0e0;
          font-size: 0.875rem;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .protect-input:focus { border-color: rgba(245,158,11,0.4); }
        .protect-btn {
          width: 100%;
          padding: 13px;
          border-radius: 11px;
          border: none;
          background: #F59E0B;
          color: #0a0a0a;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .protect-btn:hover:not(:disabled) { opacity: 0.88; }
        .protect-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .drop-zone {
          border: 2px dashed #1e1e1e;
          border-radius: 16px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #0f0f0f;
        }
        .drop-zone.over {
          border-color: rgba(245,158,11,0.4);
          background: rgba(245,158,11,0.04);
        }
        .toggle-check {
          width: 18px; height: 18px;
          accent-color: #F59E0B;
          cursor: pointer;
        }
        .eye-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #555; cursor: pointer;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .eye-btn:hover { color: #aaa; }
      `}</style>

      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "16px",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Lock style={{ width: "22px", height: "22px", color: "#F59E0B" }} />
          </div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "1.8rem", color: "#f0f0f0", marginBottom: "6px",
          }}>
            Protect <span style={{ color: "#F59E0B", fontStyle: "italic" }}>PDF</span>
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.6 }}>
            Encrypt your PDF with a password. Requires qpdf or Ghostscript on the server.
          </p>
        </div>

        <div style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "20px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>

          {/* Drop zone */}
          {!file ? (
            <div
              className={`drop-zone${dragOver ? " over" : ""}`}
              onClick={() => document.getElementById("protect-file-input")?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px",
                background: "#141414", border: "1px solid #222",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <Lock style={{ width: "18px", height: "18px", color: "#555" }} />
              </div>
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "4px" }}>
                Drop PDF here or <span style={{ color: "#F59E0B" }}>browse</span>
              </p>
              <p style={{ fontSize: "0.75rem", color: "#333" }}>PDF files only</p>
              <input
                id="protect-file-input"
                type="file"
                accept=".pdf"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "#111", border: "1px solid #1e1e1e",
              borderRadius: "12px", padding: "12px 14px",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "rgba(245,158,11,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Lock style={{ width: "16px", height: "16px", color: "#F59E0B" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.85rem", color: "#ccc", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#444" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={reset}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "4px" }}
              >
                <RotateCcw style={{ width: "14px", height: "14px" }} />
              </button>
            </div>
          )}

          {/* User password */}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#666", display: "block", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Open Password <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showUser ? "text" : "password"}
                className="protect-input"
                placeholder="Password to open the PDF"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                style={{ paddingRight: "42px" }}
              />
              <button className="eye-btn" onClick={() => setShowUser(!showUser)}>
                {showUser
                  ? <EyeOff style={{ width: "15px", height: "15px" }} />
                  : <Eye style={{ width: "15px", height: "15px" }} />
                }
              </button>
            </div>

            {/* Strength bar */}
            {strength && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ height: "3px", background: "#1a1a1a", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: strength.w, background: strength.color, borderRadius: "99px", transition: "all 0.3s" }} />
                </div>
                <p style={{ fontSize: "0.72rem", color: strength.color, marginTop: "4px" }}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Owner password toggle */}
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
            }}>
              <input
                type="checkbox"
                className="toggle-check"
                checked={useOwner}
                onChange={(e) => setUseOwner(e.target.checked)}
              />
              <span style={{ fontSize: "0.82rem", color: "#666" }}>
                Set separate owner/permissions password
              </span>
            </label>

            {useOwner && (
              <div style={{ marginTop: "10px", position: "relative" }}>
                <input
                  type={showOwner ? "text" : "password"}
                  className="protect-input"
                  placeholder="Owner password (for permissions)"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  style={{ paddingRight: "42px" }}
                />
                <button className="eye-btn" onClick={() => setShowOwner(!showOwner)}>
                  {showOwner
                    ? <EyeOff style={{ width: "15px", height: "15px" }} />
                    : <Eye style={{ width: "15px", height: "15px" }} />
                  }
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px", padding: "12px 14px",
              display: "flex", gap: "10px", alignItems: "flex-start",
            }}>
              <AlertCircle style={{ width: "15px", height: "15px", color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "0.8rem", color: "#f87171", lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Success */}
          {done && (
            <div style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "10px", padding: "12px 14px",
              display: "flex", gap: "10px", alignItems: "center",
            }}>
              <ShieldCheck style={{ width: "16px", height: "16px", color: "#22c55e", flexShrink: 0 }} />
              <p style={{ fontSize: "0.82rem", color: "#86efac" }}>PDF protected and downloaded!</p>
            </div>
          )}

          {/* Button */}
          <button
            className="protect-btn"
            onClick={handleProtect}
            disabled={!file || !userPassword || loading}
          >
            {loading ? (
              <>
                <svg style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Encrypting…
              </>
            ) : (
              <>
                <Lock style={{ width: "15px", height: "15px" }} />
                Protect PDF
              </>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Info box */}
        <div style={{
          marginTop: "20px",
          background: "rgba(245,158,11,0.05)",
          border: "1px solid rgba(245,158,11,0.1)",
          borderRadius: "12px", padding: "16px 18px",
        }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a0885a", marginBottom: "8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Server Requirements
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {[
              ["Windows", "winget install qpdf"],
              ["Mac", "brew install qpdf"],
              ["Linux", "apt install qpdf"],
              ["Vercel", "Use CloudConvert API"],
            ].map(([env, cmd]) => (
              <div key={env} style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.7rem", color: "#555", minWidth: "52px" }}>{env}</span>
                <code style={{ fontSize: "0.72rem", color: "#888", fontFamily: "'Courier New', monospace", background: "#111", padding: "2px 6px", borderRadius: "5px" }}>
                  {cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}