"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, Download, RotateCcw, Camera, ZoomIn, ZoomOut, Move } from "lucide-react";

const STANDARD_SIZES = [
  { label: "Passport (35×45mm)", w: 35, h: 45, dpi: 300 },
  { label: "Passport USA (51×51mm)", w: 51, h: 51, dpi: 300 },
  { label: "Visa China (33×48mm)", w: 33, h: 48, dpi: 300 },
  { label: "Visa India (35×35mm)", w: 35, h: 35, dpi: 300 },
  { label: "ID Card (25×35mm)", w: 25, h: 35, dpi: 300 },
  { label: "ID Card EU (35×45mm)", w: 35, h: 45, dpi: 300 },
  { label: "2×2 inch (USA)", w: 51, h: 51, dpi: 300 },
  { label: "Custom", w: 0, h: 0, dpi: 300 },
];

const PRINT_LAYOUTS = [
  { label: "1 photo", cols: 1, rows: 1 },
  { label: "4 photos (2×2)", cols: 2, rows: 2 },
  { label: "6 photos (3×2)", cols: 3, rows: 2 },
  { label: "8 photos (4×2)", cols: 4, rows: 2 },
];

const BG_OPTIONS = [
  { label: "White", value: "#ffffff" },
  { label: "Light Blue", value: "#c8e6f7" },
  { label: "Light Gray", value: "#f0f0f0" },
  { label: "Original", value: "original" },
];

