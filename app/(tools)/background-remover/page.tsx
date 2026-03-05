"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, Download, RotateCcw, Wand2, Image as ImageIcon } from "lucide-react";

const BG_COLORS = [
  { label: "Transparent", value: "transparent" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Cream", value: "#fdf6e3" },
  { label: "Sky Blue", value: "#e0f2fe" },
  { label: "Passport Blue", value: "#003580" },
  { label: "Light Gray", value: "#f3f4f6" },
  { label: "Green Screen", value: "#00b140" },
];

export default function BackgroundRemoverPage() {
  const [original, setOriginal] = useState<string | null>(null);
  const [removed, setRemoved] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bgColor, setBgColor] = useState("transparent");
  const [customColor, setCustomColor] = useState("#ffffff");
  const [dragOver, setDragOver] = useState(false);
  const [view, setView] = useState<"split" | "original" | "result">("split");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setOriginal(url);
    setFileName(file.name);
    setRemoved(null);
    setProgress(0);
  }, []);

  const removeBackground = async () => {
    if (!original) return;
    setProcessing(true);
    setProgress(0);
    try {
      const { removeBackground: removeBg } = await import("@imgly/background-removal");

      const res = await fetch(original);
      const blob = await res.blob();

      const result = await removeBg(blob, {
        progress: (key: string, current: number, total: number) => {
          setProgress(Math.round((current / total) * 100));
        },
      });

      const url = URL.createObjectURL(result);
      setRemoved(url);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  const getResultWithBg = async (): Promise<string> => {
    if (!removed) return "";
    const activeColor = bgColor === "custom" ? customColor : bgColor;

    if (activeColor === "transparent") return removed;

    const canvas = document.createElement("canvas");
    const img = new window.Image();
    img.src = removed;
    await new Promise((r) => (img.onload = r));
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = activeColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const download = async () => {
    const url = await getResultWithBg();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "_nobg.png");
    a.click();
  };

  const activeColor = bgColor === "custom" ? customColor : bgColor;

  const checkerStyle = {
    backgroundImage: "linear-gradient(45deg,#2a2a2a 25%,transparent 25%),linear-gradient(-45deg,#2a2a2a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2a2a2a 75%),linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        .br-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; padding:48px 24px; }
        .br-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:20px; padding:24px; }
        .br-btn { display:inline-flex; align-items:center; gap:7px; padding:11px 22px; border-radius:11px; border:none; background:#F59E0B; color:#0a0a0a; font-size:0.875rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.15s; }
        .br-btn:hover:not(:disabled) { opacity:0.88; }
        .br-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .br-ghost { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; border:1px solid #222; background:transparent; color:#777; font-size:0.8rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .br-ghost:hover { background:#161616; color:#ccc; }
        .view-tab { padding:7px 14px; border-radius:8px; border:1px solid #1e1e1e; background:transparent; color:#555; font-size:0.78rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .view-tab.active { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.3); color:#F59E0B; }
        .drop-zone { border:2px dashed #1e1e1e; border-radius:16px; padding:56px 24px; text-align:center; cursor:pointer; background:#0f0f0f; transition:all 0.2s; }
        .drop-zone.over { border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.03); }
        .bg-swatch { width:32px; height:32px; border-radius:8px; cursor:pointer; border:2px solid transparent; transition:all 0.15s; flex-shrink:0; }
        .bg-swatch:hover { transform:scale(1.1); }
        .bg-swatch.active { border-color:#F59E0B; box-shadow:0 0 0 2px rgba(245,158,11,0.3); }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation:spin 0.8s linear infinite; }
        .progress-bar { height:4px; background:#1a1a1a; border-radius:99px; overflow:hidden; margin-top:10px; }
        .progress-fill { height:100%; background:#F59E0B; border-radius:99px; transition:width 0.3s; }
      `}</style>

      <div className="br-root">
        <div style={{ maxWidth: "940px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#F59E0B" }}>
              <Wand2 style={{ width: "22px", height: "22px" }} />
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.9rem", color: "#f0f0f0", marginBottom: "6px" }}>
              Background <span style={{ color: "#F59E0B", fontStyle: "italic" }}>Remover</span>
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#555" }}>AI-powered background removal. Runs entirely in your browser — no uploads to any server.</p>
          </div>

          {!original ? (
            <div
              className={`drop-zone${dragOver ? " over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadImage(f); }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#141414", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#555" }}>
                <Upload style={{ width: "20px", height: "20px" }} />
              </div>
              <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "4px" }}>Drop image here or <span style={{ color: "#F59E0B" }}>browse</span></p>
              <p style={{ fontSize: "0.75rem", color: "#333" }}>Best results with portraits, products, logos</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>

              {/* Preview area */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* View tabs */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {(["split", "original", "result"] as const).map((v) => (
                    <button key={v} className={`view-tab${view === v ? " active" : ""}`} onClick={() => setView(v)}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                  <button className="br-ghost" style={{ marginLeft: "auto" }} onClick={() => { setOriginal(null); setRemoved(null); }}>
                    <RotateCcw style={{ width: "12px", height: "12px" }} /> New
                  </button>
                </div>

                {/* Image display */}
                <div className="br-card" style={{ padding: "16px" }}>
                  {view === "split" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <p style={{ fontSize: "0.7rem", color: "#444", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Original</p>
                        <div style={{ borderRadius: "10px", overflow: "hidden", background: "#111" }}>
                          <img src={original} alt="original" style={{ width: "100%", display: "block", objectFit: "contain", maxHeight: "320px" }} />
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.7rem", color: "#444", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Result</p>
                        <div style={{ borderRadius: "10px", overflow: "hidden", ...checkerStyle, minHeight: "160px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          {removed ? (
                            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                              {activeColor !== "transparent" && (
                                <div style={{ position: "absolute", inset: 0, background: activeColor }} />
                              )}
                              <img src={removed} alt="result" style={{ width: "100%", display: "block", objectFit: "contain", maxHeight: "320px", position: "relative", zIndex: 1 }} />
                            </div>
                          ) : (
                            <p style={{ fontSize: "0.78rem", color: "#444", padding: "20px" }}>
                              {processing ? "Processing…" : "Click Remove Background →"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : view === "original" ? (
                    <img src={original} alt="original" style={{ width: "100%", borderRadius: "10px", objectFit: "contain", maxHeight: "420px" }} />
                  ) : (
                    <div style={{ borderRadius: "10px", overflow: "hidden", ...checkerStyle, position: "relative" }}>
                      {activeColor !== "transparent" && removed && (
                        <div style={{ position: "absolute", inset: 0, background: activeColor }} />
                      )}
                      {removed
                        ? <img src={removed} alt="result" style={{ width: "100%", display: "block", objectFit: "contain", maxHeight: "420px", position: "relative", zIndex: 1 }} />
                        : <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#444", fontSize: "0.85rem" }}>No result yet</p></div>
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Remove button */}
                <div className="br-card">
                  <button
                    className="br-btn"
                    style={{ width: "100%", justifyContent: "center", padding: "13px" }}
                    onClick={removeBackground}
                    disabled={processing}
                  >
                    {processing ? (
                      <svg className="spin" style={{ width: "15px", height: "15px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : <Wand2 style={{ width: "15px", height: "15px" }} />}
                    {processing ? `Removing… ${progress}%` : removed ? "Remove Again" : "Remove Background"}
                  </button>
                  {processing && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  {processing && (
                    <p style={{ fontSize: "0.72rem", color: "#444", marginTop: "6px", textAlign: "center" }}>
                      Processing your result (~40MB)
                    </p>
                  )}
                </div>

                {/* Background replacement */}
                {removed && (
                  <div className="br-card">
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3a3a3a", marginBottom: "12px" }}>
                      Replace Background
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      {BG_COLORS.map((c) => (
                        <div
                          key={c.value}
                          className={`bg-swatch${bgColor === c.value ? " active" : ""}`}
                          style={{
                            background: c.value === "transparent"
                              ? "linear-gradient(45deg,#2a2a2a 25%,transparent 25%),linear-gradient(-45deg,#2a2a2a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2a2a2a 75%),linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)"
                              : c.value,
                            backgroundSize: c.value === "transparent" ? "8px 8px" : undefined,
                            backgroundPosition: c.value === "transparent" ? "0 0,0 4px,4px -4px,-4px 0" : undefined,
                          }}
                          title={c.label}
                          onClick={() => setBgColor(c.value)}
                        />
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => { setCustomColor(e.target.value); setBgColor("custom"); }}
                        style={{ width: "32px", height: "32px", borderRadius: "8px", border: `2px solid ${bgColor === "custom" ? "#F59E0B" : "#1e1e1e"}`, background: "none", cursor: "pointer", padding: "1px" }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "#555" }}>Custom color</span>
                    </div>
                  </div>
                )}

                {/* Download */}
                {removed && (
                  <button className="br-btn" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={download}>
                    <Download style={{ width: "14px", height: "14px" }} /> Download PNG
                  </button>
                )}

                {/* Info */}
                <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: "12px", padding: "14px 16px" }}>
                  <p style={{ fontSize: "0.72rem", color: "#a0885a", lineHeight: 1.6 }}>
                    🔒 <strong style={{ color: "#c0a060" }}>100% Private</strong> — Pdf-Master runs entirely in your browser. Your images are never uploaded anywhere.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}