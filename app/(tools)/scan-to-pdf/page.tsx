"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Camera, Upload, X, Sun, Contrast, RotateCcw, MoveHorizontal, MoveVertical, RefreshCw, ZoomIn, Flashlight } from "lucide-react";
import ToolHeader from "@/components/tools/ToolHeader";
import ProcessButton from "@/components/tools/ProcessButton";
import DownloadButton from "@/components/shared/DownloadButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileDownload } from "@/hooks/useFileDownload";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Adjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  rotation: number;   // -180 to 180
  tiltX: number;      // -30 to 30
  tiltY: number;      // -30 to 30
}

interface Corners {
  topLeft: [number, number];
  topRight: [number, number];
  bottomLeft: [number, number];
  bottomRight: [number, number];
}

type CornerKey = keyof Corners;

interface ScannedPage {
  id: string;
  originalDataUrl: string;   // raw capture
  croppedDataUrl: string;    // after corner crop
  adjustments: Adjustments;
}

type Step = "camera" | "adjust" | "pages";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ADJ: Adjustments = { brightness: 0, contrast: 0, rotation: 0, tiltX: 0, tiltY: 0 };

const DEFAULT_CORNERS: Corners = {
  topLeft:     [0.05, 0.05],
  topRight:    [0.95, 0.05],
  bottomLeft:  [0.05, 0.95],
  bottomRight: [0.95, 0.95],
};

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function cropToCorners(dataUrl: string, corners: Corners): Promise<string> {
  const img = await loadImage(dataUrl);
  const x = corners.topLeft[0] * img.width;
  const y = corners.topLeft[1] * img.height;
  const w = Math.max(10, (corners.topRight[0] - corners.topLeft[0]) * img.width);
  const h = Math.max(10, (corners.bottomLeft[1] - corners.topLeft[1]) * img.height);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, x, y, w, h, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.93);
}

async function applyAdjustments(dataUrl: string, adj: Adjustments): Promise<string> {
  const img = await loadImage(dataUrl);
  const rad = (adj.rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const cW = Math.ceil(img.width * cos + img.height * sin);
  const cH = Math.ceil(img.width * sin + img.height * cos);
  const canvas = document.createElement("canvas");
  canvas.width = cW; canvas.height = cH;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `brightness(${1 + adj.brightness / 100}) contrast(${1 + adj.contrast / 100})`;
  ctx.save();
  ctx.translate(cW / 2, cH / 2);
  ctx.rotate(rad);
  ctx.transform(1, Math.tan((adj.tiltY * Math.PI) / 180), Math.tan((adj.tiltX * Math.PI) / 180), 1, 0, 0);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
  return canvas.toDataURL("image/jpeg", 0.93);
}

async function detectEdges(dataUrl: string): Promise<Corners> {
  const img = await loadImage(dataUrl);
  const SW = 400, scale = SW / img.width, SH = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = SW; canvas.height = SH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, SW, SH);
  const { data } = ctx.getImageData(0, 0, SW, SH);
  const bright = (x: number, y: number) => {
    const i = (y * SW + x) * 4;
    return (data[i] + data[i + 1] + data[i + 2]) / 3;
  };
  const PAD = 0.05;
  let top = Math.round(SH * PAD), bottom = Math.round(SH * (1 - PAD));
  let left = Math.round(SW * PAD), right = Math.round(SW * (1 - PAD));

  for (let y = 5; y < SH / 2; y++) {
    let v = 0;
    for (let x = 10; x < SW - 10; x += 5) v += Math.abs(bright(x, y) - bright(x, y - 1));
    if (v / (SW / 5) > 8) { top = y; break; }
  }
  for (let y = SH - 5; y > SH / 2; y--) {
    let v = 0;
    for (let x = 10; x < SW - 10; x += 5) v += Math.abs(bright(x, y) - bright(x, y + 1));
    if (v / (SW / 5) > 8) { bottom = y; break; }
  }
  for (let x = 5; x < SW / 2; x++) {
    let v = 0;
    for (let y = 10; y < SH - 10; y += 5) v += Math.abs(bright(x, y) - bright(x - 1, y));
    if (v / (SH / 5) > 8) { left = x; break; }
  }
  for (let x = SW - 5; x > SW / 2; x--) {
    let v = 0;
    for (let y = 10; y < SH - 10; y += 5) v += Math.abs(bright(x, y) - bright(x + 1, y));
    if (v / (SH / 5) > 8) { right = x; break; }
  }
  return {
    topLeft:     [left / SW, top / SH],
    topRight:    [right / SW, top / SH],
    bottomLeft:  [left / SW, bottom / SH],
    bottomRight: [right / SW, bottom / SH],
  };
}

