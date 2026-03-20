"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import {
  Camera,
  Upload,
  Download,
  Trash2,
  RotateCw,
  RotateCcw,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Sun,
  Contrast,
} from "lucide-react";

interface Corner {
  x: number;
  y: number;
}
interface ScannedPage {
  id: string;
  originalDataUrl: string;
  processedDataUrl: string;
  corners: [Corner, Corner, Corner, Corner]; // TL, TR, BR, BL
  brightness: number;
  contrast: number;
  rotation: number;
  width: number;
  height: number;
}

function createDefaultCorners(
  w: number,
  h: number,
): [Corner, Corner, Corner, Corner] {
  const pad = 0.05;
  return [
    { x: w * pad, y: h * pad }, // TL
    { x: w * (1 - pad), y: h * pad }, // TR
    { x: w * (1 - pad), y: h * (1 - pad) }, // BR
    { x: w * pad, y: h * (1 - pad) }, // BL
  ];
}

// Perspective transform: map 4 src corners to a rectangle
function perspectiveTransform(
  src: HTMLImageElement | HTMLCanvasElement,
  corners: [Corner, Corner, Corner, Corner],
  brightness: number,
  contrast: number,
  rotation: number,
): string {
  const [tl, tr, br, bl] = corners;

  // Output dimensions based on corner distances
  const topW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const botW = Math.hypot(br.x - bl.x, br.y - bl.y);
  const leftH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rightH = Math.hypot(br.x - tr.x, br.y - tr.y);
  const outW = Math.round(Math.max(topW, botW));
  const outH = Math.round(Math.max(leftH, rightH));

  // Create offscreen canvas for perspective warp
  const srcCanvas = document.createElement("canvas");
  const srcCtx = srcCanvas.getContext("2d")!;

  if (src instanceof HTMLImageElement) {
    srcCanvas.width = src.naturalWidth;
    srcCanvas.height = src.naturalHeight;
    srcCtx.drawImage(src, 0, 0);
  } else {
    srcCanvas.width = src.width;
    srcCanvas.height = src.height;
    srcCtx.drawImage(src, 0, 0);
  }

  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

  // Output canvas
  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext("2d")!;
  const outData = outCtx.createImageData(outW, outH);

  // Inverse bilinear interpolation for each output pixel
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const u = x / outW;
      const v = y / outH;

      // Bilinear interpolation of source coordinates
      const srcX =
        (1 - u) * (1 - v) * tl.x +
        u * (1 - v) * tr.x +
        u * v * br.x +
        (1 - u) * v * bl.x;
      const srcY =
        (1 - u) * (1 - v) * tl.y +
        u * (1 - v) * tr.y +
        u * v * br.y +
        (1 - u) * v * bl.y;

      const sx = Math.round(srcX);
      const sy = Math.round(srcY);

      if (sx < 0 || sx >= srcCanvas.width || sy < 0 || sy >= srcCanvas.height)
        continue;

      const srcIdx = (sy * srcCanvas.width + sx) * 4;
      const dstIdx = (y * outW + x) * 4;

      // Apply brightness and contrast
      const bFactor = brightness / 100;
      const cFactor = (contrast - 100) / 100;

      for (let ch = 0; ch < 3; ch++) {
        let val = srcData.data[srcIdx + ch];
        // Brightness
        val = val * bFactor;
        // Contrast: scale around 128
        val = val + (val - 128) * cFactor;
        outData.data[dstIdx + ch] = Math.max(0, Math.min(255, Math.round(val)));
      }
      outData.data[dstIdx + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);

  // Apply rotation
  if (rotation === 0) return outCanvas.toDataURL("image/jpeg", 0.95);

  const rotCanvas = document.createElement("canvas");
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  rotCanvas.width = Math.round(outW * cos + outH * sin);
  rotCanvas.height = Math.round(outW * sin + outH * cos);
  const rotCtx = rotCanvas.getContext("2d")!;
  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(outCanvas, -outW / 2, -outH / 2);
  return rotCanvas.toDataURL("image/jpeg", 0.95);
}