export default function PassportPhotoPage() {
  const [original, setOriginal] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [dpi, setDpi] = useState(300);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [printLayout, setPrintLayout] = useState(1);

  // Crop state (percentage offsets from center)
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const getSize = () => {
    const preset = STANDARD_SIZES[selectedPreset];
    if (preset.label === "Custom") return { w: customW, h: customH, dpi };
    return { w: preset.w, h: preset.h, dpi: preset.dpi };
  };

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setOriginal(url);
      setFileName(file.name);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setResultUrl(null);
    };
    img.src = url;
  }, []);

  // Drag to pan
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
    setOffsetX(dragStart.ox + dx);
    setOffsetY(dragStart.oy + dy);
  };
  const onMouseUp = () => { setIsDragging(false); setDragStart(null); };

  // Generate passport photo
  const generate = async () => {
    if (!original) return;
    setProcessing(true);
    try {
      const size = getSize();
      const pxW = Math.round((size.w / 25.4) * size.dpi);
      const pxH = Math.round((size.h / 25.4) * size.dpi);

      const layout = PRINT_LAYOUTS[printLayout];
      const canvasW = pxW * layout.cols + (layout.cols - 1) * 10;
      const canvasH = pxH * layout.rows + (layout.rows - 1) * 10;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasW, canvasH);

      const img = new window.Image();
      img.src = original;
      await new Promise((r) => (img.onload = r));

      // For each photo slot
      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.cols; col++) {
          const dx = col * (pxW + 10);
          const dy = row * (pxH + 10);

          ctx.save();
          ctx.beginPath();
          ctx.rect(dx, dy, pxW, pxH);
          ctx.clip();

          // Fill background
          if (bgColor !== "original") {
            ctx.fillStyle = bgColor;
            ctx.fillRect(dx, dy, pxW, pxH);
          }

          // Draw image with zoom & pan
          const scale = zoom;
          const imgAspect = img.naturalWidth / img.naturalHeight;
          const frameAspect = pxW / pxH;

          let drawW: number, drawH: number;
          if (imgAspect > frameAspect) {
            drawH = pxH * scale;
            drawW = drawH * imgAspect;
          } else {
            drawW = pxW * scale;
            drawH = drawW / imgAspect;
          }

          const cx = dx + pxW / 2 + (offsetX / 100) * pxW;
          const cy = dy + pxH / 2 + (offsetY / 100) * pxH;

          ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
          ctx.restore();

          // Border
          ctx.strokeStyle = "#cccccc";
          ctx.lineWidth = 1;
          ctx.strokeRect(dx, dy, pxW, pxH);
        }
      }

      setResultUrl(canvas.toDataURL("image/png", 1.0));
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const size = getSize();
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `passport_${size.w}x${size.h}mm.png`;
    a.click();
  };

  const size = getSize();
  const isCustom = STANDARD_SIZES[selectedPreset].label === "Custom";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        .pp-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; padding:48px 24px; }
        .pp-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:18px; padding:22px; }
        .pp-label { font-size:0.63rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#3a3a3a; margin-bottom:10px; display:block; }
        .pp-input { width:100%; background:#111; border:1px solid #1e1e1e; border-radius:9px; padding:9px 12px; color:#e0e0e0; font-size:0.85rem; outline:none; font-family:'DM Sans',sans-serif; box-sizing:border-box; transition:border-color 0.15s; }
        .pp-input:focus { border-color:rgba(245,158,11,0.4); }
        .pp-btn { display:inline-flex; align-items:center; gap:7px; padding:11px 20px; border-radius:11px; border:none; background:#F59E0B; color:#0a0a0a; font-size:0.875rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.15s; width:100%; justify-content:center; }
        .pp-btn:hover:not(:disabled) { opacity:0.88; }
        .pp-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .pp-ghost { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:9px; border:1px solid #222; background:transparent; color:#777; font-size:0.78rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .pp-ghost:hover { background:#161616; color:#ccc; }
        .preset-chip { padding:8px 12px; border-radius:9px; border:1px solid #1e1e1e; background:#111; color:#666; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; text-align:left; width:100%; }
        .preset-chip:hover { background:#1a1a1a; color:#ccc; }
        .preset-chip.active { background:rgba(245,158,11,0.08); border-color:rgba(245,158,11,0.3); color:#F59E0B; }
        .drop-zone { border:2px dashed #1e1e1e; border-radius:16px; padding:52px 24px; text-align:center; cursor:pointer; background:#0f0f0f; transition:all 0.2s; }
        .drop-zone.over { border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.03); }
        .zoom-btn { width:30px; height:30px; border-radius:8px; border:1px solid #1e1e1e; background:#111; color:#666; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .zoom-btn:hover { background:#1a1a1a; color:#ccc; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation:spin 0.8s linear infinite; }
      `}</style>

      <div className="pp-root">
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#F59E0B" }}>
              <Camera style={{ width: "22px", height: "22px" }} />
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.9rem", color: "#f0f0f0", marginBottom: "6px" }}>
              Passport <span style={{ color: "#F59E0B", fontStyle: "italic" }}>Photo Maker</span>
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#555" }}>Custom size passport & ID photos at 300 DPI print quality. No quality loss.</p>
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
                <Camera style={{ width: "20px", height: "20px" }} />
              </div>
              <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "4px" }}>Drop portrait photo here or <span style={{ color: "#F59E0B" }}>browse</span></p>
              <p style={{ fontSize: "0.75rem", color: "#333" }}>PNG or JPG recommended — high resolution for best print quality</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

              {/* Left: crop preview + result */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Crop tool */}
                <div className="pp-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#666" }}>
                      Position & Crop
                      <span style={{ color: "#444", marginLeft: "8px", fontSize: "0.72rem" }}>
                        {naturalW} × {naturalH}px
                      </span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button className="zoom-btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
                        <ZoomOut style={{ width: "13px", height: "13px" }} />
                      </button>
                      <span style={{ fontSize: "0.75rem", color: "#555", minWidth: "40px", textAlign: "center" }}>
                        {Math.round(zoom * 100)}%
                      </span>
                      <button className="zoom-btn" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}>
                        <ZoomIn style={{ width: "13px", height: "13px" }} />
                      </button>
                      <button className="pp-ghost" onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }}>
                        <RotateCcw style={{ width: "11px", height: "11px" }} /> Reset
                      </button>
                    </div>
                  </div>

                  {/* Crop frame */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      ref={previewRef}
                      style={{
                        width: "280px",
                        height: `${Math.round(280 * (size.h / size.w))}px`,
                        overflow: "hidden",
                        borderRadius: "8px",
                        border: "2px solid rgba(245,158,11,0.4)",
                        cursor: isDragging ? "grabbing" : "grab",
                        position: "relative",
                        background: bgColor !== "original" ? bgColor : "#111",
                        flexShrink: 0,
                      }}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseUp={onMouseUp}
                      onMouseLeave={onMouseUp}
                    >
                      <img
                        src={original}
                        alt="crop"
                        draggable={false}
                        style={{
                          position: "absolute",
                          width: `${100 * zoom}%`,
                          height: `${100 * zoom}%`,
                          objectFit: "cover",
                          top: `${50 + offsetY}%`,
                          left: `${50 + offsetX}%`,
                          transform: "translate(-50%, -50%)",
                          userSelect: "none",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Crop guide overlay */}
                      <div style={{
                        position: "absolute", inset: 0,
                        border: "1px solid rgba(255,255,255,0.2)",
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
                        backgroundSize: "33.33% 33.33%",
                        pointerEvents: "none",
                      }} />
                    </div>
                  </div>

                  <p style={{ fontSize: "0.7rem", color: "#333", textAlign: "center", marginTop: "10px" }}>
                    <Move style={{ width: "10px", height: "10px", display: "inline", marginRight: "4px" }} />
                    Drag to reposition • Scroll to zoom
                  </p>
                </div>

                {/* Result */}
                {resultUrl && (
                  <div className="pp-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#666" }}>Ready to Print</span>
                      <span style={{ fontSize: "0.72rem", color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "3px 10px", borderRadius: "99px" }}>
                        {size.w}×{size.h}mm @ {size.dpi}dpi
                      </span>
                    </div>
                    <div style={{ background: "#111", borderRadius: "10px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                      <img src={resultUrl} alt="result" style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "4px" }} />
                    </div>
                    <button className="pp-btn" style={{ marginTop: "12px" }} onClick={download}>
                      <Download style={{ width: "14px", height: "14px" }} />
                      Download Print-Ready PNG
                    </button>
                  </div>
                )}
              </div>

              {/* Right: settings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* File info */}
                <div className="pp-card" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Camera style={{ width: "16px", height: "16px", color: "#F59E0B" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8rem", color: "#ccc", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</p>
                    <p style={{ fontSize: "0.72rem", color: "#444" }}>{naturalW} × {naturalH} px</p>
                  </div>
                  <button className="pp-ghost" onClick={() => { setOriginal(null); setResultUrl(null); }}>
                    <RotateCcw style={{ width: "11px", height: "11px" }} />
                  </button>
                </div>

                {/* Standard sizes */}
                <div className="pp-card">
                  <span className="pp-label">Standard Sizes</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {STANDARD_SIZES.map((s, i) => (
                      <button
                        key={s.label}
                        className={`preset-chip${selectedPreset === i ? " active" : ""}`}
                        onClick={() => setSelectedPreset(i)}
                      >
                        {s.label}
                        {s.w > 0 && (
                          <span style={{ color: "#444", marginLeft: "6px", fontSize: "0.7rem" }}>
                            {s.w}×{s.h}mm
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom size */}
                {isCustom && (
                  <div className="pp-card">
                    <span className="pp-label">Custom Size (mm)</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "#444", display: "block", marginBottom: "4px" }}>Width</label>
                        <input type="number" className="pp-input" value={customW} min={1} onChange={(e) => setCustomW(Number(e.target.value))} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "#444", display: "block", marginBottom: "4px" }}>Height</label>
                        <input type="number" className="pp-input" value={customH} min={1} onChange={(e) => setCustomH(Number(e.target.value))} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "#444", display: "block", marginBottom: "4px" }}>DPI</label>
                        <input type="number" className="pp-input" value={dpi} min={72} max={600} onChange={(e) => setDpi(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Background */}
                <div className="pp-card">
                  <span className="pp-label">Background</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {BG_OPTIONS.map((b) => (
                      <button
                        key={b.value}
                        onClick={() => setBgColor(b.value)}
                        style={{
                          padding: "6px 12px", borderRadius: "8px",
                          border: `1px solid ${bgColor === b.value ? "rgba(245,158,11,0.4)" : "#1e1e1e"}`,
                          background: bgColor === b.value ? "rgba(245,158,11,0.08)" : "#111",
                          color: bgColor === b.value ? "#F59E0B" : "#666",
                          fontSize: "0.75rem", fontWeight: 600,
                          cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                    <input
                      type="color"
                      value={bgColor.startsWith("#") ? bgColor : "#ffffff"}
                      onChange={(e) => setBgColor(e.target.value)}
                      style={{ width: "28px", height: "28px", borderRadius: "7px", border: "1px solid #1e1e1e", background: "none", cursor: "pointer", padding: "1px" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#555" }}>Custom background</span>
                  </div>
                </div>

                {/* Print layout */}
                <div className="pp-card">
                  <span className="pp-label">Print Layout</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {PRINT_LAYOUTS.map((l, i) => (
                      <button
                        key={l.label}
                        className={`preset-chip${printLayout === i ? " active" : ""}`}
                        onClick={() => setPrintLayout(i)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate */}
                <button className="pp-btn" onClick={generate} disabled={processing || !original}>
                  {processing ? (
                    <svg className="spin" style={{ width: "15px", height: "15px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : <Camera style={{ width: "15px", height: "15px" }} />}
                  {processing ? "Generating…" : "Generate Photo"}
                </button>

                {/* Info */}
                <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: "12px", padding: "14px 16px" }}>
                  <p style={{ fontSize: "0.7rem", color: "#a0885a", lineHeight: 1.65 }}>
                    Output: <strong style={{ color: "#c0a060" }}>{size.w}×{size.h}mm</strong> at <strong style={{ color: "#c0a060" }}>{size.dpi} DPI</strong> = <strong style={{ color: "#c0a060" }}>{Math.round((size.w / 25.4) * size.dpi)} × {Math.round((size.h / 25.4) * size.dpi)} px</strong>. Print-ready PNG with no quality loss.
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