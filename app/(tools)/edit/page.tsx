"use client";
import { useState, useRef, useCallback } from "react";
import type * as PdfjsLibType from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import {
  Upload, Download, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Square, Minus, Type, MousePointer,
} from "lucide-react";

// Safe client-only pdfjs loader
async function getPdfjs(): Promise<typeof PdfjsLibType> {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
  return lib;
}

type Tool = "select" | "text" | "rect" | "line";

interface Annotation {
  id: string;
  type: "text" | "rect" | "line";
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  fontSize?: number;
}

const COLORS = ["#1a1a2e", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

export default function EditPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [tool, setTool] = useState<Tool>("select");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [color, setColor] = useState("#ef4444");
  const [fontSize, setFontSize] = useState(16);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ x2: number; y2: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [pendingTextPos, setPendingTextPos] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");

  const PAGE_WIDTH = 700;

  const renderPDF = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const pdfjs = await getPdfjs();
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: bytes }).promise;
      const images: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({
          canvasContext: canvas.getContext("2d")!,
          viewport: vp,
        }).promise;
        images.push(canvas.toDataURL("image/png"));
      }
      setPageImages(images);
      setTotalPages(pdf.numPages);
      setCurrentPage(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") return;
    setPdfFile(file);
    setAnnotations([]);
    await renderPDF(file);
  };

  // Get position relative to page container as percentage
  const getPos = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool === "select") return;
    e.preventDefault();
    const pos = getPos(e);

    if (tool === "text") {
      setPendingTextPos(pos);
      setTextValue("");
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    setIsDrawing(true);
    setDrawStart(pos);
    setCurrentDraw(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const pos = getPos(e);
    setCurrentDraw({ x2: pos.x, y2: pos.y });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const pos = getPos(e);
    const id = `ann-${Date.now()}`;

    if (tool === "rect") {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const width = Math.abs(pos.x - drawStart.x);
      const height = Math.abs(pos.y - drawStart.y);
      if (width > 0.5 && height > 0.5) {
        setAnnotations((prev) => [...prev, {
          id, type: "rect", page: currentPage,
          x, y, width, height, color,
        }]);
        setSelectedId(id);
      }
    } else if (tool === "line") {
      if (Math.abs(pos.x - drawStart.x) > 0.5 || Math.abs(pos.y - drawStart.y) > 0.5) {
        setAnnotations((prev) => [...prev, {
          id, type: "line", page: currentPage,
          x: drawStart.x, y: drawStart.y,
          x2: pos.x, y2: pos.y, color,
        }]);
        setSelectedId(id);
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
  };

  const confirmText = () => {
    if (!pendingTextPos || !textValue.trim()) {
      setPendingTextPos(null);
      return;
    }
    const id = `ann-${Date.now()}`;
    setAnnotations((prev) => [...prev, {
      id, type: "text", page: currentPage,
      x: pendingTextPos.x, y: pendingTextPos.y,
      text: textValue, color, fontSize,
    }]);
    setSelectedId(id);
    setPendingTextPos(null);
    setTextValue("");
  };

  // Drag annotation
  const onAnnMouseDown = (e: React.MouseEvent, id: string) => {
    if (tool !== "select") return;
    e.stopPropagation();
    setSelectedId(id);
    const pos = getPos(e);
    const ann = annotations.find((a) => a.id === id)!;
    setDragOffset({ x: pos.x - ann.x, y: pos.y - ann.y });
    setDraggingId(id);
  };

  const onContainerMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !dragOffset) return;
    const pos = getPos(e);
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === draggingId
          ? { ...a, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
          : a
      )
    );
  };

  const onContainerMouseUp = () => {
    setDraggingId(null);
    setDragOffset(null);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  };

  const undo = () => {
    setAnnotations((prev) => {
      const onPage = prev.filter((a) => a.page === currentPage);
      if (onPage.length === 0) return prev;
      const lastId = onPage[onPage.length - 1].id;
      return prev.filter((a) => a.id !== lastId);
    });
    setSelectedId(null);
  };

  // Export PDF
  const exportPDF = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    try {
      const bytes = await pdfFile.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();

      for (const ann of annotations) {
        const page = pages[ann.page];
        const { width: pw, height: ph } = page.getSize();

        // Convert pct to PDF coords
        const x = (ann.x / 100) * pw;
        const y = ph - (ann.y / 100) * ph;

        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return rgb(r, g, b);
        };

        if (ann.type === "text" && ann.text) {
          page.drawText(ann.text, {
            x,
            y: y - (ann.fontSize || 16),
            size: ann.fontSize || 16,
            color: hexToRgb(ann.color),
          });
        } else if (ann.type === "rect" && ann.width && ann.height) {
          const w = (ann.width / 100) * pw;
          const h = (ann.height / 100) * ph;
          page.drawRectangle({
            x,
            y: y - h,
            width: w,
            height: h,
            borderColor: hexToRgb(ann.color),
            borderWidth: 2,
            opacity: 0,
            borderOpacity: 0.9,
          });
        } else if (ann.type === "line" && ann.x2 !== undefined && ann.y2 !== undefined) {
          const x2 = (ann.x2 / 100) * pw;
          const y2 = ph - (ann.y2 / 100) * ph;
          page.drawLine({
            start: { x, y },
            end: { x: x2, y: y2 },
            color: hexToRgb(ann.color),
            thickness: 2,
            opacity: 0.9,
          });
        }
      }

      const out = await doc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(".pdf", "_edited.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setProcessing(false);
    }
  };

  const currentAnns = annotations.filter((a) => a.page === currentPage);
  const totalAnns = annotations.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        .edit-root {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          color: #e0e0e0;
        }
        .edit-topbar {
          background: #0f0f0f;
          border-bottom: 1px solid #1a1a1a;
          padding: 0 20px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .topbar-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1rem;
          color: #f0f0f0;
        }
        .topbar-title em { color: #F59E0B; font-style: italic; }
        .tb-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 8px;
          border: 1px solid #222; background: transparent;
          color: #777; font-size: 0.78rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .tb-btn:hover { background: #161616; color: #ccc; border-color: #2a2a2a; }
        .tb-btn-amber {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 16px; border-radius: 8px;
          border: none; background: #F59E0B;
          color: #0a0a0a; font-size: 0.78rem; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s;
        }
        .tb-btn-amber:hover { opacity: 0.88; }
        .tb-btn-amber:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Layout */
        .edit-layout {
          display: flex;
          height: calc(100vh - 54px);
          overflow: hidden;
        }

        /* Toolbar */
        .tool-panel {
          width: 220px;
          flex-shrink: 0;
          background: #0d0d0d;
          border-right: 1px solid #1a1a1a;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .tool-section {
          padding: 16px;
          border-bottom: 1px solid #141414;
        }
        .tool-section-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3a3a3a;
          margin-bottom: 10px;
        }
        .tool-btn {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 9px 11px;
          border-radius: 9px; border: 1px solid transparent;
          background: transparent; color: #666;
          font-size: 0.82rem; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s; text-align: left;
        }
        .tool-btn:hover { background: #141414; color: #ccc; }
        .tool-btn.active {
          background: #141200;
          border-color: rgba(245,158,11,0.25);
          color: #F59E0B;
        }
        .color-grid {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .color-dot {
          width: 22px; height: 22px; border-radius: 50%;
          cursor: pointer; border: 2px solid transparent;
          transition: transform 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .color-dot:hover { transform: scale(1.15); }
        .color-dot.active { border-color: #fff; transform: scale(1.1); }
        .size-row {
          display: flex; align-items: center; gap: 8px;
        }
        .size-slider {
          flex: 1; accent-color: #F59E0B;
          height: 3px; cursor: pointer;
        }
        .size-val {
          font-size: 0.75rem; color: #555;
          min-width: 28px; text-align: right;
        }

        /* Canvas area */
        .canvas-area {
          flex: 1;
          overflow: auto;
          background: #111;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 24px;
          gap: 14px;
        }
        .page-controls {
          display: flex; align-items: center; gap: 8px;
          background: #0f0f0f; border: 1px solid #1a1a1a;
          border-radius: 10px; padding: 5px 10px;
          font-size: 0.78rem; color: #555;
          position: sticky; top: 0; z-index: 10;
        }
        .pg-btn {
          width: 26px; height: 26px; border-radius: 6px;
          background: transparent; border: 1px solid #1e1e1e;
          color: #555; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .pg-btn:hover:not(:disabled) { background: #1a1a1a; color: #ccc; }
        .pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .zoom-sep { width: 1px; height: 16px; background: #1e1e1e; margin: 0 4px; }

        /* Page wrapper */
        .page-wrap {
          position: relative;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
          border-radius: 3px;
          overflow: visible;
          flex-shrink: 0;
          background: white;
        }
        .page-img { display: block; pointer-events: none; }

        /* Annotation overlay */
        .ann-overlay {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        /* Upload screen */
        .upload-screen {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: calc(100vh - 54px);
          padding: 24px;
        }
        .upload-card {
          width: 100%; max-width: 460px;
          border: 2px dashed #1e1e1e;
          border-radius: 18px;
          padding: 56px 32px;
          text-align: center;
          cursor: pointer;
          background: #0f0f0f;
          transition: all 0.2s;
        }
        .upload-card.over {
          border-color: rgba(245,158,11,0.35);
          background: rgba(245,158,11,0.03);
        }
        .upload-card:hover { border-color: #2a2a2a; }

        /* Text input overlay */
        .text-input-overlay {
          position: absolute;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.4);
          border-radius: 6px;
          padding: 2px 6px;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a2e;
          background: rgba(255,255,255,0.9);
          min-width: 80px;
          z-index: 20;
        }

        /* Annotation elements */
        .ann-text {
          position: absolute;
          cursor: move;
          white-space: nowrap;
          user-select: none;
          padding: 1px 3px;
          border-radius: 3px;
          transition: outline 0.1s;
        }
        .ann-text:hover, .ann-text.selected {
          outline: 1px dashed rgba(245,158,11,0.6);
        }
        .ann-rect {
          position: absolute;
          cursor: move;
          user-select: none;
          transition: outline 0.1s;
        }
        .ann-rect:hover, .ann-rect.selected {
          outline: 1px dashed rgba(245,158,11,0.6);
        }

        /* Loading */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid #222;
          border-top-color: #F59E0B;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      <div className="edit-root">

        {/* Topbar */}
        <div className="edit-topbar">
          <span className="topbar-title">
            PDF<em>Master</em>
            <span style={{ color: "#333", fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", fontStyle: "normal", marginLeft: "8px" }}>
              — Edit PDF
            </span>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {pdfFile && (
              <>
                <span style={{ fontSize: "0.75rem", color: "#444", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pdfFile.name}
                </span>
                {totalAnns > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: "99px" }}>
                    {totalAnns} annotation{totalAnns !== 1 ? "s" : ""}
                  </span>
                )}
                <button className="tb-btn" onClick={undo}>
                  <RotateCcw style={{ width: "12px", height: "12px" }} /> Undo
                </button>
                {selectedId && (
                  <button className="tb-btn" style={{ color: "#ef4444", borderColor: "#2a1010" }} onClick={deleteSelected}>
                    <Trash2 style={{ width: "12px", height: "12px" }} /> Delete
                  </button>
                )}
                <button className="tb-btn" onClick={() => { setPdfFile(null); setPageImages([]); setAnnotations([]); }}>
                  New file
                </button>
              </>
            )}
            <button
              className="tb-btn-amber"
              disabled={!pdfFile || processing}
              onClick={exportPDF}
            >
              <Download style={{ width: "12px", height: "12px" }} />
              {processing ? "Saving…" : "Export PDF"}
            </button>
          </div>
        </div>

        {/* Upload screen */}
        {!pdfFile && (
          <div className="upload-screen">
            <div
              className={`upload-card${dragOver ? " over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                  <div className="spinner" />
                  <p style={{ fontSize: "0.875rem", color: "#555" }}>Loading PDF…</p>
                </div>
              ) : (
                <>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 18px", color: "#F59E0B",
                  }}>
                    <Upload style={{ width: "22px", height: "22px" }} />
                  </div>
                  <h2 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "1.5rem", color: "#f0f0f0", marginBottom: "8px",
                  }}>
                    Drop your PDF here
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#555" }}>
                    or <span style={{ color: "#F59E0B" }}>click to browse</span> — PDF files only
                  </p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* Editor */}
        {pdfFile && pageImages.length > 0 && (
          <div className="edit-layout">

            {/* Tool panel */}
            <div className="tool-panel">

              <div className="tool-section">
                <p className="tool-section-label">Tools</p>
                {([
                  { id: "select", icon: MousePointer, label: "Select & Move" },
                  { id: "text", icon: Type, label: "Add Text" },
                  { id: "rect", icon: Square, label: "Rectangle" },
                  { id: "line", icon: Minus, label: "Line" },
                ] as { id: Tool; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    className={`tool-btn${tool === id ? " active" : ""}`}
                    onClick={() => { setTool(id); setPendingTextPos(null); }}
                  >
                    <Icon style={{ width: "14px", height: "14px", flexShrink: 0 }} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="tool-section">
                <p className="tool-section-label">Color</p>
                <div className="color-grid">
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      className={`color-dot${color === c ? " active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.72rem", color: "#444" }}>Custom</span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      width: "28px", height: "22px", borderRadius: "6px",
                      border: "1px solid #222", background: "none", cursor: "pointer", padding: "1px",
                    }}
                  />
                </div>
              </div>

              {tool === "text" && (
                <div className="tool-section">
                  <p className="tool-section-label">Font Size</p>
                  <div className="size-row">
                    <input
                      type="range" min="8" max="72" value={fontSize}
                      className="size-slider"
                      onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                    <span className="size-val">{fontSize}px</span>
                  </div>
                </div>
              )}

              {/* Annotations list */}
              {currentAnns.length > 0 && (
                <div className="tool-section" style={{ flex: 1 }}>
                  <p className="tool-section-label">
                    Page annotations ({currentAnns.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {currentAnns.map((ann, i) => (
                      <div
                        key={ann.id}
                        onClick={() => { setSelectedId(ann.id); setTool("select"); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "7px 9px", borderRadius: "8px",
                          background: selectedId === ann.id ? "#141200" : "#111",
                          border: `1px solid ${selectedId === ann.id ? "rgba(245,158,11,0.25)" : "#1a1a1a"}`,
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        <div style={{
                          width: "8px", height: "8px", borderRadius: "50%",
                          background: ann.color, flexShrink: 0,
                        }} />
                        <span style={{ fontSize: "0.75rem", color: "#777", flex: 1 }}>
                          {ann.type === "text" ? `"${ann.text?.slice(0, 12)}${(ann.text?.length || 0) > 12 ? "…" : ""}"` : ann.type}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAnnotations((p) => p.filter((a) => a.id !== ann.id)); if (selectedId === ann.id) setSelectedId(null); }}
                          style={{ background: "none", border: "none", color: "#333", cursor: "pointer", padding: "2px", display: "flex" }}
                        >
                          <Trash2 style={{ width: "11px", height: "11px" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Canvas area */}
            <div className="canvas-area">

              {/* Page controls */}
              <div className="page-controls">
                <button className="pg-btn" disabled={currentPage === 0}
                  onClick={() => { setCurrentPage((p) => p - 1); setSelectedId(null); }}>
                  <ChevronLeft style={{ width: "13px", height: "13px" }} />
                </button>
                <span style={{ minWidth: "90px", textAlign: "center" }}>
                  Page {currentPage + 1} / {totalPages}
                </span>
                <button className="pg-btn" disabled={currentPage === totalPages - 1}
                  onClick={() => { setCurrentPage((p) => p + 1); setSelectedId(null); }}>
                  <ChevronRight style={{ width: "13px", height: "13px" }} />
                </button>
                <span className="zoom-sep" />
                <button className="pg-btn" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>
                  <ZoomOut style={{ width: "12px", height: "12px" }} />
                </button>
                <span style={{ fontSize: "0.72rem", minWidth: "38px", textAlign: "center" }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button className="pg-btn" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>
                  <ZoomIn style={{ width: "12px", height: "12px" }} />
                </button>
              </div>

              {/* Page */}
              <div
                className="page-wrap"
                style={{
                  width: `${PAGE_WIDTH * zoom}px`,
                  cursor: tool === "select" ? "default" : tool === "text" ? "text" : "crosshair",
                }}
                ref={containerRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={(e) => { handleCanvasMouseMove(e); onContainerMouseMove(e); }}
                onMouseUp={(e) => { handleCanvasMouseUp(e); onContainerMouseUp(); }}
                onMouseLeave={onContainerMouseUp}
                onClick={(e) => {
                  if (tool === "select" && !draggingId) setSelectedId(null);
                }}
              >
                <img
                  src={pageImages[currentPage]}
                  className="page-img"
                  style={{ width: "100%", display: "block" }}
                  draggable={false}
                  alt={`Page ${currentPage + 1}`}
                />

                {/* Annotations */}
                <div className="ann-overlay">
                  {currentAnns.map((ann) => {
                    if (ann.type === "text") {
                      return (
                        <div
                          key={ann.id}
                          className={`ann-text${selectedId === ann.id ? " selected" : ""}`}
                          style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                            color: ann.color,
                            fontSize: `${(ann.fontSize || 16) * zoom}px`,
                          }}
                          onMouseDown={(e) => onAnnMouseDown(e, ann.id)}
                        >
                          {ann.text}
                        </div>
                      );
                    }
                    if (ann.type === "rect") {
                      return (
                        <div
                          key={ann.id}
                          className={`ann-rect${selectedId === ann.id ? " selected" : ""}`}
                          style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                            width: `${ann.width}%`,
                            height: `${ann.height}%`,
                            border: `2px solid ${ann.color}`,
                          }}
                          onMouseDown={(e) => onAnnMouseDown(e, ann.id)}
                        />
                      );
                    }
                    if (ann.type === "line" && ann.x2 !== undefined && ann.y2 !== undefined) {
                      const rect = containerRef.current?.getBoundingClientRect();
                      const cw = rect?.width || PAGE_WIDTH * zoom;
                      const ch = rect?.height || (PAGE_WIDTH * zoom * 1.414);
                      const x1px = (ann.x / 100) * cw;
                      const y1px = (ann.y / 100) * ch;
                      const x2px = (ann.x2 / 100) * cw;
                      const y2px = (ann.y2 / 100) * ch;
                      const len = Math.hypot(x2px - x1px, y2px - y1px);
                      const angle = Math.atan2(y2px - y1px, x2px - x1px) * (180 / Math.PI);
                      return (
                        <div
                          key={ann.id}
                          className={`ann-rect${selectedId === ann.id ? " selected" : ""}`}
                          style={{
                            position: "absolute",
                            left: `${x1px}px`,
                            top: `${y1px}px`,
                            width: `${len}px`,
                            height: "2px",
                            background: ann.color,
                            transformOrigin: "0 50%",
                            transform: `rotate(${angle}deg)`,
                            cursor: "move",
                          }}
                          onMouseDown={(e) => onAnnMouseDown(e, ann.id)}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Live draw preview */}
                  {isDrawing && drawStart && currentDraw && (
                    <>
                      {tool === "rect" && (
                        <div style={{
                          position: "absolute",
                          left: `${Math.min(drawStart.x, currentDraw.x2)}%`,
                          top: `${Math.min(drawStart.y, currentDraw.y2)}%`,
                          width: `${Math.abs(currentDraw.x2 - drawStart.x)}%`,
                          height: `${Math.abs(currentDraw.y2 - drawStart.y)}%`,
                          border: `2px solid ${color}`,
                          pointerEvents: "none",
                          opacity: 0.7,
                        }} />
                      )}
                      {tool === "line" && (() => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        const cw = rect?.width || PAGE_WIDTH * zoom;
                        const ch = rect?.height || PAGE_WIDTH * zoom * 1.414;
                        const x1px = (drawStart.x / 100) * cw;
                        const y1px = (drawStart.y / 100) * ch;
                        const x2px = (currentDraw.x2 / 100) * cw;
                        const y2px = (currentDraw.y2 / 100) * ch;
                        const len = Math.hypot(x2px - x1px, y2px - y1px);
                        const angle = Math.atan2(y2px - y1px, x2px - x1px) * (180 / Math.PI);
                        return (
                          <div style={{
                            position: "absolute",
                            left: `${x1px}px`, top: `${y1px}px`,
                            width: `${len}px`, height: "2px",
                            background: color,
                            transformOrigin: "0 50%",
                            transform: `rotate(${angle}deg)`,
                            pointerEvents: "none",
                            opacity: 0.7,
                          }} />
                        );
                      })()}
                    </>
                  )}

                  {/* Pending text input */}
                  {pendingTextPos && (
                    <input
                      ref={textInputRef}
                      className="text-input-overlay"
                      style={{
                        left: `${pendingTextPos.x}%`,
                        top: `${pendingTextPos.y}%`,
                        fontSize: `${fontSize * zoom}px`,
                        color: color,
                      }}
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmText();
                        if (e.key === "Escape") { setPendingTextPos(null); setTextValue(""); }
                      }}
                      onBlur={confirmText}
                      placeholder="Type here…"
                    />
                  )}
                </div>
              </div>

              {/* Hint */}
              <p style={{ fontSize: "0.72rem", color: "#333", marginTop: "4px" }}>
                {tool === "select" && "Click annotation to select, drag to move"}
                {tool === "text" && "Click on the PDF to place text, press Enter to confirm"}
                {tool === "rect" && "Click and drag to draw a rectangle"}
                {tool === "line" && "Click and drag to draw a line"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}