// ─── Slider sub-component ─────────────────────────────────────────────────────

function AdjSlider({
  label, value, min, max, unit = "", onChange,
  icon,
}: {
  label: string; value: number; min: number; max: number;
  unit?: string; onChange: (v: number) => void;
  icon: React.ReactNode;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          {icon}{label}
        </span>
        <span className="text-xs font-semibold text-gray-700 tabular-nums">
          {value > 0 ? `+${value}` : value}{unit}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-gray-200" />
        <div
          className="absolute left-0 h-1 rounded-full bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScanToPDFPage() {
  const { downloadBytes } = useFileDownload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("camera");
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "fit">("a4");

  // Adjust step state
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [corners, setCorners] = useState<Corners>(DEFAULT_CORNERS);
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ);
  const [livePreview, setLivePreview] = useState<string | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Camera state
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // Export state
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  // ── Camera lifecycle ─────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          // Check torch support
          const track = stream.getVideoTracks()[0];
          const caps = track.getCapabilities() as any;
          if (caps?.torch) setTorchSupported(true);
        };
      }
    } catch {
      setCameraError("Camera unavailable. Use Upload Images instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setTorchOn(false);
  }, []);

  useEffect(() => {
    if (step === "camera") startCamera();
    else stopCamera();
    return stopCamera;
  }, [step]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {}
  };

  // ── Capture from camera ──────────────────────────────────────────────────────

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    await processCapture(canvas.toDataURL("image/jpeg", 0.95));
  };

  // ── Upload handler ───────────────────────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;

    if (step === "pages") {
      // On pages step: add directly without adjustment
      const newPages = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await readAsDataUrl(file);
          return { id: crypto.randomUUID(), originalDataUrl: dataUrl, croppedDataUrl: dataUrl, adjustments: DEFAULT_ADJ };
        })
      );
      setPages((prev) => [...prev, ...newPages]);
      return;
    }

    // Single file → go to adjust
    const dataUrl = await readAsDataUrl(files[0]);
    await processCapture(dataUrl);
    // queue remaining files
    if (files.length > 1) {
      const rest = await Promise.all(
        files.slice(1).map(async (file) => {
          const url = await readAsDataUrl(file);
          return { id: crypto.randomUUID(), originalDataUrl: url, croppedDataUrl: url, adjustments: DEFAULT_ADJ };
        })
      );
      setPages((prev) => [...prev, ...rest]);
    }
  };

  async function readAsDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function processCapture(dataUrl: string) {
    setCapturedUrl(dataUrl);
    setLivePreview(dataUrl);
    setAdj(DEFAULT_ADJ);
    setAutoDetecting(true);
    setStep("adjust");
    try {
      const detected = await detectEdges(dataUrl);
      setCorners(detected);
    } catch {
      setCorners(DEFAULT_CORNERS);
    } finally {
      setAutoDetecting(false);
    }
  }

  // ── Live preview ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!capturedUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const cropped = await cropToCorners(capturedUrl, corners);
        if (cancelled) return;
        const adjusted = await applyAdjustments(cropped, adj);
        if (!cancelled) setLivePreview(adjusted);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [capturedUrl, corners, adj]);

  // ── Corner dragging ──────────────────────────────────────────────────────────

  const dragRef = useRef<{ key: CornerKey; mx: number; my: number } | null>(null);

  const onCornerPointerDown = (e: React.PointerEvent, key: CornerKey) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { key, mx: e.clientX, my: e.clientY };
  };

  const onPreviewPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !previewBoxRef.current) return;
    const { width, height } = previewBoxRef.current.getBoundingClientRect();
    const dx = e.clientX - dragRef.current.mx;
    const dy = e.clientY - dragRef.current.my;
    dragRef.current.mx = e.clientX;
    dragRef.current.my = e.clientY;
    const key = dragRef.current.key;
    setCorners((prev) => ({
      ...prev,
      [key]: [
        clamp(prev[key][0] + dx / width, 0.01, 0.99),
        clamp(prev[key][1] + dy / height, 0.01, 0.99),
      ] as [number, number],
    }));
  };

  const onPreviewPointerUp = () => { dragRef.current = null; };

  // ── Add current capture as page ──────────────────────────────────────────────

  const addPage = async () => {
    if (!capturedUrl) return;
    const cropped = await cropToCorners(capturedUrl, corners);
    setPages((prev) => [...prev, {
      id: crypto.randomUUID(),
      originalDataUrl: capturedUrl,
      croppedDataUrl: cropped,
      adjustments: { ...adj },
    }]);
    setCapturedUrl(null);
    setLivePreview(null);
    setStep("pages");
  };

  // ── Page reorder/remove ──────────────────────────────────────────────────────

  const removePage = (id: string) => setPages((p) => p.filter((x) => x.id !== id));
  const moveUp   = (i: number) => setPages((p) => { const n = [...p]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; });
  const moveDown = (i: number) => setPages((p) => { const n = [...p]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n; });

  // ── Export PDF ───────────────────────────────────────────────────────────────

  const handleConvert = async () => {
    if (!pages.length) { setError("Please add at least one page."); return; }
    setError(null); setIsDone(false);
    try {
      setIsProcessing(true); setProgress(10);
      const pdf = await PDFDocument.create();
      const a4 = { width: 595, height: 842 };

      for (let i = 0; i < pages.length; i++) {
        const pg = pages[i];
        const finalUrl = await applyAdjustments(pg.croppedDataUrl, pg.adjustments);
        const base64 = finalUrl.split(",")[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const image = await pdf.embedJpg(bytes);
        const imgDims = image.size();
        const pageW = pageSize === "a4" ? a4.width  : imgDims.width;
        const pageH = pageSize === "a4" ? a4.height : imgDims.height;
        const pdfPage = pdf.addPage([pageW, pageH]);
        const scale = Math.min(pageW / imgDims.width, pageH / imgDims.height, 1);
        pdfPage.drawImage(image, {
          x: (pageW - imgDims.width  * scale) / 2,
          y: (pageH - imgDims.height * scale) / 2,
          width:  imgDims.width  * scale,
          height: imgDims.height * scale,
        });
        setProgress(10 + Math.round(((i + 1) / pages.length) * 85));
      }

      const result = await pdf.save();
      setResultBytes(result);
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to create PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    downloadBytes(resultBytes, `scanned_document_${Date.now()}.pdf`);
  };

  const handleReset = () => {
    setPages([]); setProgress(0); setIsDone(false);
    setError(null); setResultBytes(null);
    setCapturedUrl(null); setLivePreview(null);
    setStep("camera");
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="📷"
          title="Scan to PDF"
          description="Convert photos and scanned images into a PDF document. Supports multiple pages."
          gradient="from-indigo-500 to-blue-500"
        />

        {/* Step tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
          {(["camera", "adjust", "pages"] as Step[]).map((s, i) => (
            <button
              key={s}
              onClick={() => {
                if (s === "camera" || (s === "pages" && pages.length > 0)) setStep(s);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                step === s
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span>{["📷", "✏️", "📄"][i]}</span>
              <span className="hidden sm:inline">{["Capture", "Adjust", `Pages${pages.length ? ` (${pages.length})` : ""}`][i]}</span>
            </button>
          ))}
        </div>

        {/* ── STEP: CAMERA ── */}
        {step === "camera" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Live viewfinder */}
            <div className="relative bg-gray-900" style={{ aspectRatio: "4/3" }}>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
                  <Camera className="w-12 h-12 text-gray-600" />
                  <p className="text-gray-400 text-sm">{cameraError}</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                  {/* Guide overlay */}
                  {cameraReady && (
                    <div className="absolute inset-6 border-2 border-white/30 rounded-lg pointer-events-none">
                      {/* Corner accents */}
                      {[
                        "top-0 left-0 border-t-2 border-l-2",
                        "top-0 right-0 border-t-2 border-r-2",
                        "bottom-0 left-0 border-b-2 border-l-2",
                        "bottom-0 right-0 border-b-2 border-r-2",
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-6 h-6 border-white ${cls}`} />
                      ))}
                    </div>
                  )}

                  {/* Torch button */}
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        torchOn ? "bg-yellow-400 text-yellow-900" : "bg-black/40 text-white backdrop-blur-sm"
                      }`}
                    >
                      💡
                    </button>
                  )}

                  {/* Brightness hint */}
                  {cameraReady && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                      Position document within guides • Good lighting helps
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Camera controls */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={captureFromCamera}
                  disabled={!cameraReady}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    cameraReady
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {cameraReady ? "Capture" : "Starting…"}
                </button>

                <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload Images
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              </div>

              {pages.length > 0 && (
                <button
                  onClick={() => setStep("pages")}
                  className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-all"
                >
                  Continue with {pages.length} page{pages.length > 1 ? "s" : ""} →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: ADJUST ── */}
        {step === "adjust" && capturedUrl && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: original + corner handles */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-700">
                  {autoDetecting ? "🔍 Detecting edges…" : "Drag corners to crop"}
                </p>
                <button
                  onClick={async () => {
                    setAutoDetecting(true);
                    try { setCorners(await detectEdges(capturedUrl)); }
                    catch { setCorners(DEFAULT_CORNERS); }
                    finally { setAutoDetecting(false); }
                  }}
                  className="flex items-center gap-1 text-xs text-indigo-500 font-medium hover:text-indigo-700"
                >
                  <RefreshCw className="w-3 h-3" /> Re-detect
                </button>
              </div>

              {/* Image + handles */}
              <div
                ref={previewBoxRef}
                className="relative select-none"
                onPointerMove={onPreviewPointerMove}
                onPointerUp={onPreviewPointerUp}
              >
                <img
                  src={capturedUrl}
                  alt="Captured"
                  className="w-full block"
                  style={{ maxHeight: 380, objectFit: "contain" }}
                />
                {/* SVG polygon overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                >
                  <polygon
                    points={`${corners.topLeft[0]},${corners.topLeft[1]} ${corners.topRight[0]},${corners.topRight[1]} ${corners.bottomRight[0]},${corners.bottomRight[1]} ${corners.bottomLeft[0]},${corners.bottomLeft[1]}`}
                    fill="rgba(99,102,241,0.07)"
                    stroke="rgba(99,102,241,0.7)"
                    strokeWidth="0.004"
                  />
                </svg>
                {/* Draggable handles */}
                {(Object.entries(corners) as [CornerKey, [number, number]][]).map(([key, [cx, cy]]) => (
                  <div
                    key={key}
                    onPointerDown={(e) => onCornerPointerDown(e, key)}
                    style={{
                      position: "absolute",
                      left: `calc(${cx * 100}% - 14px)`,
                      top: `calc(${cy * 100}% - 14px)`,
                    }}
                    className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center touch-none z-10"
                  >
                    <ZoomIn className="w-3 h-3 text-white" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: adjustments + live preview */}
            <div className="flex flex-col gap-4">
              {/* Live preview */}
              {livePreview && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <p className="text-xs font-semibold text-gray-400 px-4 py-2 border-b border-gray-50">
                    Live Preview
                  </p>
                  <img
                    src={livePreview}
                    alt="Preview"
                    className="w-full block bg-gray-50"
                    style={{ maxHeight: 160, objectFit: "contain" }}
                  />
                </div>
              )}

              {/* Sliders */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Adjustments</p>
                  <button
                    onClick={() => setAdj(DEFAULT_ADJ)}
                    className="text-xs text-gray-400 hover:text-indigo-500 font-medium flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
                <AdjSlider label="Brightness" value={adj.brightness} min={-100} max={100}
                  onChange={(v) => setAdj((a) => ({ ...a, brightness: v }))}
                  icon={<Sun className="w-3.5 h-3.5" />} />
                <AdjSlider label="Contrast" value={adj.contrast} min={-100} max={100}
                  onChange={(v) => setAdj((a) => ({ ...a, contrast: v }))}
                  icon={<span className="text-xs">◑</span>} />
                <AdjSlider label="Rotation" value={adj.rotation} min={-180} max={180} unit="°"
                  onChange={(v) => setAdj((a) => ({ ...a, rotation: v }))}
                  icon={<RotateCcw className="w-3.5 h-3.5" />} />
                <AdjSlider label="Tilt Horizontal" value={adj.tiltX} min={-30} max={30} unit="°"
                  onChange={(v) => setAdj((a) => ({ ...a, tiltX: v }))}
                  icon={<MoveHorizontal className="w-3.5 h-3.5" />} />
                <AdjSlider label="Tilt Vertical" value={adj.tiltY} min={-30} max={30} unit="°"
                  onChange={(v) => setAdj((a) => ({ ...a, tiltY: v }))}
                  icon={<MoveVertical className="w-3.5 h-3.5" />} />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("camera"); setCapturedUrl(null); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-all"
                >
                  ← Retake
                </button>
                <button
                  onClick={addPage}
                  className="flex-[2] py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition-all"
                >
                  Add Page →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PAGES ── */}
        {step === "pages" && !isDone && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700">
                  {pages.length} page{pages.length !== 1 ? "s" : ""} added
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep("camera")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" /> Scan More
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:border-gray-300 transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                  </label>
                  <button onClick={() => setPages([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    Clear all
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                {pages.map((pg, i) => (
                  <div
                    key={pg.id}
                    className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-[3/4]"
                  >
                    <img
                      src={pg.croppedDataUrl}
                      alt={`Page ${i + 1}`}
                      className="w-full h-full object-cover"
                      style={{
                        filter: `brightness(${1 + pg.adjustments.brightness / 100}) contrast(${1 + pg.adjustments.contrast / 100})`,
                      }}
                    />
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {i + 1}
                    </div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removePage(pg.id)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveUp(i)} disabled={i === 0}
                        className="w-5 h-5 bg-white/90 rounded flex items-center justify-center text-xs font-bold text-gray-600 disabled:opacity-40"
                      >↑</button>
                      <button
                        onClick={() => moveDown(i)} disabled={i === pages.length - 1}
                        className="w-5 h-5 bg-white/90 rounded flex items-center justify-center text-xs font-bold text-gray-600 disabled:opacity-40"
                      >↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Page size */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Page size</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "a4", label: "📄 A4 (Standard)" },
                  { value: "fit", label: "🖼️ Fit to Image" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPageSize(value)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      pageSize === value
                        ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {isProcessing && <UploadProgress progress={progress} label="Creating PDF from scans..." />}
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

            <div className="flex justify-center">
              <ProcessButton
                onClick={handleConvert}
                label={`Create PDF from ${pages.length} scan${pages.length > 1 ? "s" : ""}`}
                processingLabel="Creating PDF..."
              />
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {isDone && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">PDF Created!</p>
              <p className="text-gray-400 text-sm mt-1">
                {pages.length} scan{pages.length > 1 ? "s" : ""} converted into one PDF
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <DownloadButton onClick={handleDownload} label="Download PDF" />
              <button
                onClick={handleReset}
                className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Scan More
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}