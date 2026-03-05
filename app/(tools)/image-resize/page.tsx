"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, Download, RotateCcw, Lock, Unlock, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";

interface ImageInfo {
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
}

const PRESETS = [
  { label: "HD", w: 1280, h: 720 },
  { label: "Full HD", w: 1920, h: 1080 },
  { label: "4K", w: 3840, h: 2160 },
  { label: "Instagram", w: 1080, h: 1080 },
  { label: "Twitter", w: 1500, h: 500 },
  { label: "Facebook", w: 1200, h: 630 },
  { label: "A4 300dpi", w: 2480, h: 3508 },
];

export default function ImageResizePage() {
  const [image, setImage] = useState<ImageInfo | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [locked, setLocked] = useState(true);
  const [quality, setQuality] = useState(92);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setImage({ file, url, width: img.naturalWidth, height: img.naturalHeight, size: file.size });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setResultUrl(null);
      setResultSize(null);
    };
    img.src = url;
  }, []);

  const handleWidthChange = (v: number) => {
    setWidth(v);
    if (locked && image) setHeight(Math.round((v / image.width) * image.height));
  };

  const handleHeightChange = (v: number) => {
    setHeight(v);
    if (locked && image) setWidth(Math.round((v / image.height) * image.width));
  };

  const applyPreset = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
    setLocked(false);
  };

  const process = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const img = new window.Image();
      img.src = image.url;
      await new Promise((r) => (img.onload = r));
      ctx.drawImage(img, 0, 0, width, height);

      const mime = `image/${format}`;
      const q = format === "png" ? 1 : quality / 100;

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setResultSize(blob.size);
          setProcessing(false);
        },
        mime,
        q
      );
    } catch {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !image) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = image.file.name.replace(/\.[^.]+$/, `_${width}x${height}.${format}`);
    a.click();
  };

  const fmt = (b: number) =>
    b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        .ir-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; padding:48px 24px; }
        .ir-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:20px; padding:28px; }
        .ir-label { font-size:0.65rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#3a3a3a; margin-bottom:10px; display:block; }
        .ir-input { width:100%; background:#111; border:1px solid #1e1e1e; border-radius:10px; padding:10px 14px; color:#e0e0e0; font-size:0.875rem; outline:none; font-family:'DM Sans',sans-serif; box-sizing:border-box; transition:border-color 0.15s; }
        .ir-input:focus { border-color:rgba(245,158,11,0.4); }
        .ir-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:10px; border:none; background:#F59E0B; color:#0a0a0a; font-size:0.85rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.15s; }
        .ir-btn:hover:not(:disabled) { opacity:0.88; }
        .ir-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .ir-ghost { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:10px; border:1px solid #222; background:transparent; color:#777; font-size:0.8rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .ir-ghost:hover { background:#161616; color:#ccc; }
        .preset-btn { padding:6px 11px; border-radius:8px; border:1px solid #1e1e1e; background:#111; color:#666; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap; }
        .preset-btn:hover { background:#1a1a1a; color:#F59E0B; border-color:rgba(245,158,11,0.25); }
        .drop-zone { border:2px dashed #1e1e1e; border-radius:16px; padding:52px 24px; text-align:center; cursor:pointer; background:#0f0f0f; transition:all 0.2s; }
        .drop-zone.over { border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.03); }
        .stat-chip { background:#111; border:1px solid #1a1a1a; border-radius:8px; padding:8px 12px; font-size:0.75rem; color:#555; }
        .stat-chip strong { color:#aaa; display:block; font-size:0.85rem; margin-bottom:2px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation:spin 0.8s linear infinite; }
      `}</style>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="ir-root">
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#F59E0B" }}>
              <ImageIcon style={{ width: "22px", height: "22px" }} />
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.9rem", color: "#f0f0f0", marginBottom: "6px" }}>
              Image <span style={{ color: "#F59E0B", fontStyle: "italic" }}>Resize & Compress</span>
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#555" }}>Resize to exact dimensions. Compress without visible quality loss.</p>
          </div>

          {!image ? (
            <div
              className={`drop-zone${dragOver ? " over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadImage(f); }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: "#141414", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#555" }}>
                <Upload style={{ width: "20px", height: "20px" }} />
              </div>
              <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "4px" }}>Drop image here or <span style={{ color: "#F59E0B" }}>browse</span></p>
              <p style={{ fontSize: "0.75rem", color: "#333" }}>PNG, JPG, WEBP, GIF supported</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>

              {/* Preview */}
              <div className="ir-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", color: "#555", fontWeight: 600 }}>{image.file.name}</span>
                  <button className="ir-ghost" onClick={() => { setImage(null); setResultUrl(null); }}>
                    <RotateCcw style={{ width: "12px", height: "12px" }} /> New
                  </button>
                </div>

                {/* Original stats */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { label: "Original size", value: fmt(image.size) },
                    { label: "Original dims", value: `${image.width} × ${image.height}` },
                    ...(resultSize ? [{ label: "Output size", value: fmt(resultSize) }, { label: "Saved", value: `${Math.round((1 - resultSize / image.size) * 100)}%` }] : []),
                  ].map((s) => (
                    <div key={s.label} className="stat-chip">
                      <strong>{s.value}</strong>
                      {s.label}
                    </div>
                  ))}
                </div>

                {/* Image preview */}
                <div style={{ background: "#111", borderRadius: "12px", overflow: "hidden", border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "220px" }}>
                  <img
                    src={resultUrl || image.url}
                    alt="preview"
                    style={{ maxWidth: "100%", maxHeight: "360px", objectFit: "contain", display: "block" }}
                  />
                </div>

                {resultUrl && (
                  <button className="ir-btn" style={{ width: "100%", justifyContent: "center" }} onClick={download}>
                    <Download style={{ width: "14px", height: "14px" }} /> Download {format.toUpperCase()}
                  </button>
                )}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Presets */}
                <div className="ir-card">
                  <span className="ir-label">Quick Presets</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {PRESETS.map((p) => (
                      <button key={p.label} className="preset-btn" onClick={() => applyPreset(p.w, p.h)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="ir-card">
                  <span className="ir-label">Dimensions (px)</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.7rem", color: "#444", display: "block", marginBottom: "4px" }}>Width</label>
                      <input type="number" className="ir-input" value={width} min={1}
                        onChange={(e) => handleWidthChange(Number(e.target.value))} />
                    </div>
                    <button
                      onClick={() => setLocked(!locked)}
                      style={{ marginTop: "18px", width: "34px", height: "34px", borderRadius: "9px", background: locked ? "rgba(245,158,11,0.1)" : "#111", border: `1px solid ${locked ? "rgba(245,158,11,0.3)" : "#1e1e1e"}`, color: locked ? "#F59E0B" : "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      {locked ? <Lock style={{ width: "13px", height: "13px" }} /> : <Unlock style={{ width: "13px", height: "13px" }} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.7rem", color: "#444", display: "block", marginBottom: "4px" }}>Height</label>
                      <input type="number" className="ir-input" value={height} min={1}
                        onChange={(e) => handleHeightChange(Number(e.target.value))} />
                    </div>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#333", marginTop: "6px" }}>
                    {locked ? "🔒 Aspect ratio locked" : "🔓 Free resize"}
                  </p>
                </div>

                {/* Format & Quality */}
                <div className="ir-card">
                  <span className="ir-label">Output Format</span>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                    {(["png", "jpeg", "webp"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        style={{ flex: 1, padding: "8px", borderRadius: "9px", border: `1px solid ${format === f ? "rgba(245,158,11,0.3)" : "#1e1e1e"}`, background: format === f ? "rgba(245,158,11,0.08)" : "#111", color: format === f ? "#F59E0B" : "#666", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", textTransform: "uppercase" }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {format !== "png" && (
                    <>
                      <span className="ir-label">Quality: {quality}%</span>
                      <input
                        type="range" min={1} max={100} value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "#F59E0B", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#333", marginTop: "2px" }}>
                        <span>Smaller file</span>
                        <span>Max quality</span>
                      </div>
                    </>
                  )}
                </div>

                <button className="ir-btn" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={process} disabled={processing || !image}>
                  {processing ? (
                    <svg className="spin" style={{ width: "15px", height: "15px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : <ImageIcon style={{ width: "14px", height: "14px" }} />}
                  {processing ? "Processing…" : "Resize & Export"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}