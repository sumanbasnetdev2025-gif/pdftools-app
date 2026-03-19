"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import {
  Camera, Upload, Download, Trash2, RotateCw, RotateCcw,
  Plus, X, Sun, Contrast, FlipHorizontal, FlipVertical,
  ChevronLeft, ChevronRight, Check,
} from "lucide-react";

interface ScannedPage {
  id: string;
  originalDataUrl: string;
  editedDataUrl: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  cropX: number; cropY: number;
  cropW: number; cropH: number;
}

export default function ScanToPDFPage() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"adjust" | "crop">("adjust");
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropPreview, setCropPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  const selected = pages.find(p => p.id === selectedId);

  // Start camera
  const startCamera = async (front = false) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: front ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
      setCameraOpen(true);
      setIsFrontCamera(front);
    } catch (err) {
      alert("Camera access denied. Please allow camera permission and try again.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCameraReady(false);
  };

  // Capture photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const page: ScannedPage = {
      id: `page-${Date.now()}`,
      originalDataUrl: dataUrl,
      editedDataUrl: dataUrl,
      rotation: 0, flipH: false, flipV: false,
      brightness: 100, contrast: 100,
      cropX: 0, cropY: 0, cropW: 100, cropH: 100,
    };
    setPages(p => [...p, page]);
    setSelectedId(page.id);
  };

  // Upload files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const page: ScannedPage = {
          id: `page-${Date.now()}-${Math.random()}`,
          originalDataUrl: dataUrl,
          editedDataUrl: dataUrl,
          rotation: 0, flipH: false, flipV: false,
          brightness: 100, contrast: 100,
          cropX: 0, cropY: 0, cropW: 100, cropH: 100,
        };
        setPages(p => [...p, page]);
        setSelectedId(page.id);
      };
      reader.readAsDataURL(file);
    });
  };

  // Apply edits to canvas and get dataUrl
  const applyEdits = useCallback((page: ScannedPage): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const rad = (page.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));

        // Crop region in pixels
        const srcX = (page.cropX / 100) * img.width;
        const srcY = (page.cropY / 100) * img.height;
        const srcW = (page.cropW / 100) * img.width;
        const srcH = (page.cropH / 100) * img.height;

        // Output size after rotation
        canvas.width = Math.round(srcW * cos + srcH * sin);
        canvas.height = Math.round(srcW * sin + srcH * cos);

        const ctx = canvas.getContext("2d")!;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        if (page.flipH) ctx.scale(-1, 1);
        if (page.flipV) ctx.scale(1, -1);
        ctx.filter = `brightness(${page.brightness}%) contrast(${page.contrast}%)`;
        ctx.drawImage(img, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = page.originalDataUrl;
    });
  }, []);

  // Update edited preview when settings change
  useEffect(() => {
    if (!selected) return;
    applyEdits(selected).then(dataUrl => {
      setPages(prev => prev.map(p => p.id === selected.id ? { ...p, editedDataUrl: dataUrl } : p));
    });
  }, [selected?.rotation, selected?.flipH, selected?.flipV, selected?.brightness, selected?.contrast, selected?.cropX, selected?.cropY, selected?.cropW, selected?.cropH]);

  const updateSelected = (updates: Partial<ScannedPage>) => {
    if (!selectedId) return;
    setPages(prev => prev.map(p => p.id === selectedId ? { ...p, ...updates } : p));
  };

  // Crop canvas interaction
  const onCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cropStartRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
    setIsCropping(true);
  };

  const onCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropStartRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x2 = ((e.clientX - rect.left) / rect.width) * 100;
    const y2 = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.min(cropStartRef.current.x, x2);
    const y = Math.min(cropStartRef.current.y, y2);
    const w = Math.abs(x2 - cropStartRef.current.x);
    const h = Math.abs(y2 - cropStartRef.current.y);
    setCropPreview({ x, y, w, h });
  };

  const onCropMouseUp = () => {
    if (cropPreview && cropPreview.w > 2 && cropPreview.h > 2) {
      updateSelected({ cropX: cropPreview.x, cropY: cropPreview.y, cropW: cropPreview.w, cropH: cropPreview.h });
    }
    setIsCropping(false);
    setCropPreview(null);
    cropStartRef.current = null;
  };

  const resetCrop = () => updateSelected({ cropX: 0, cropY: 0, cropW: 100, cropH: 100 });

  // Export to PDF
  const exportPDF = async () => {
    if (!pages.length) return;
    setProcessing(true);
    try {
      const doc = await PDFDocument.create();
      for (const page of pages) {
        const dataUrl = await applyEdits(page);
        const imgBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
        const img = await doc.embedJpg(imgBytes);
        const pdfPage = doc.addPage([img.width, img.height]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const out = await doc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `scan_${Date.now()}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setProcessing(false); }
  };

  const deletePage = (id: string) => {
    setPages(p => p.filter(x => x.id !== id));
    if (selectedId === id) setSelectedId(pages.find(p => p.id !== id)?.id || null);
  };

  const movePage = (id: string, dir: -1 | 1) => {
    const idx = pages.findIndex(p => p.id === id);
    if (idx + dir < 0 || idx + dir >= pages.length) return;
    const arr = [...pages];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    setPages(arr);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .scan-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; display:flex; flex-direction:column; }

        /* Bar */
        .scan-bar { background:#0d0d0d; border-bottom:1px solid #1a1a1a; padding:0 20px; height:56px; display:flex; align-items:center; justify-content:space-between; gap:12px; position:sticky; top:0; z-index:100; flex-shrink:0; }
        .scan-bar-title { font-family:'DM Serif Display',serif; font-size:1rem; color:#f0f0f0; }
        .scan-bar-title span { color:#F59E0B; font-style:italic; }

        /* Buttons */
        .btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; font-size:0.8rem; font-weight:600; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap; }
        .btn-ghost { background:transparent; border:1px solid #222; color:#666; }
        .btn-ghost:hover { background:#161616; color:#ccc; border-color:#333; }
        .btn-amber { background:#F59E0B; color:#0a0a0a; }
        .btn-amber:hover { opacity:0.88; }
        .btn-amber:disabled { opacity:0.35; cursor:not-allowed; }
        .btn-blue { background:#3B82F6; color:white; }
        .btn-blue:hover { opacity:0.88; }
        .btn-sm { padding:5px 10px; font-size:0.75rem; }
        .btn-icon { width:32px; height:32px; padding:0; border-radius:8px; justify-content:center; }

        /* Camera overlay */
        .camera-overlay { position:fixed; inset:0; background:#000; z-index:200; display:flex; flex-direction:column; }
        .camera-video { flex:1; object-fit:cover; width:100%; }
        .camera-controls { background:#0a0a0a; padding:20px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; }
        .capture-btn { width:72px; height:72px; border-radius:50%; background:#F59E0B; border:4px solid #fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .capture-btn:hover { opacity:0.88; transform:scale(0.96); }
        .capture-btn:active { transform:scale(0.9); }

        /* Main layout */
        .scan-layout { flex:1; display:flex; overflow:hidden; min-height:0; }

        /* Left: page thumbnails */
        .scan-sidebar { width:180px; flex-shrink:0; background:#0d0d0d; border-right:1px solid #1a1a1a; display:flex; flex-direction:column; overflow:hidden; }
        .sidebar-header { padding:12px; border-bottom:1px solid #141414; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .sidebar-title { font-size:0.68rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#444; }
        .thumb-list { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:8px; }
        .thumb-item { border-radius:10px; border:2px solid #1a1a1a; overflow:hidden; cursor:pointer; position:relative; transition:all 0.15s; background:#111; }
        .thumb-item.active { border-color:#F59E0B; }
        .thumb-item img { width:100%; display:block; }
        .thumb-num { position:absolute; bottom:4px; left:4px; background:rgba(0,0,0,0.7); color:#fff; font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; }
        .thumb-del { position:absolute; top:4px; right:4px; width:20px; height:20px; background:#ef4444; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; opacity:0; transition:opacity 0.15s; }
        .thumb-item:hover .thumb-del { opacity:1; }
        .thumb-arrows { position:absolute; left:4px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:2px; opacity:0; transition:opacity 0.15s; }
        .thumb-item:hover .thumb-arrows { opacity:1; }
        .thumb-arrow { width:18px; height:18px; background:rgba(0,0,0,0.6); border-radius:4px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; }

        /* Center: main preview */
        .scan-main { flex:1; overflow:auto; display:flex; flex-direction:column; align-items:center; background:#111; padding:24px 20px; gap:16px; }

        /* Right: controls */
        .scan-controls { width:260px; flex-shrink:0; background:#0d0d0d; border-left:1px solid #1a1a1a; display:flex; flex-direction:column; overflow:hidden; }
        .ctrl-tabs { display:flex; border-bottom:1px solid #141414; flex-shrink:0; }
        .ctrl-tab { flex:1; padding:11px 6px; background:transparent; border:none; color:#444; font-size:0.72rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; text-transform:uppercase; letter-spacing:0.08em; transition:all 0.15s; border-bottom:2px solid transparent; }
        .ctrl-tab.active { color:#F59E0B; border-bottom-color:#F59E0B; }
        .ctrl-scroll { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px; }
        .ctrl-lbl { font-size:0.65rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#444; margin-bottom:8px; }
        .ctrl-row { display:flex; gap:6px; flex-wrap:wrap; }
        .slider-row { display:flex; align-items:center; justify-content:space-between; font-size:0.78rem; color:#666; margin-bottom:6px; }
        .ctrl-slider { width:100%; accent-color:#F59E0B; }

        /* Preview image */
        .preview-img-wrap { position:relative; max-width:600px; width:100%; }
        .preview-img-wrap img { width:100%; border-radius:8px; box-shadow:0 8px 40px rgba(0,0,0,0.6); display:block; }
        .crop-overlay { position:absolute; inset:0; cursor:crosshair; border-radius:8px; overflow:hidden; }
        .crop-selection { position:absolute; border:2px solid #F59E0B; background:rgba(245,158,11,0.1); pointer-events:none; }

        /* Empty state */
        .empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:40px; text-align:center; }
        .empty-icon { font-size:4rem; }
        .empty-title { font-family:'DM Serif Display',serif; font-size:1.6rem; color:#f0f0f0; }
        .empty-sub { font-size:0.875rem; color:#555; max-width:360px; line-height:1.7; }
        .empty-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }

        @media (max-width:900px) { .scan-controls { width:220px; } }
        @media (max-width:700px) {
          .scan-layout { flex-direction:column; overflow:visible; }
          .scan-sidebar { width:100%; height:120px; flex-direction:row; border-right:none; border-bottom:1px solid #1a1a1a; }
          .thumb-list { flex-direction:row; overflow-x:auto; overflow-y:hidden; padding:8px; }
          .thumb-item { width:80px; flex-shrink:0; }
          .scan-controls { width:100%; border-left:none; border-top:1px solid #1a1a1a; }
        }
      `}</style>

      <div className="scan-root">
        {/* Camera overlay */}
        {cameraOpen && (
          <div className="camera-overlay">
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="camera-controls">
              <button className="btn btn-ghost" onClick={stopCamera}><X size={14} /> Close</button>
              <button className="capture-btn" onClick={capturePhoto} disabled={!cameraReady}>
                <Camera size={28} color="#0a0a0a" />
              </button>
              <button className="btn btn-ghost" onClick={() => startCamera(!isFrontCamera)}>
                🔄 Flip
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="scan-bar">
          <span className="scan-bar-title">PDF<span>Master</span> — Scan to PDF</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => startCamera()}>
              <Camera size={13} /> Camera
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={13} /> Upload
            </button>
            <button className="btn btn-amber btn-sm" disabled={!pages.length || processing} onClick={exportPDF}>
              <Download size={13} /> {processing ? "Exporting…" : `Export PDF (${pages.length})`}
            </button>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={handleFileUpload} />
        </div>

        {pages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📷</div>
            <h2 className="empty-title">Scan Documents to PDF</h2>
            <p className="empty-sub">Use your camera to scan documents or upload existing images. Adjust brightness, contrast, crop and rotate before exporting to PDF.</p>
            <div className="empty-actions">
              <button className="btn btn-amber" onClick={() => startCamera()}>
                <Camera size={15} /> Open Camera
              </button>
              <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                <Upload size={15} /> Upload Images
              </button>
            </div>
          </div>
        ) : (
          <div className="scan-layout">
            {/* Sidebar thumbnails */}
            <div className="scan-sidebar">
              <div className="sidebar-header">
                <span className="sidebar-title">{pages.length} Page{pages.length !== 1 ? "s" : ""}</span>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startCamera()} title="Add page">
                  <Plus size={13} />
                </button>
              </div>
              <div className="thumb-list">
                {pages.map((page, i) => (
                  <div key={page.id} className={`thumb-item${selectedId === page.id ? " active" : ""}`}
                    onClick={() => setSelectedId(page.id)}>
                    <img src={page.editedDataUrl} alt={`Page ${i + 1}`} />
                    <span className="thumb-num">{i + 1}</span>
                    <button className="thumb-del" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); deletePage(page.id); }}>
                      <X size={10} />
                    </button>
                    <div className="thumb-arrows">
                      <button className="thumb-arrow" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); movePage(page.id, -1); }}>▲</button>
                      <button className="thumb-arrow" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); movePage(page.id, 1); }}>▼</button>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "4px" }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => fileInputRef.current?.click()}>
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Main preview */}
            <div className="scan-main">
              {selected && (
                <div className="preview-img-wrap">
                  {activeTab === "crop" ? (
                    <div
                      style={{ position: "relative", cursor: "crosshair" }}
                      onMouseDown={onCropMouseDown}
                      onMouseMove={onCropMouseMove}
                      onMouseUp={onCropMouseUp}
                      onMouseLeave={onCropMouseUp}
                    >
                      <img src={selected.originalDataUrl} alt="crop preview"
                        style={{ width: "100%", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", display: "block", userSelect: "none" }}
                        draggable={false} />
                      {/* Current crop region */}
                      <div style={{
                        position: "absolute",
                        left: `${selected.cropX}%`, top: `${selected.cropY}%`,
                        width: `${selected.cropW}%`, height: `${selected.cropH}%`,
                        border: "2px solid #F59E0B",
                        background: "rgba(245,158,11,0.08)",
                        pointerEvents: "none",
                      }} />
                      {/* Crop preview while dragging */}
                      {cropPreview && (
                        <div style={{
                          position: "absolute",
                          left: `${cropPreview.x}%`, top: `${cropPreview.y}%`,
                          width: `${cropPreview.w}%`, height: `${cropPreview.h}%`,
                          border: "2px dashed #06B6D4",
                          background: "rgba(6,182,212,0.1)",
                          pointerEvents: "none",
                        }} />
                      )}
                    </div>
                  ) : (
                    <img src={selected.editedDataUrl} alt="preview"
                      style={{ width: "100%", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", display: "block" }} />
                  )}
                </div>
              )}
            </div>

            {/* Right controls */}
            <div className="scan-controls">
              <div className="ctrl-tabs">
                <button className={`ctrl-tab${activeTab === "adjust" ? " active" : ""}`} onClick={() => setActiveTab("adjust")}>Adjust</button>
                <button className={`ctrl-tab${activeTab === "crop" ? " active" : ""}`} onClick={() => setActiveTab("crop")}>Crop</button>
              </div>

              <div className="ctrl-scroll">
                {!selected ? (
                  <p style={{ fontSize: "0.82rem", color: "#444", textAlign: "center", padding: "20px 0" }}>Select a page to edit</p>
                ) : activeTab === "adjust" ? (
                  <>
                    {/* Rotate */}
                    <div>
                      <p className="ctrl-lbl">Rotate</p>
                      <div className="ctrl-row">
                        <button className="btn btn-ghost btn-sm" onClick={() => updateSelected({ rotation: (selected.rotation - 90 + 360) % 360 })}>
                          <RotateCcw size={13} /> 90° Left
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => updateSelected({ rotation: (selected.rotation + 90) % 360 })}>
                          <RotateCw size={13} /> 90° Right
                        </button>
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <div className="slider-row"><span>Fine rotate</span><span>{selected.rotation}°</span></div>
                        <input className="ctrl-slider" type="range" min={0} max={359} value={selected.rotation}
                          onChange={e => updateSelected({ rotation: Number(e.target.value) })} />
                      </div>
                    </div>

                    {/* Flip */}
                    <div>
                      <p className="ctrl-lbl">Flip</p>
                      <div className="ctrl-row">
                        <button className={`btn btn-sm${selected.flipH ? " btn-amber" : " btn-ghost"}`}
                          onClick={() => updateSelected({ flipH: !selected.flipH })}>
                          <FlipHorizontal size={13} /> Horizontal
                        </button>
                        <button className={`btn btn-sm${selected.flipV ? " btn-amber" : " btn-ghost"}`}
                          onClick={() => updateSelected({ flipV: !selected.flipV })}>
                          <FlipVertical size={13} /> Vertical
                        </button>
                      </div>
                    </div>

                    {/* Brightness */}
                    <div>
                      <p className="ctrl-lbl">Brightness & Contrast</p>
                      <div className="slider-row"><span>☀️ Brightness</span><span>{selected.brightness}%</span></div>
                      <input className="ctrl-slider" type="range" min={50} max={200} value={selected.brightness}
                        onChange={e => updateSelected({ brightness: Number(e.target.value) })} />
                      <div className="slider-row" style={{ marginTop: "10px" }}><span>◑ Contrast</span><span>{selected.contrast}%</span></div>
                      <input className="ctrl-slider" type="range" min={50} max={200} value={selected.contrast}
                        onChange={e => updateSelected({ contrast: Number(e.target.value) })} />
                    </div>

                    {/* Reset */}
                    <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}
                      onClick={() => updateSelected({ rotation: 0, flipH: false, flipV: false, brightness: 100, contrast: 100 })}>
                      <RotateCcw size={12} /> Reset All
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="ctrl-lbl">Crop</p>
                      <p style={{ fontSize: "0.78rem", color: "#666", lineHeight: 1.6, marginBottom: "12px" }}>
                        Draw a rectangle on the image to set the crop area. The amber border shows the current crop.
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                        {[
                          { label: "Left %", key: "cropX", val: selected.cropX },
                          { label: "Top %", key: "cropY", val: selected.cropY },
                          { label: "Width %", key: "cropW", val: selected.cropW },
                          { label: "Height %", key: "cropH", val: selected.cropH },
                        ].map(({ label, key, val }) => (
                          <div key={key}>
                            <div style={{ fontSize: "0.68rem", color: "#555", marginBottom: "4px" }}>{label}</div>
                            <input
                              style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "6px 10px", color: "#e0e0e0", fontSize: "0.85rem", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                              type="number" min={0} max={100} value={Math.round(val)}
                              onChange={e => updateSelected({ [key]: Number(e.target.value) })}
                            />
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center", width: "100%" }} onClick={resetCrop}>
                        <RotateCcw size={12} /> Reset Crop
                      </button>
                    </div>

                    {/* Skew/tilt correction */}
                    <div>
                      <p className="ctrl-lbl">Tilt Correction</p>
                      <div className="slider-row"><span>↔ Horizontal</span><span>{selected.rotation}°</span></div>
                      <input className="ctrl-slider" type="range" min={-45} max={45} value={selected.rotation <= 180 ? selected.rotation : selected.rotation - 360}
                        onChange={e => updateSelected({ rotation: Number(e.target.value) })} />
                      <p style={{ fontSize: "0.72rem", color: "#444", marginTop: "8px", lineHeight: 1.5 }}>
                        Drag slider to straighten tilted documents
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}