export default function ScanToPDFPage() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [draggingCorner, setDraggingCorner] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isFront, setIsFront] = useState(false);
  const [previewSize, setPreviewSize] = useState({ w: 600, h: 800 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = pages.find((p) => p.id === selectedId) ?? null;

  // Update preview size on resize
  useEffect(() => {
    const update = () => {
      if (previewRef.current) {
        const w = previewRef.current.clientWidth;
        setPreviewSize({ w, h: Math.round(w * 1.414) });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [selectedId]);

  // Auto-apply processing when settings change
  useEffect(() => {
    if (!selected) return;
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      applyProcessing(selected);
    }, 150);
  }, [
    selected?.brightness,
    selected?.contrast,
    selected?.rotation,
    selected?.corners,
  ]);

  const applyProcessing = async (page: ScannedPage) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const result = perspectiveTransform(
          img,
          page.corners,
          page.brightness,
          page.contrast,
          page.rotation,
        );
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, processedDataUrl: result } : p,
          ),
        );
        resolve();
      };
      img.src = page.originalDataUrl;
    });
  };

  // Camera
  const startCamera = async (front = false) => {
    try {
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: front ? "user" : "environment",
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
      setCameraOpen(true);
      setIsFront(front);
    } catch {
      alert("Camera access denied. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCameraReady(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.97);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const confirmCapturedPhoto = () => {
    if (!capturedPhoto) return;
    addPageFromDataUrl(capturedPhoto);
    setCapturedPhoto(null);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera(isFront);
  };

  const addPageFromDataUrl = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const corners = createDefaultCorners(img.naturalWidth, img.naturalHeight);
      const page: ScannedPage = {
        id: `page-${Date.now()}-${Math.random()}`,
        originalDataUrl: dataUrl,
        processedDataUrl: dataUrl,
        corners,
        brightness: 110,
        contrast: 115,
        rotation: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      setPages((prev) => [...prev, page]);
      setSelectedId(page.id);
      // Auto-apply initial processing
      setTimeout(() => applyProcessing(page), 100);
    };
    img.src = dataUrl;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => addPageFromDataUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const updateSelected = (updates: Partial<ScannedPage>) => {
    if (!selectedId) return;
    setPages((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, ...updates } : p)),
    );
  };

  // Corner drag handlers
  const getCornerPos = (corner: Corner, imgW: number, imgH: number) => {
    if (!previewRef.current) return { px: 0, py: 0 };
    const rect = previewRef.current.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;
    const scale = Math.min(displayW / imgW, displayH / imgH);
    const offsetX = (displayW - imgW * scale) / 2;
    const offsetY = (displayH - imgH * scale) / 2;
    return {
      px: corner.x * scale + offsetX,
      py: corner.y * scale + offsetY,
    };
  };

  const getCornerFromEvent = (
    e: React.MouseEvent | React.TouchEvent,
    imgW: number,
    imgH: number,
  ): Corner => {
    if (!previewRef.current) return { x: 0, y: 0 };
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const displayW = rect.width;
    const displayH = rect.height;
    const scale = Math.min(displayW / imgW, displayH / imgH);
    const offsetX = (displayW - imgW * scale) / 2;
    const offsetY = (displayH - imgH * scale) / 2;
    return {
      x: Math.max(0, Math.min(imgW, (clientX - rect.left - offsetX) / scale)),
      y: Math.max(0, Math.min(imgH, (clientY - rect.top - offsetY) / scale)),
    };
  };

  const onCornerMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    idx: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingCorner(idx);
  };

  const onPreviewMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingCorner === null || !selected) return;
    e.preventDefault();
    const newCorner = getCornerFromEvent(e, selected.width, selected.height);
    const newCorners = [...selected.corners] as [
      Corner,
      Corner,
      Corner,
      Corner,
    ];
    newCorners[draggingCorner] = newCorner;
    updateSelected({ corners: newCorners });
  };

  const onPreviewMouseUp = () => setDraggingCorner(null);

  const resetCorners = () => {
    if (!selected) return;
    updateSelected({
      corners: createDefaultCorners(selected.width, selected.height),
    });
  };

  const deletePage = (id: string) => {
    const remaining = pages.filter((p) => p.id !== id);
    setPages(remaining);
    setSelectedId(
      remaining.length > 0 ? remaining[remaining.length - 1].id : null,
    );
  };

  const movePage = (id: string, dir: -1 | 1) => {
    const idx = pages.findIndex((p) => p.id === id);
    if (idx + dir < 0 || idx + dir >= pages.length) return;
    const arr = [...pages];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    setPages(arr);
  };

  const exportPDF = async () => {
    if (!pages.length) return;
    setExporting(true);
    try {
      const doc = await PDFDocument.create();
      for (const page of pages) {
        const img = new Image();
        await new Promise<void>((res) => {
          img.onload = () => res();
          img.src = page.originalDataUrl;
        });
        const result = perspectiveTransform(
          img,
          page.corners,
          page.brightness,
          page.contrast,
          page.rotation,
        );
        const imgBytes = await fetch(result).then((r) => r.arrayBuffer());
        const embedded = await doc.embedJpg(imgBytes);
        // A4 at 150 DPI
        const A4W = 595,
          A4H = 842;
        const pdfPage = doc.addPage([A4W, A4H]);
        const scale = Math.min(A4W / embedded.width, A4H / embedded.height);
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        pdfPage.drawImage(embedded, {
          x: (A4W - w) / 2,
          y: (A4H - h) / 2,
          width: w,
          height: h,
        });
      }
      const out = await doc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scan_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // Compute corner screen positions for overlay
  const cornerScreenPositions = selected
    ? selected.corners.map((c) =>
        getCornerPos(c, selected.width, selected.height),
      )
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .scan-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; display:flex; flex-direction:column; }

        /* Bar */
        .scan-bar { background:#0d0d0d; border-bottom:1px solid #1a1a1a; padding:0 20px; height:56px; display:flex; align-items:center; justify-content:space-between; gap:12px; position:sticky; top:0; z-index:100; flex-shrink:0; }
        .scan-bar-title { font-family:'DM Serif Display',serif; font-size:1rem; color:#f0f0f0; white-space:nowrap; }
        .scan-bar-title span { color:#F59E0B; font-style:italic; }
        .bar-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

        /* Buttons */
        .btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; font-size:0.8rem; font-weight:600; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap; }
        .btn-ghost { background:transparent; border:1px solid #222; color:#666; }
        .btn-ghost:hover { background:#161616; color:#ccc; border-color:#333; }
        .btn-amber { background:#F59E0B; color:#0a0a0a; }
        .btn-amber:hover { opacity:0.88; }
        .btn-amber:disabled { opacity:0.35; cursor:not-allowed; }
        .btn-blue { background:#3B82F6; color:white; }
        .btn-blue:hover { opacity:0.88; }
        .btn-red { background:#ef4444; color:white; }
        .btn-red:hover { opacity:0.88; }
        .btn-sm { padding:5px 10px; font-size:0.75rem; }
        .btn-icon { width:32px; height:32px; padding:0; border-radius:8px; justify-content:center; }

        /* Camera */
        .camera-overlay { position:fixed; inset:0; background:#000; z-index:300; display:flex; flex-direction:column; }
        .camera-video { flex:1; object-fit:cover; width:100%; }
        .camera-footer { background:#0a0a0a; padding:24px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .capture-btn { width:76px; height:76px; border-radius:50%; background:white; border:5px solid #555; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; }
        .capture-btn:active { transform:scale(0.92); background:#eee; }
        .capture-btn-inner { width:56px; height:56px; border-radius:50%; background:#fff; border:3px solid #333; }

        /* Photo confirm */
        .photo-confirm { position:fixed; inset:0; background:#000; z-index:300; display:flex; flex-direction:column; }
        .photo-confirm-img { flex:1; object-fit:contain; width:100%; }
        .photo-confirm-footer { background:#0a0a0a; padding:20px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; }

        /* Main layout */
        .scan-layout { flex:1; display:flex; overflow:hidden; min-height:0; }

        /* Sidebar */
        .scan-sidebar { width:160px; flex-shrink:0; background:#0d0d0d; border-right:1px solid #1a1a1a; display:flex; flex-direction:column; overflow:hidden; }
        .sidebar-hdr { padding:10px 12px; border-bottom:1px solid #141414; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .sidebar-lbl { font-size:0.65rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#444; }
        .thumb-list { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:8px; }
        .thumb-item { border-radius:8px; border:2px solid #1a1a1a; overflow:hidden; cursor:pointer; position:relative; background:#111; transition:border-color 0.15s; }
        .thumb-item.active { border-color:#F59E0B; }
        .thumb-item img { width:100%; display:block; }
        .thumb-badge { position:absolute; bottom:3px; left:3px; background:rgba(0,0,0,0.75); color:#fff; font-size:0.6rem; font-weight:700; padding:1px 5px; border-radius:3px; }
        .thumb-del { position:absolute; top:3px; right:3px; width:18px; height:18px; background:#ef4444; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; opacity:0; transition:opacity 0.15s; }
        .thumb-item:hover .thumb-del { opacity:1; }
        .thumb-move { position:absolute; left:3px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:1px; opacity:0; transition:opacity 0.15s; }
        .thumb-item:hover .thumb-move { opacity:1; }
        .thumb-mv-btn { width:16px; height:16px; background:rgba(0,0,0,0.65); border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; font-size:9px; }

        /* Center */
        .scan-center { flex:1; overflow:auto; display:flex; flex-direction:column; align-items:center; background:#111; padding:24px 20px; gap:16px; }

        /* Preview */
        .preview-wrap { position:relative; width:100%; max-width:580px; user-select:none; }
        .preview-img { width:100%; display:block; border-radius:6px; box-shadow:0 8px 40px rgba(0,0,0,0.7); }
        .corner-overlay { position:absolute; inset:0; pointer-events:none; }
        .corner-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
        .corner-handle { position:absolute; width:28px; height:28px; border-radius:50%; background:#F59E0B; border:3px solid #0a0a0a; cursor:grab; transform:translate(-50%,-50%); pointer-events:all; touch-action:none; z-index:10; box-shadow:0 2px 8px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; }
        .corner-handle:active { cursor:grabbing; transform:translate(-50%,-50%) scale(1.2); }
        .corner-handle-dot { width:8px; height:8px; border-radius:50%; background:white; }

        /* Controls panel */
        .scan-controls { width:240px; flex-shrink:0; background:#0d0d0d; border-left:1px solid #1a1a1a; display:flex; flex-direction:column; overflow-y:auto; padding:16px; gap:20px; }
        .ctrl-lbl { font-size:0.65rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#444; margin-bottom:8px; }
        .slider-row { display:flex; align-items:center; justify-content:space-between; font-size:0.78rem; color:#666; margin-bottom:6px; }
        .ctrl-slider { width:100%; accent-color:#F59E0B; cursor:pointer; }
        .ctrl-btn-row { display:flex; gap:6px; flex-wrap:wrap; }

        /* Empty */
        .scan-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:40px; text-align:center; }
        .empty-icon { font-size:4rem; }
        .empty-title { font-family:'DM Serif Display',serif; font-size:1.8rem; color:#f0f0f0; }
        .empty-sub { font-size:0.875rem; color:#555; max-width:360px; line-height:1.7; }
        .empty-btns { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }

        /* Processing indicator */
        .processing-badge { background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:6px 12px; font-size:0.75rem; color:#F59E0B; }

        @media (max-width:900px) { .scan-controls { width:200px; } }
        @media (max-width:680px) {
          .scan-layout { flex-direction:column; overflow:visible; }
          .scan-sidebar { width:100%; height:110px; border-right:none; border-bottom:1px solid #1a1a1a; }
          .thumb-list { flex-direction:row; overflow-x:auto; overflow-y:hidden; }
          .thumb-item { width:70px; flex-shrink:0; }
          .scan-controls { width:100%; border-left:none; border-top:1px solid #1a1a1a; }
        }
      `}</style>

      <div className="scan-root">
        {/* ── Camera overlay ── */}
        {cameraOpen && (
          <div className="camera-overlay">
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
            />
            <div className="camera-footer">
              <button className="btn btn-ghost" onClick={stopCamera}>
                <X size={14} /> Cancel
              </button>
              <button
                className="capture-btn"
                onClick={capturePhoto}
                disabled={!cameraReady}
                title="Take photo"
              >
                <div className="capture-btn-inner" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => startCamera(!isFront)}
              >
                🔄 Flip
              </button>
            </div>
          </div>
        )}

        {/* ── Photo confirm overlay ── */}
        {capturedPhoto && (
          <div className="photo-confirm">
            <img
              src={capturedPhoto}
              className="photo-confirm-img"
              alt="captured"
            />
            <div className="photo-confirm-footer">
              <button className="btn btn-ghost" onClick={retakePhoto}>
                <RotateCcw size={14} /> Retake
              </button>
              <p style={{ fontSize: "0.85rem", color: "#666" }}>
                Use this photo?
              </p>
              <button className="btn btn-amber" onClick={confirmCapturedPhoto}>
                <Check size={14} /> Use Photo
              </button>
            </div>
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="scan-bar">
          <span className="scan-bar-title">
            PDF<span>Master</span> — Scan
          </span>
          <div className="bar-actions">
            {pages.length === 0 && (
              <button
                className="btn btn-blue btn-sm"
                onClick={() => startCamera()}
              >
                <Camera size={13} /> Camera
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> Upload
            </button>
            {pages.length > 0 && (
              <button
                className="btn btn-amber btn-sm"
                disabled={exporting}
                onClick={exportPDF}
              >
                <Download size={13} />{" "}
                {exporting ? "Exporting…" : `Export PDF (${pages.length})`}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleFileUpload}
          />
        </div>

        {/* ── Empty state ── */}
        {pages.length === 0 && (
          <div className="scan-empty">
            <div className="empty-icon">📷</div>
            <h2 className="empty-title">Scan to PDF</h2>
            <p className="empty-sub">
              Use your camera to scan documents or upload images. Adjust the
              crop corners, brightness and contrast for scanner-quality results.
            </p>
            <div className="empty-btns">
              <button className="btn btn-blue" onClick={() => startCamera()}>
                <Camera size={15} /> Open Camera
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={15} /> Upload Images
              </button>
            </div>
          </div>
        )}

        {/* ── Main layout ── */}
        {pages.length > 0 && (
          <div className="scan-layout">
            {/* Sidebar */}
            <div className="scan-sidebar">
              <div className="sidebar-hdr">
                <span className="sidebar-lbl">
                  {pages.length} Page{pages.length !== 1 ? "s" : ""}
                </span>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => startCamera()}
                  title="Add page"
                >
                  <Plus size={12} />
                </button>{" "}
              </div>
              <div className="thumb-list">
                {pages.map((page, i) => (
                  <div
                    key={page.id}
                    className={`thumb-item${selectedId === page.id ? " active" : ""}`}
                    onClick={() => setSelectedId(page.id)}
                  >
                    <img src={page.processedDataUrl} alt={`Page ${i + 1}`} />
                    <span className="thumb-badge">{i + 1}</span>
                    <button
                      className="thumb-del"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(page.id);
                      }}
                    >
                      <X size={9} />
                    </button>
                    <div className="thumb-move">
                      <button
                        className="thumb-mv-btn"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage(page.id, -1);
                        }}
                      >
                        ▲
                      </button>
                      <button
                        className="thumb-mv-btn"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage(page.id, 1);
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: "center", margin: "4px 0" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={11} /> Add
                </button>
              </div>
            </div>

            {/* Center preview */}
            <div className="scan-center">
              {selected && (
                <>
                  <div
                    ref={previewRef}
                    className="preview-wrap"
                    style={{
                      cursor: draggingCorner !== null ? "grabbing" : "default",
                    }}
                    onMouseMove={onPreviewMouseMove}
                    onMouseUp={onPreviewMouseUp}
                    onMouseLeave={onPreviewMouseUp}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      onPreviewMouseMove(e);
                    }}
                    onTouchEnd={onPreviewMouseUp}
                  >
                    <img
                      src={selected.originalDataUrl}
                      className="preview-img"
                      alt="original"
                      draggable={false}
                    />

                    {/* Perspective overlay SVG */}
                    <svg
                      className="corner-svg"
                      viewBox={`0 0 ${previewRef.current?.clientWidth || 580} ${previewRef.current?.clientHeight || 820}`}
                    >
                      {cornerScreenPositions.length === 4 && (
                        <polygon
                          points={cornerScreenPositions
                            .map((p) => `${p.px},${p.py}`)
                            .join(" ")}
                          fill="rgba(245,158,11,0.08)"
                          stroke="#F59E0B"
                          strokeWidth="2"
                          strokeDasharray="6,4"
                        />
                      )}
                    </svg>

                    {/* Corner handles */}
                    {cornerScreenPositions.map((pos, idx) => (
                      <div
                        key={idx}
                        className="corner-handle"
                        style={{ left: pos.px, top: pos.py }}
                        onMouseDown={(e) => onCornerMouseDown(e, idx)}
                        onTouchStart={(e) => onCornerMouseDown(e, idx)}
                      >
                        <div className="corner-handle-dot" />
                      </div>
                    ))}
                  </div>

                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#444",
                      textAlign: "center",
                    }}
                  >
                    Drag the{" "}
                    <span style={{ color: "#F59E0B" }}>amber corners</span> to
                    align with document edges
                  </p>

                  {/* Processed preview */}
                  <div style={{ width: "100%", maxWidth: "580px" }}>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#444",
                        marginBottom: "8px",
                      }}
                    >
                      Preview (processed)
                    </p>
                    <img
                      src={selected.processedDataUrl}
                      style={{
                        width: "100%",
                        borderRadius: "6px",
                        border: "1px solid #1a1a1a",
                        display: "block",
                      }}
                      alt="processed"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="scan-controls">
              {!selected ? (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#444",
                    textAlign: "center",
                  }}
                >
                  Select a page
                </p>
              ) : (
                <>
                  {/* Brightness */}
                  <div>
                    <p className="ctrl-lbl">☀️ Brightness</p>
                    <div className="slider-row">
                      <span>Dark</span>
                      <span>{selected.brightness}%</span>
                      <span>Bright</span>
                    </div>
                    <input
                      className="ctrl-slider"
                      type="range"
                      min={50}
                      max={200}
                      value={selected.brightness}
                      onChange={(e) =>
                        updateSelected({ brightness: Number(e.target.value) })
                      }
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <p className="ctrl-lbl">◑ Contrast</p>
                    <div className="slider-row">
                      <span>Low</span>
                      <span>{selected.contrast}%</span>
                      <span>High</span>
                    </div>
                    <input
                      className="ctrl-slider"
                      type="range"
                      min={50}
                      max={200}
                      value={selected.contrast}
                      onChange={(e) =>
                        updateSelected({ contrast: Number(e.target.value) })
                      }
                    />
                  </div>

                  {/* Presets */}
                  <div>
                    <p className="ctrl-lbl">Presets</p>
                    <div className="ctrl-btn-row">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updateSelected({ brightness: 110, contrast: 115 })
                        }
                      >
                        Auto
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updateSelected({ brightness: 130, contrast: 160 })
                        }
                      >
                        Document
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updateSelected({ brightness: 150, contrast: 180 })
                        }
                      >
                        B&W
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updateSelected({ brightness: 100, contrast: 100 })
                        }
                      >
                        Original
                      </button>
                    </div>
                  </div>

                  {/* Rotate */}
                  <div>
                    <p className="ctrl-lbl">🔄 Rotate</p>
                    <div className="ctrl-btn-row">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updateSelected({
                            rotation: (selected.rotation - 90 + 360) % 360,
                          })
                        }
                      >
                        <RotateCcw size={12} /> 90° L
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updateSelected({
                            rotation: (selected.rotation + 90) % 360,
                          })
                        }
                      >
                        <RotateCw size={12} /> 90° R
                      </button>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <div className="slider-row">
                        <span>Fine</span>
                        <span>{selected.rotation}°</span>
                      </div>
                      <input
                        className="ctrl-slider"
                        type="range"
                        min={0}
                        max={359}
                        value={selected.rotation}
                        onChange={(e) =>
                          updateSelected({ rotation: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>

                  {/* Crop reset */}
                  <div>
                    <p className="ctrl-lbl">✂️ Crop</p>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={resetCorners}
                    >
                      Reset Corners
                    </button>
                  </div>

                  {/* Delete page */}
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "8px",
                      borderTop: "1px solid #1a1a1a",
                    }}
                  >
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        color: "#ef4444",
                        borderColor: "#2a1010",
                      }}
                      onClick={() => deletePage(selected.id)}
                    >
                      <Trash2 size={12} /> Delete Page
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
