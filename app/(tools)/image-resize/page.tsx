"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, Download, X, Lock, Unlock, RefreshCw } from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  originalW: number;
  originalH: number;
  previewUrl: string;
  resultUrl?: string;
  resultSize?: string;
  status: "idle" | "processing" | "done" | "error";
}

const PRESETS = [
  { label: "HD", w: 1280, h: 720 },
  { label: "Full HD", w: 1920, h: 1080 },
  { label: "4K", w: 3840, h: 2160 },
  { label: "Instagram", w: 1080, h: 1080 },
  { label: "Twitter", w: 1200, h: 675 },
  { label: "Facebook", w: 1200, h: 630 },
  { label: "A4 300dpi", w: 2480, h: 3508 },
];

const FORMATS = ["original", "jpg", "png", "webp"] as const;
type OutputFormat = typeof FORMATS[number];

export default function ImageResizePage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [lockRatio, setLockRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [quality, setQuality] = useState(92);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadImage = (file: File): Promise<ImageFile> => new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => res({ id: `img-${Date.now()}-${Math.random()}`, file, originalW: img.width, originalH: img.height, previewUrl: url, status: "idle" });
    img.onerror = rej;
    img.src = url;
  });

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const loaded = await Promise.all(Array.from(fileList).map(loadImage));
    setImages(prev => [...prev, ...loaded]);
    if (loaded.length > 0 && !width) {
      setWidth(loaded[0].originalW);
      setHeight(loaded[0].originalH);
    }
  };

  const applyPreset = (w: number, h: number) => { setWidth(w); setHeight(h); };

  const onWidthChange = (v: number) => {
    setWidth(v);
    if (lockRatio && images.length > 0) {
      const ratio = images[0].originalH / images[0].originalW;
      setHeight(Math.round(v * ratio));
    }
  };

  const onHeightChange = (v: number) => {
    setHeight(v);
    if (lockRatio && images.length > 0) {
      const ratio = images[0].originalW / images[0].originalH;
      setWidth(Math.round(v * ratio));
    }
  };

  const resizeAll = async () => {
    if (!images.length || !width || !height) return;
    setProcessing(true);
    const updated = [...images];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: "processing" };
      setImages([...updated]);
      try {
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const el = new Image(); el.onload = () => res(el); el.onerror = rej;
          el.src = updated[i].previewUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        const fmt = outputFormat === "original" ? updated[i].file.type : `image/${outputFormat === "jpg" ? "jpeg" : outputFormat}`;
        const q = fmt === "image/png" ? undefined : quality / 100;
        const dataUrl = canvas.toDataURL(fmt, q);
        const byteStr = atob(dataUrl.split(",")[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let j = 0; j < byteStr.length; j++) arr[j] = byteStr.charCodeAt(j);
        const blob = new Blob([arr], { type: fmt });
        const size = blob.size > 1048576 ? `${(blob.size / 1048576).toFixed(1)} MB` : `${Math.round(blob.size / 1024)} KB`;
        updated[i] = { ...updated[i], resultUrl: URL.createObjectURL(blob), resultSize: size, status: "done" };
      } catch {
        updated[i] = { ...updated[i], status: "error" };
      }
      setImages([...updated]);
    }
    setProcessing(false);
  };

  const downloadAll = () => {
    images.filter(i => i.resultUrl).forEach((img, i) => {
      setTimeout(() => {
        const ext = outputFormat === "original" ? img.file.name.split(".").pop() : outputFormat;
        const name = img.file.name.replace(/\.[^.]+$/, `_${width}x${height}.${ext}`);
        const a = document.createElement("a"); a.href = img.resultUrl!; a.download = name; a.click();
      }, i * 300);
    });
  };

  const removeImage = (id: string) => setImages(p => p.filter(i => i.id !== id));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        .ir-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; }
        .ir-inner { max-width:960px; margin:0 auto; padding:40px 20px; }
        .ir-title { font-family:'DM Serif Display',serif; font-size:clamp(1.8rem,4vw,2.8rem); color:#f0f0f0; margin-bottom:8px; }
        .ir-title em { color:#F59E0B; font-style:italic; }
        .ir-sub { font-size:0.9rem; color:#555; margin-bottom:36px; line-height:1.6; }
        .ir-layout { display:grid; grid-template-columns:280px 1fr; gap:24px; }
        .ir-controls { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:20px; height:fit-content; position:sticky; top:80px; }
        .ir-lbl { font-size:0.68rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#444; margin-bottom:8px; }
        .ir-presets { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .ir-preset { padding:7px 6px; border-radius:8px; border:1px solid #1e1e1e; background:#111; color:#666; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; text-align:center; transition:all 0.15s; }
        .ir-preset:hover { border-color:#F59E0B44; color:#F59E0B; background:#141000; }
        .ir-dims { display:flex; align-items:center; gap:8px; }
        .ir-input { flex:1; background:#111; border:1px solid #1e1e1e; border-radius:9px; padding:8px 12px; color:#e0e0e0; font-size:0.9rem; outline:none; font-family:'DM Sans',sans-serif; width:100%; text-align:center; }
        .ir-input:focus { border-color:#F59E0B44; }
        .ir-lock { width:30px; height:30px; border-radius:8px; background:transparent; border:1px solid #1e1e1e; color:#555; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; }
        .ir-lock.locked { border-color:#F59E0B44; color:#F59E0B; background:#141000; }
        .ir-formats { display:flex; gap:4px; flex-wrap:wrap; }
        .ir-fmt { padding:6px 10px; border-radius:8px; border:1px solid #1e1e1e; background:#111; color:#666; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .ir-fmt.active { border-color:#F59E0B44; color:#F59E0B; background:#141000; }
        .ir-quality-row { display:flex; justify-content:space-between; font-size:0.78rem; color:#666; margin-bottom:6px; }
        .ir-quality-slider { width:100%; accent-color:#F59E0B; }
        .ir-btn { display:inline-flex; align-items:center; gap:7px; padding:11px 20px; border-radius:10px; font-size:0.875rem; font-weight:700; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all 0.15s; width:100%; justify-content:center; }
        .ir-btn-amber { background:#F59E0B; color:#0a0a0a; }
        .ir-btn-amber:hover { opacity:0.88; }
        .ir-btn-amber:disabled { opacity:0.35; cursor:not-allowed; }
        .ir-btn-ghost { background:transparent; border:1px solid #222; color:#666; }
        .ir-btn-ghost:hover { background:#161616; color:#ccc; }
        .ir-right { display:flex; flex-direction:column; gap:16px; }
        .ir-drop { border:2px dashed #1e1e1e; border-radius:16px; padding:40px 24px; text-align:center; cursor:pointer; transition:all 0.2s; background:#0f0f0f; }
        .ir-drop:hover { border-color:#F59E0B44; background:#111; }
        .ir-drop-icon { font-size:2.5rem; margin-bottom:12px; }
        .ir-drop-text { font-size:0.88rem; color:#555; }
        .ir-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
        .ir-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:12px; overflow:hidden; position:relative; }
        .ir-card-preview { height:140px; display:flex; align-items:center; justify-content:center; background:#111; position:relative; }
        .ir-card-preview img { max-width:100%; max-height:100%; object-fit:contain; }
        .ir-card-del { position:absolute; top:6px; right:6px; width:22px; height:22px; background:rgba(0,0,0,0.6); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; }
        .ir-card-del:hover { background:#ef4444; }
        .ir-card-body { padding:10px 12px; }
        .ir-card-name { font-size:0.75rem; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:2px; }
        .ir-card-dims { font-size:0.7rem; color:#444; margin-bottom:8px; }
        .ir-card-status { font-size:0.72rem; font-weight:600; }
        .status-done { color:#10B981; }
        .status-error { color:#ef4444; }
        .status-processing { color:#F59E0B; }
        .ir-card-dl { display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:8px; background:#F59E0B22; color:#F59E0B; font-size:0.72rem; font-weight:700; text-decoration:none; margin-top:6px; justify-content:center; transition:all 0.15s; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; width:100%; }
        .ir-card-dl:hover { background:#F59E0B33; }
        .ir-dl-all { display:flex; gap:10px; flex-wrap:wrap; }
        @media (max-width:700px) {
          .ir-layout { grid-template-columns:1fr; }
          .ir-controls { position:static; }
        }
      `}</style>

      <div className="ir-root">
        <div className="ir-inner">
          <h1 className="ir-title">Image <em>Resize</em></h1>
          <p className="ir-sub">Resize JPG, PNG, WebP images in bulk. Set dimensions, maintain aspect ratio, preview before download.</p>

          <div className="ir-layout">
            {/* Controls */}
            <div className="ir-controls">
              <div>
                <p className="ir-lbl">Presets</p>
                <div className="ir-presets">
                  {PRESETS.map(p => (
                    <button key={p.label} className="ir-preset" onClick={() => applyPreset(p.w, p.h)}>{p.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="ir-lbl">Dimensions (px)</p>
                <div className="ir-dims">
                  <input className="ir-input" type="number" value={width} min={1} onChange={e => onWidthChange(Number(e.target.value))} placeholder="W" />
                  <button className={`ir-lock${lockRatio ? " locked" : ""}`} onClick={() => setLockRatio(l => !l)} title={lockRatio ? "Unlock ratio" : "Lock ratio"}>
                    {lockRatio ? <Lock size={13} /> : <Unlock size={13} />}
                  </button>
                  <input className="ir-input" type="number" value={height} min={1} onChange={e => onHeightChange(Number(e.target.value))} placeholder="H" />
                </div>
                {width && height && <p style={{ fontSize: "0.72rem", color: "#444", marginTop: "6px", textAlign: "center" }}>{width} × {height} px</p>}
              </div>

              <div>
                <p className="ir-lbl">Output Format</p>
                <div className="ir-formats">
                  {FORMATS.map(f => (
                    <button key={f} className={`ir-fmt${outputFormat === f ? " active" : ""}`} onClick={() => setOutputFormat(f)}>
                      {f === "original" ? "Original" : f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {outputFormat !== "png" && outputFormat !== "original" && (
                <div>
                  <div className="ir-quality-row"><span className="ir-lbl" style={{ margin: 0 }}>Quality</span><span>{quality}%</span></div>
                  <input className="ir-quality-slider" type="range" min={50} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} />
                </div>
              )}

              <button className="ir-btn ir-btn-amber" disabled={!images.length || processing || !width || !height} onClick={resizeAll}>
                <RefreshCw size={14} /> {processing ? "Resizing…" : `Resize ${images.length || ""} Image${images.length !== 1 ? "s" : ""}`}
              </button>

              {images.some(i => i.status === "done") && (
                <button className="ir-btn ir-btn-ghost" onClick={downloadAll}><Download size={14} /> Download All</button>
              )}
            </div>

            {/* Right */}
            <div className="ir-right">
              <div className="ir-drop" onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
                <div className="ir-drop-icon">📸</div>
                <p className="ir-drop-text">Drop images here or click to browse<br /><span style={{ color: "#333", fontSize: "0.78rem" }}>JPG, PNG, WebP, GIF · Multiple files supported</span></p>
              </div>
              <input ref={inputRef} type="file" multiple accept="image/*" hidden onChange={e => addFiles(e.target.files)} />

              {images.length > 0 && (
                <div className="ir-grid">
                  {images.map(img => (
                    <div key={img.id} className="ir-card">
                      <div className="ir-card-preview">
                        <img src={img.resultUrl || img.previewUrl} alt={img.file.name} />
                        <button className="ir-card-del" onClick={() => removeImage(img.id)}><X size={11} /></button>
                      </div>
                      <div className="ir-card-body">
                        <p className="ir-card-name">{img.file.name}</p>
                        <p className="ir-card-dims">{img.originalW} × {img.originalH} → {width || "?"} × {height || "?"}</p>
                        {img.status === "done" && <p className="ir-card-status status-done">✓ Done · {img.resultSize}</p>}
                        {img.status === "error" && <p className="ir-card-status status-error">✗ Failed</p>}
                        {img.status === "processing" && <p className="ir-card-status status-processing">⏳ Resizing…</p>}
                        {img.resultUrl && (
                          <a href={img.resultUrl} download={img.file.name.replace(/\.[^.]+$/, `_${width}x${height}.${outputFormat === "original" ? img.file.name.split(".").pop() : outputFormat}`)} className="ir-card-dl">
                            <Download size={11} /> Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}