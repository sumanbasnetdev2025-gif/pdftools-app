"use client";
import { useState, useRef } from "react";
import { Upload, Download, X, RefreshCw } from "lucide-react";

type Format = "jpg" | "png" | "webp" | "gif";

const CONVERSIONS: { from: Format; to: Format; label: string }[] = [
  { from: "jpg", to: "png", label: "JPG → PNG" },
  { from: "png", to: "jpg", label: "PNG → JPG" },
  { from: "jpg", to: "webp", label: "JPG → WebP" },
  { from: "png", to: "webp", label: "PNG → WebP" },
  { from: "webp", to: "png", label: "WebP → PNG" },
  { from: "webp", to: "jpg", label: "WebP → JPG" },
  { from: "jpg", to: "gif", label: "JPG → GIF" },
  { from: "png", to: "gif", label: "PNG → GIF" },
];

interface ConvertedFile { name: string; url: string; size: string; }

export default function ImageConvertPage() {
  const [selectedConversion, setSelectedConversion] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [converted, setConverted] = useState<ConvertedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [quality, setQuality] = useState(92);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conv = CONVERSIONS[selectedConversion];

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles(prev => [...prev, ...Array.from(newFiles)]);
    setConverted([]);
  };

  const convertAll = async () => {
    if (!files.length) return;
    setProcessing(true); setError(null);
    const results: ConvertedFile[] = [];
    try {
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        if (conv.to === "jpg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const mimeMap: Record<Format, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
        const mime = mimeMap[conv.to];
        const q = conv.to === "png" ? undefined : quality / 100;
        const dataUrl = canvas.toDataURL(mime, q);
        const ext = conv.to === "jpg" ? "jpg" : conv.to;
        const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
        const byteStr = atob(dataUrl.split(",")[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });
        const size = blob.size > 1024 * 1024 ? `${(blob.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(blob.size / 1024)} KB`;
        results.push({ name: newName, url: URL.createObjectURL(blob), size });
      }
      setConverted(results);
    } catch (e: any) {
      setError(e?.message || "Conversion failed");
    } finally { setProcessing(false); }
  };

  const downloadAll = () => {
    converted.forEach((f, i) => {
      setTimeout(() => {
        const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click();
      }, i * 300);
    });
  };

  return (
    <>
      <style>{`
        .ic-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; padding:40px 20px; }
        .ic-inner { max-width:800px; margin:0 auto; }
        .ic-title { font-family:'DM Serif Display',serif; font-size:clamp(1.8rem,4vw,2.8rem); color:#f0f0f0; margin-bottom:8px; }
        .ic-title em { color:#06B6D4; font-style:italic; }
        .ic-sub { font-size:0.9rem; color:#555; margin-bottom:36px; line-height:1.6; }
        .ic-conv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:8px; margin-bottom:28px; }
        .ic-conv-btn { padding:10px 8px; border-radius:10px; border:1px solid #1e1e1e; background:#111; color:#666; font-size:0.82rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; text-align:center; }
        .ic-conv-btn.active { border-color:#06B6D444; background:#001a1f; color:#06B6D4; }
        .ic-drop { border:2px dashed #1e1e1e; border-radius:16px; padding:48px 24px; text-align:center; cursor:pointer; transition:all 0.2s; background:#0f0f0f; margin-bottom:20px; }
        .ic-drop:hover { border-color:#06B6D444; background:#111; }
        .ic-drop-icon { font-size:2.5rem; margin-bottom:12px; }
        .ic-drop-text { font-size:0.9rem; color:#555; }
        .ic-file-list { display:flex; flex-direction:column; gap:6px; margin-bottom:20px; }
        .ic-file-item { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#111; border:1px solid #1e1e1e; border-radius:10px; }
        .ic-file-name { flex:1; font-size:0.82rem; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ic-file-size { font-size:0.75rem; color:#444; flex-shrink:0; }
        .ic-file-del { width:22px; height:22px; border-radius:6px; background:transparent; border:none; color:#444; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .ic-file-del:hover { background:#1a0808; color:#ef4444; }
        .ic-quality { margin-bottom:20px; }
        .ic-quality-label { font-size:0.78rem; font-weight:600; color:#666; margin-bottom:8px; display:flex; justify-content:space-between; }
        .ic-quality input[type=range] { width:100%; accent-color:#06B6D4; }
        .ic-actions { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; }
        .ic-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:10px; font-size:0.875rem; font-weight:700; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .ic-btn-primary { background:#06B6D4; color:#0a0a0a; }
        .ic-btn-primary:hover { opacity:0.88; }
        .ic-btn-primary:disabled { opacity:0.35; cursor:not-allowed; }
        .ic-btn-ghost { background:transparent; border:1px solid #222; color:#666; }
        .ic-btn-ghost:hover { background:#161616; color:#ccc; }
        .ic-results { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }
        .ic-result-card { background:#111; border:1px solid #1e1e1e; border-radius:12px; overflow:hidden; }
        .ic-result-preview { height:120px; background:#0a0a0a; display:flex; align-items:center; justify-content:center; }
        .ic-result-preview img { max-width:100%; max-height:100%; object-fit:contain; }
        .ic-result-info { padding:10px 12px; }
        .ic-result-name { font-size:0.75rem; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:4px; }
        .ic-result-size { font-size:0.7rem; color:#444; margin-bottom:8px; }
        .ic-result-dl { display:flex; align-items:center; gap:6px; padding:7px 10px; border-radius:8px; background:#06B6D422; color:#06B6D4; font-size:0.75rem; font-weight:700; text-decoration:none; transition:all 0.15s; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; width:100%; justify-content:center; }
        .ic-result-dl:hover { background:#06B6D433; }
        .ic-error { background:#1a0808; border:1px solid #2a1010; border-radius:10px; padding:12px 16px; color:#ef4444; font-size:0.85rem; margin-bottom:16px; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
      `}</style>

      <div className="ic-root">
        <div className="ic-inner">
          <h1 className="ic-title">Image <em>Converter</em></h1>
          <p className="ic-sub">Convert between JPG, PNG, WebP and GIF — free, fast, and entirely in your browser.</p>

          {/* Conversion type selector */}
          <div className="ic-conv-grid">
            {CONVERSIONS.map((c, i) => (
              <button key={i} className={`ic-conv-btn${selectedConversion === i ? " active" : ""}`}
                onClick={() => { setSelectedConversion(i); setConverted([]); }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div className="ic-drop" onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            <div className="ic-drop-icon">🖼️</div>
            <p className="ic-drop-text">Drop {conv.from.toUpperCase()} files here or click to browse</p>
          </div>
          <input ref={inputRef} type="file" multiple accept={`image/${conv.from}`} hidden onChange={e => addFiles(e.target.files)} />

          {/* File list */}
          {files.length > 0 && (
            <div className="ic-file-list">
              {files.map((f, i) => (
                <div key={i} className="ic-file-item">
                  <span className="ic-file-name">{f.name}</span>
                  <span className="ic-file-size">{f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`}</span>
                  <button className="ic-file-del" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Quality slider */}
          {conv.to !== "png" && conv.to !== "gif" && files.length > 0 && (
            <div className="ic-quality">
              <div className="ic-quality-label"><span>Quality</span><span>{quality}%</span></div>
              <input type="range" min={50} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} />
            </div>
          )}

          {error && <div className="ic-error">⚠️ {error}</div>}

          {/* Actions */}
          {files.length > 0 && (
            <div className="ic-actions">
              <button className="ic-btn ic-btn-primary" disabled={processing} onClick={convertAll}>
                <RefreshCw size={14} /> {processing ? "Converting…" : `Convert ${files.length} File${files.length > 1 ? "s" : ""}`}
              </button>
              {converted.length > 1 && (
                <button className="ic-btn ic-btn-ghost" onClick={downloadAll}><Download size={14} /> Download All</button>
              )}
              <button className="ic-btn ic-btn-ghost" onClick={() => { setFiles([]); setConverted([]); }}><X size={14} /> Clear</button>
            </div>
          )}

          {/* Results */}
          {converted.length > 0 && (
            <div className="ic-results">
              {converted.map((f, i) => (
                <div key={i} className="ic-result-card">
                  <div className="ic-result-preview"><img src={f.url} alt={f.name} /></div>
                  <div className="ic-result-info">
                    <p className="ic-result-name">{f.name}</p>
                    <p className="ic-result-size">{f.size}</p>
                    <a href={f.url} download={f.name} className="ic-result-dl"><Download size={12} /> Download</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}