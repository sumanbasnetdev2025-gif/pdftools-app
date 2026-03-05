"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import type * as PdfjsLibType from "pdfjs-dist";

async function getPdfjs(): Promise<typeof PdfjsLibType> {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return lib;
}
import {
  Upload, Download, RotateCcw, Pen, Type, Image as ImageIcon,
  Trash2, ChevronLeft, ChevronRight, Move, Check, X, ZoomIn, ZoomOut,
} from "lucide-react";

// pdfjs worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}
type SignatureType = "draw" | "type" | "image";

interface PlacedSignature {
  id: string;
  dataUrl: string;
  // Position as percentage of page dimensions (0-100)
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  page: number;
}

const TYPED_FONTS = [
  { label: "Elegant", style: "italic 42px 'Dancing Script', cursive" },
  { label: "Classic", style: "italic 40px Georgia, serif" },
  { label: "Modern", style: "36px 'Courier New', monospace" },
  { label: "Bold", style: "bold 40px Georgia, serif" },
];

export default function SignPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sigType, setSigType] = useState<SignatureType>("draw");
  const [typedText, setTypedText] = useState("");
  const [typedFont, setTypedFont] = useState(0);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [placedSigs, setPlacedSigs] = useState<PlacedSignature[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"upload" | "sign" | "place">("upload");
  const [zoom, setZoom] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // ── Render PDF pages ──
  const renderPDF = useCallback(async (file: File) => {
    const bytes = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const images: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
      images.push(canvas.toDataURL("image/png"));
    }
    setPageImages(images);
    setTotalPages(pdf.numPages);
    setCurrentPage(0);
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfFile(file);
    await renderPDF(file);
    setStep("sign");
  };

  // ── Drawing ──
  const getDrawPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPoint.current = getDrawPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getDrawPos(e, canvas);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPoint.current = pos;
  };

  const endDraw = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const confirmDrawSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
    setStep("place");
  };

  // ── Typed signature ──
  const generateTypedSig = () => {
    if (!typedText.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 120;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 500, 120);
    ctx.font = TYPED_FONTS[typedFont].style;
    ctx.fillStyle = "#1a1a2e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedText, 250, 60);
    setSignatureDataUrl(canvas.toDataURL("image/png"));
    setStep("place");
  };

  // ── Image upload ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSignatureDataUrl(ev.target?.result as string);
      setStep("place");
    };
    reader.readAsDataURL(file);
  };

  // ── Place signature on click ──
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signatureDataUrl || draggingId || resizingId) return;
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const newSig: PlacedSignature = {
      id: `sig-${Date.now()}`,
      dataUrl: signatureDataUrl,
      xPct: Math.max(0, xPct - 10),
      yPct: Math.max(0, yPct - 5),
      widthPct: 22,
      heightPct: 10,
      page: currentPage,
    };
    setPlacedSigs((prev) => [...prev, newSig]);
    setActiveId(newSig.id);
  };

  // ── Drag logic ──
  const onMouseDownSig = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveId(id);
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sig = placedSigs.find((s) => s.id === id)!;
    const sigX = (sig.xPct / 100) * rect.width;
    const sigY = (sig.yPct / 100) * rect.height;
    setDragOffset({
      x: e.clientX - rect.left - sigX,
      y: e.clientY - rect.top - sigY,
    });
    setDraggingId(id);
  };

  const onMouseMovePage = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (draggingId) {
      const rawX = e.clientX - rect.left - dragOffset.x;
      const rawY = e.clientY - rect.top - dragOffset.y;
      setPlacedSigs((prev) =>
        prev.map((s) =>
          s.id === draggingId
            ? {
                ...s,
                xPct: Math.max(0, Math.min(100 - s.widthPct, (rawX / rect.width) * 100)),
                yPct: Math.max(0, Math.min(100 - s.heightPct, (rawY / rect.height) * 100)),
              }
            : s
        )
      );
    }

    if (resizingId) {
      const sig = placedSigs.find((s) => s.id === resizingId)!;
      const sigX = (sig.xPct / 100) * rect.width;
      const sigY = (sig.yPct / 100) * rect.height;
      const newW = Math.max(5, ((e.clientX - rect.left - sigX) / rect.width) * 100);
      const newH = Math.max(3, ((e.clientY - rect.top - sigY) / rect.height) * 100);
      setPlacedSigs((prev) =>
        prev.map((s) =>
          s.id === resizingId ? { ...s, widthPct: newW, heightPct: newH } : s
        )
      );
    }
  };

  const onMouseUpPage = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  const onResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingId(id);
    setActiveId(id);
  };

  const deleteSig = (id: string) => {
    setPlacedSigs((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  // ── Export PDF ──
  const exportPDF = async () => {
    if (!pdfFile || placedSigs.length === 0) return;
    setProcessing(true);
    try {
      const bytes = await pdfFile.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();

      for (const sig of placedSigs) {
        const page = pages[sig.page];
        const { width: pw, height: ph } = page.getSize();
        const imgBytes = await fetch(sig.dataUrl).then((r) => r.arrayBuffer());
        const embed = sig.dataUrl.includes("image/png")
          ? await doc.embedPng(imgBytes)
          : await doc.embedJpg(imgBytes);

        // Convert percentages to PDF coordinates (bottom-left origin)
        const x = (sig.xPct / 100) * pw;
        const sigW = (sig.widthPct / 100) * pw;
        const sigH = (sig.heightPct / 100) * ph;
        // PDF Y is from bottom, canvas Y from top
        const y = ph - (sig.yPct / 100) * ph - sigH;

        page.drawImage(embed, { x, y, width: sigW, height: sigH, opacity: 0.95 });
      }

      const out = await doc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(".pdf", "_signed.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const currentPageSigs = placedSigs.filter((s) => s.page === currentPage);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Dancing+Script:wght@600&display=swap');

        .sign-root {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          color: #e0e0e0;
        }

        /* Top bar */
        .sign-topbar {
          background: #0f0f0f;
          border-bottom: 1px solid #1a1a1a;
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .topbar-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: #f0f0f0;
        }
        .topbar-title span { color: #F59E0B; font-style: italic; }

        .topbar-actions { display: flex; align-items: center; gap: 8px; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 9px;
          background: transparent; border: 1px solid #222;
          color: #777; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .btn-ghost:hover { background: #161616; color: #ccc; border-color: #2a2a2a; }

        .btn-amber {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 9px;
          background: #F59E0B; border: none;
          color: #0a0a0a; font-size: 0.8rem; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s;
        }
        .btn-amber:hover { opacity: 0.88; }
        .btn-amber:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Upload zone */
        .upload-zone {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: calc(100vh - 56px);
          padding: 40px 24px;
        }
        .upload-card {
          width: 100%; max-width: 520px;
          border: 2px dashed #222;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #0f0f0f;
        }
        .upload-card:hover { border-color: #F59E0B44; background: #111; }
        .upload-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          color: #F59E0B;
        }
        .upload-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem; color: #f0f0f0; margin-bottom: 8px;
        }
        .upload-sub { font-size: 0.875rem; color: #555; line-height: 1.6; }

        /* Main layout */
        .sign-layout {
          display: flex;
          height: calc(100vh - 56px);
          overflow: hidden;
        }

        /* Left panel */
        .left-panel {
          width: 300px;
          flex-shrink: 0;
          background: #0d0d0d;
          border-right: 1px solid #1a1a1a;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .panel-section {
          padding: 20px;
          border-bottom: 1px solid #141414;
        }
        .panel-label {
          font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #444; margin-bottom: 12px;
        }

        /* Sig type tabs */
        .sig-tabs {
          display: flex; gap: 4px;
          background: #111; border-radius: 10px; padding: 3px;
        }
        .sig-tab {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 5px; padding: 7px 4px; border-radius: 8px;
          border: none; background: transparent;
          color: #555; font-size: 0.75rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .sig-tab.active {
          background: #1a1a1a; color: #F59E0B;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        /* Draw canvas */
        .draw-canvas-wrap {
          border: 1px solid #1e1e1e; border-radius: 12px;
          overflow: hidden; background: #fafaf8;
          cursor: crosshair; position: relative;
        }
        .draw-canvas-wrap canvas {
          display: block; width: 100%; touch-action: none;
        }
        .canvas-hint {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          font-size: 0.75rem; color: #ccc; pointer-events: none;
          font-style: italic; white-space: nowrap;
        }

        /* Typed sig */
        .typed-input {
          width: 100%; background: #111; border: 1px solid #1e1e1e;
          border-radius: 10px; padding: 10px 14px;
          color: #e0e0e0; font-size: 0.9rem; outline: none;
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .typed-input:focus { border-color: #F59E0B44; }

        .font-options {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px;
        }
        .font-option {
          padding: 8px 6px; border-radius: 8px; border: 1px solid #1e1e1e;
          background: #111; cursor: pointer; text-align: center;
          color: #888; font-size: 0.75rem;
          transition: all 0.15s;
        }
        .font-option.active { border-color: #F59E0B55; background: #161200; color: #F59E0B; }

        /* Signature preview */
        .sig-preview {
          background: #fafaf8; border-radius: 10px;
          border: 1px solid #1e1e1e;
          overflow: hidden;
          height: 80px;
          display: flex; align-items: center; justify-content: center;
          margin-top: 12px;
        }
        .sig-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }

        /* Place instructions */
        .place-hint {
          background: rgba(245,158,11,0.06);
          border: 1px solid rgba(245,158,11,0.15);
          border-radius: 10px; padding: 12px 14px;
          font-size: 0.78rem; color: #a0885a; line-height: 1.55;
        }
        .place-hint strong { color: #F59E0B; }

        /* Placed sigs list */
        .placed-list { display: flex; flex-direction: column; gap: 6px; }
        .placed-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 9px;
          background: #111; border: 1px solid #1e1e1e;
          cursor: pointer; transition: all 0.15s;
        }
        .placed-item.active-item { border-color: #F59E0B44; background: #141200; }
        .placed-item-thumb {
          width: 44px; height: 28px; object-fit: contain;
          background: #fafaf8; border-radius: 5px; padding: 2px;
        }
        .placed-item-info { flex: 1; min-width: 0; }
        .placed-item-label { font-size: 0.75rem; color: #888; }
        .placed-item-page { font-size: 0.7rem; color: #444; }
        .placed-item-del {
          width: 26px; height: 26px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none;
          color: #444; cursor: pointer;
          transition: all 0.15s;
        }
        .placed-item-del:hover { background: #2a1010; color: #ef4444; }

        /* Center canvas area */
        .canvas-area {
          flex: 1; overflow: auto;
          display: flex; flex-direction: column;
          align-items: center;
          background: #111;
          padding: 32px 24px;
          gap: 16px;
        }

        /* Page controls */
        .page-controls {
          display: flex; align-items: center; gap: 10px;
          background: #0f0f0f; border: 1px solid #1a1a1a;
          border-radius: 12px; padding: 6px 12px;
          font-size: 0.8rem; color: #666;
          position: sticky; top: 0; z-index: 10;
        }
        .page-btn {
          width: 28px; height: 28px; border-radius: 7px;
          background: transparent; border: 1px solid #1e1e1e;
          color: #666; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) { background: #1a1a1a; color: #ccc; }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .zoom-controls {
          display: flex; align-items: center; gap: 6px;
          margin-left: 8px; padding-left: 12px;
          border-left: 1px solid #1e1e1e;
        }

        /* Page container */
        .page-wrap {
          position: relative;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
          border-radius: 4px;
          overflow: hidden;
          cursor: crosshair;
          user-select: none;
          flex-shrink: 0;
        }
        .page-wrap img { display: block; }

        /* Placed signature overlay */
        .sig-overlay {
          position: absolute;
          cursor: move;
          border: 2px solid transparent;
          border-radius: 4px;
          transition: border-color 0.15s;
        }
        .sig-overlay:hover { border-color: rgba(245,158,11,0.5); }
        .sig-overlay.sig-active { border-color: #F59E0B; }

        .sig-overlay img {
          width: 100%; height: 100%;
          object-fit: contain; display: block;
          pointer-events: none;
        }

        /* Resize handle */
        .resize-handle {
          position: absolute; bottom: -5px; right: -5px;
          width: 14px; height: 14px;
          background: #F59E0B; border-radius: 3px;
          cursor: se-resize;
          border: 2px solid #0a0a0a;
        }

        /* Delete button on sig */
        .sig-delete-btn {
          position: absolute; top: -10px; right: -10px;
          width: 20px; height: 20px;
          background: #ef4444; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: 2px solid #0a0a0a;
          color: white;
          transition: transform 0.15s;
        }
        .sig-delete-btn:hover { transform: scale(1.15); }
      `}</style>

      <div className="sign-root">

        {/* Top bar */}
        <div className="sign-topbar">
          <span className="topbar-title">
            PDF<span>Master</span> — <span style={{ color: "#888", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", fontStyle: "normal" }}>Sign Document</span>
          </span>

          <div className="topbar-actions">
            {pdfFile && (
              <>
                <span style={{ fontSize: "0.78rem", color: "#444", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pdfFile.name}
                </span>
                <button className="btn-ghost" onClick={() => { setPdfFile(null); setPageImages([]); setPlacedSigs([]); setStep("upload"); setSignatureDataUrl(null); }}>
                  <RotateCcw style={{ width: "13px", height: "13px" }} /> New file
                </button>
              </>
            )}
            <button
              className="btn-amber"
              disabled={placedSigs.length === 0 || processing}
              onClick={exportPDF}
            >
              <Download style={{ width: "13px", height: "13px" }} />
              {processing ? "Exporting…" : `Export PDF${placedSigs.length > 0 ? ` (${placedSigs.length})` : ""}`}
            </button>
          </div>
        </div>

        {/* Upload */}
        {step === "upload" && (
          <div className="upload-zone">
            <div
              className="upload-card"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFileUpload(f);
              }}
            >
              <div className="upload-icon">
                <Upload style={{ width: "24px", height: "24px" }} />
              </div>
              <h2 className="upload-title">Drop your PDF here</h2>
              <p className="upload-sub">or click to browse — PDF files only</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          </div>
        )}

        {/* Sign + Place */}
        {(step === "sign" || step === "place") && (
          <div className="sign-layout">

            {/* ── Left Panel ── */}
            <div className="left-panel">

              {/* Signature creator */}
              <div className="panel-section">
                <p className="panel-label">Create Signature</p>

                {/* Type tabs */}
                <div className="sig-tabs" style={{ marginBottom: "16px" }}>
                  {(["draw", "type", "image"] as SignatureType[]).map((t) => (
                    <button
                      key={t}
                      className={`sig-tab${sigType === t ? " active" : ""}`}
                      onClick={() => { setSigType(t); setStep("sign"); }}
                    >
                      {t === "draw" && <Pen style={{ width: "12px", height: "12px" }} />}
                      {t === "type" && <Type style={{ width: "12px", height: "12px" }} />}
                      {t === "image" && <ImageIcon style={{ width: "12px", height: "12px" }} />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Draw */}
                {sigType === "draw" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="draw-canvas-wrap">
                      <canvas
                        ref={drawCanvasRef}
                        width={520}
                        height={180}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={endDraw}
                      />
                      <div className="canvas-hint">Draw your signature here</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-ghost" style={{ flex: 1 }} onClick={clearDrawCanvas}>
                        <Trash2 style={{ width: "12px", height: "12px" }} /> Clear
                      </button>
                      <button className="btn-amber" style={{ flex: 1 }} onClick={confirmDrawSignature}>
                        <Check style={{ width: "12px", height: "12px" }} /> Use
                      </button>
                    </div>
                  </div>
                )}

                {/* Type */}
                {sigType === "type" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input
                      className="typed-input"
                      placeholder="Your name…"
                      value={typedText}
                      onChange={(e) => setTypedText(e.target.value)}
                    />
                    <div className="font-options">
                      {TYPED_FONTS.map((f, i) => (
                        <button
                          key={f.label}
                          className={`font-option${typedFont === i ? " active" : ""}`}
                          onClick={() => setTypedFont(i)}
                          style={{ fontStyle: f.label === "Elegant" || f.label === "Classic" ? "italic" : "normal" }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {typedText && (
                      <div className="sig-preview">
                        <span style={{ font: TYPED_FONTS[typedFont].style, color: "#1a1a2e", fontFamily: TYPED_FONTS[typedFont].style.includes("Dancing") ? "'Dancing Script'" : "inherit" }}>
                          {typedText}
                        </span>
                      </div>
                    )}
                    <button className="btn-amber" onClick={generateTypedSig} disabled={!typedText.trim()}>
                      <Check style={{ width: "12px", height: "12px" }} /> Use Signature
                    </button>
                  </div>
                )}

                {/* Image */}
                {sigType === "image" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button
                      className="btn-ghost"
                      style={{ width: "100%", justifyContent: "center", padding: "16px" }}
                      onClick={() => imgInputRef.current?.click()}
                    >
                      <Upload style={{ width: "13px", height: "13px" }} /> Upload signature image
                    </button>
                    <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    <p style={{ fontSize: "0.72rem", color: "#444", textAlign: "center", lineHeight: 1.5 }}>
                      PNG with transparent background works best
                    </p>
                  </div>
                )}
              </div>

              {/* Current signature preview */}
              {signatureDataUrl && (
                <div className="panel-section">
                  <p className="panel-label">Active Signature</p>
                  <div className="sig-preview">
                    <img src={signatureDataUrl} alt="signature" />
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: "0.75rem" }} onClick={() => { setSignatureDataUrl(null); setStep("sign"); }}>
                      <X style={{ width: "11px", height: "11px" }} /> Change
                    </button>
                    <button className="btn-amber" style={{ flex: 1, fontSize: "0.75rem" }} onClick={() => setStep("place")}>
                      <Move style={{ width: "11px", height: "11px" }} /> Place on PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Placement instructions */}
              {step === "place" && signatureDataUrl && (
                <div className="panel-section">
                  <div className="place-hint">
                    <strong>Click</strong> anywhere on the PDF to place your signature.<br /><br />
                    <strong>Drag</strong> to reposition it.<br /><br />
                    <strong>Resize</strong> using the amber handle.<br /><br />
                    Place on <strong>multiple pages</strong> by navigating pages.
                  </div>
                </div>
              )}

              {/* Placed signatures list */}
              {placedSigs.length > 0 && (
                <div className="panel-section" style={{ flex: 1 }}>
                  <p className="panel-label">Placed ({placedSigs.length})</p>
                  <div className="placed-list">
                    {placedSigs.map((sig, i) => (
                      <div
                        key={sig.id}
                        className={`placed-item${activeId === sig.id ? " active-item" : ""}`}
                        onClick={() => { setCurrentPage(sig.page); setActiveId(sig.id); }}
                      >
                        <img src={sig.dataUrl} className="placed-item-thumb" alt="" />
                        <div className="placed-item-info">
                          <p className="placed-item-label">Signature {i + 1}</p>
                          <p className="placed-item-page">Page {sig.page + 1}</p>
                        </div>
                        <button className="placed-item-del" onClick={(e) => { e.stopPropagation(); deleteSig(sig.id); }}>
                          <Trash2 style={{ width: "11px", height: "11px" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── PDF Canvas Area ── */}
            <div className="canvas-area">

              {/* Page + zoom controls */}
              <div className="page-controls">
                <button className="page-btn" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                  <ChevronLeft style={{ width: "14px", height: "14px" }} />
                </button>
                <span style={{ minWidth: "80px", textAlign: "center" }}>
                  Page {currentPage + 1} / {totalPages}
                </span>
                <button className="page-btn" disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                  <ChevronRight style={{ width: "14px", height: "14px" }} />
                </button>
                <div className="zoom-controls">
                  <button className="page-btn" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>
                    <ZoomOut style={{ width: "13px", height: "13px" }} />
                  </button>
                  <span style={{ fontSize: "0.75rem", minWidth: "40px", textAlign: "center" }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button className="page-btn" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>
                    <ZoomIn style={{ width: "13px", height: "13px" }} />
                  </button>
                </div>
              </div>

              {/* PDF page with signature overlays */}
              {pageImages[currentPage] && (
                <div
                  ref={pageContainerRef}
                  className="page-wrap"
                  style={{ width: `${700 * zoom}px` }}
                  onClick={step === "place" && signatureDataUrl ? handlePageClick : undefined}
                  onMouseMove={onMouseMovePage}
                  onMouseUp={onMouseUpPage}
                  onMouseLeave={onMouseUpPage}
                >
                  <img
                    src={pageImages[currentPage]}
                    alt={`Page ${currentPage + 1}`}
                    style={{ width: "100%", display: "block", pointerEvents: "none" }}
                    draggable={false}
                  />

                  {/* Signature overlays */}
                  {currentPageSigs.map((sig) => (
                    <div
                      key={sig.id}
                      className={`sig-overlay${activeId === sig.id ? " sig-active" : ""}`}
                      style={{
                        left: `${sig.xPct}%`,
                        top: `${sig.yPct}%`,
                        width: `${sig.widthPct}%`,
                        height: `${sig.heightPct}%`,
                      }}
                      onMouseDown={(e) => onMouseDownSig(e, sig.id)}
                      onClick={(e) => { e.stopPropagation(); setActiveId(sig.id); }}
                    >
                      <img src={sig.dataUrl} alt="signature" draggable={false} />

                      {/* Delete button */}
                      {activeId === sig.id && (
                        <>
                          <div
                            className="sig-delete-btn"
                            onClick={(e) => { e.stopPropagation(); deleteSig(sig.id); }}
                          >
                            <X style={{ width: "10px", height: "10px" }} />
                          </div>
                          {/* Resize handle */}
                          <div
                            className="resize-handle"
                            onMouseDown={(e) => onResizeMouseDown(e, sig.id)}
                          />
                        </>
                      )}
                    </div>
                  ))}

                  {/* Cursor hint when placing */}
                  {step === "place" && signatureDataUrl && currentPageSigs.length === 0 && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none",
                    }}>
                      <div style={{
                        background: "rgba(245,158,11,0.08)",
                        border: "1px dashed rgba(245,158,11,0.3)",
                        borderRadius: "12px", padding: "16px 24px",
                        color: "#a0885a", fontSize: "0.85rem", fontStyle: "italic",
                      }}>
                        Click to place your signature
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}