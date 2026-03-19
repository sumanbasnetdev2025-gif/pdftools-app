"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import type * as PdfjsLibType from "pdfjs-dist";
import {
  Upload,
  Download,
  RotateCcw,
  Pen,
  Type,
  Image as ImageIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Check,
  RotateCw,
  Stamp,
  Save,
  Plus,
} from "lucide-react";

async function getPdfjs(): Promise<typeof PdfjsLibType> {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return lib;
}

type SigType = "draw" | "type" | "image" | "stamp";
type Signer = { id: string; name: string; color: string };

interface PlacedSig {
  id: string;
  dataUrl: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  rotation: number;
  page: number;
  signerId: string;
}

const SIGNER_COLORS = [
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];
const TYPED_FONTS = [
  { label: "Elegant", css: "italic 48px 'Dancing Script', cursive" },
  { label: "Classic", css: "italic 44px Georgia, serif" },
  { label: "Modern", css: "38px 'Courier New', monospace" },
  { label: "Bold", css: "bold 44px Georgia, serif" },
];
const SAVED_SIG_KEY = "pdfmaster_saved_signatures";

export default function SignPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pageWidth, setPageWidth] = useState(700);

  const [signers, setSigners] = useState<Signer[]>([
    { id: "s1", name: "Me", color: SIGNER_COLORS[0] },
  ]);
  const [activeSigner, setActiveSigner] = useState("s1");
  const [sigType, setSigType] = useState<SigType>("draw");
  const [typedText, setTypedText] = useState("");
  const [typedFont, setTypedFont] = useState(0);
  const [currentSigDataUrl, setCurrentSigDataUrl] = useState<string | null>(
    null,
  );
  const [savedSigs, setSavedSigs] = useState<
    { id: string; dataUrl: string; label: string }[]
  >([]);

  const [placedSigs, setPlacedSigs] = useState<PlacedSig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    type: "move" | "resize" | "rotate";
    id: string;
    startX: number;
    startY: number;
    startSig: PlacedSig;
    startAngle?: number;
  } | null>(null);

  const [step, setStep] = useState<"upload" | "work">("upload");
  const [processing, setProcessing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newSignerName, setNewSignerName] = useState("");
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [tab, setTab] = useState<"create" | "saved" | "placed">("create");

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_SIG_KEY);
      if (raw) setSavedSigs(JSON.parse(raw));
    } catch {}
  }, []);

  // Set page width responsively
  useEffect(() => {
    const update = () => {
      const panelW =
        window.innerWidth < 600 ? 0 : window.innerWidth < 768 ? 260 : 300;
      setPageWidth(Math.min(700, window.innerWidth - panelW - 48));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const saveSigToStorage = (dataUrl: string, label: string) => {
    const newSig = { id: `saved-${Date.now()}`, dataUrl, label };
    const updated = [...savedSigs, newSig];
    setSavedSigs(updated);
    try {
      localStorage.setItem(SAVED_SIG_KEY, JSON.stringify(updated));
    } catch {}
  };

  const deleteSavedSig = (id: string) => {
    const updated = savedSigs.filter((s) => s.id !== id);
    setSavedSigs(updated);
    try {
      localStorage.setItem(SAVED_SIG_KEY, JSON.stringify(updated));
    } catch {}
  };

  const renderPDF = useCallback(async (file: File) => {
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
      await (page.render as any)({
        canvasContext: canvas.getContext("2d")!,
        viewport: vp,
      }).promise;
      images.push(canvas.toDataURL("image/png"));
    }
    setPageImages(images);
    setTotalPages(pdf.numPages);
    setCurrentPage(0);
  }, []);

  const handleFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfFile(file);
    await renderPDF(file);
    setStep("work");
  };

  // Draw
  const getPos = (e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const scaleX = (el as HTMLCanvasElement).width / rect.width;
    const scaleY = (el as HTMLCanvasElement).height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const c = drawCanvasRef.current;
    if (!c) return;
    setIsDrawing(true);
    lastPoint.current = getPos(e, c);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const c = drawCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const pos = getPos(e, c);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 3;
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
  const clearCanvas = () => {
    const c = drawCanvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setCurrentSigDataUrl(null);
  };
  const confirmDraw = () => {
    const c = drawCanvasRef.current;
    if (!c) return;
    setCurrentSigDataUrl(c.toDataURL("image/png"));
  };

  const generateTyped = () => {
    if (!typedText.trim()) return;
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 140;
    const ctx = c.getContext("2d")!;
    ctx.font = TYPED_FONTS[typedFont].css;
    ctx.fillStyle = "#1a1a2e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedText, 300, 70);
    setCurrentSigDataUrl(c.toDataURL("image/png"));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCurrentSigDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Place
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentSigDataUrl || dragState) return;
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const signer = signers.find((s) => s.id === activeSigner)!;
    const newSig: PlacedSig = {
      id: `sig-${Date.now()}`,
      dataUrl: currentSigDataUrl,
      xPct: Math.max(0, xPct - 10),
      yPct: Math.max(0, yPct - 5),
      wPct: sigType === "stamp" ? 20 : 24,
      hPct: sigType === "stamp" ? 20 : 12,
      rotation: 0,
      page: currentPage,
      signerId: activeSigner,
    };
    setPlacedSigs((p) => [...p, newSig]);
    setActiveId(newSig.id);
  };

  // ── Unified mouse handlers on the CANVAS AREA (not page-wrap) ──
  // Touch versions of area handlers
  const onAreaTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!dragState) return;
      e.preventDefault();
      const touch = e.touches[0];
      const container = pageContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (dragState.type === "move") {
        const dx = ((touch.clientX - dragState.startX) / rect.width) * 100;
        const dy = ((touch.clientY - dragState.startY) / rect.height) * 100;
        setPlacedSigs((prev) =>
          prev.map((s) =>
            s.id !== dragState.id
              ? s
              : {
                  ...s,
                  xPct: Math.max(
                    0,
                    Math.min(100 - s.wPct, dragState.startSig.xPct + dx),
                  ),
                  yPct: Math.max(
                    0,
                    Math.min(100 - s.hPct, dragState.startSig.yPct + dy),
                  ),
                },
          ),
        );
      }

      if (dragState.type === "resize") {
        const newRight = ((touch.clientX - rect.left) / rect.width) * 100;
        const newBottom = ((touch.clientY - rect.top) / rect.height) * 100;
        setPlacedSigs((prev) =>
          prev.map((s) =>
            s.id !== dragState.id
              ? s
              : {
                  ...s,
                  wPct: Math.max(5, newRight - dragState.startSig.xPct),
                  hPct: Math.max(3, newBottom - dragState.startSig.yPct),
                },
          ),
        );
      }

      if (dragState.type === "rotate") {
        const sig = dragState.startSig;
        const sigCx =
          ((sig.xPct + sig.wPct / 2) / 100) * rect.width + rect.left;
        const sigCy =
          ((sig.yPct + sig.hPct / 2) / 100) * rect.height + rect.top;
        const mouseAngle =
          Math.atan2(touch.clientY - sigCy, touch.clientX - sigCx) *
          (180 / Math.PI);
        const delta = mouseAngle - (dragState.startAngle ?? 0);
        setPlacedSigs((prev) =>
          prev.map((s) =>
            s.id !== dragState.id
              ? s
              : {
                  ...s,
                  rotation: sig.rotation + delta,
                },
          ),
        );
      }
    },
    [dragState],
  );

  const onAreaTouchEnd = useCallback(() => setDragState(null), []);
  const onAreaMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  if (!dragState) return;
  const container = pageContainerRef.current; if (!container) return;
  const rect = container.getBoundingClientRect();

  if (dragState.type === "move") {
    const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.startY) / rect.height) * 100;
    setPlacedSigs(prev => prev.map(s => s.id !== dragState.id ? s : {
      ...s,
      xPct: Math.max(0, Math.min(100 - s.wPct, dragState.startSig.xPct + dx)),
      yPct: Math.max(0, Math.min(100 - s.hPct, dragState.startSig.yPct + dy)),
    }));
  }

  if (dragState.type === "resize") {
    const newRight = ((e.clientX - rect.left) / rect.width) * 100;
    const newBottom = ((e.clientY - rect.top) / rect.height) * 100;
    setPlacedSigs(prev => prev.map(s => s.id !== dragState.id ? s : {
      ...s,
      wPct: Math.max(5, newRight - dragState.startSig.xPct),
      hPct: Math.max(3, newBottom - dragState.startSig.yPct),
    }));
  }

  if (dragState.type === "rotate") {
    const sig = dragState.startSig;
    const sigCx = ((sig.xPct + sig.wPct / 2) / 100) * rect.width + rect.left;
    const sigCy = ((sig.yPct + sig.hPct / 2) / 100) * rect.height + rect.top;
    const mouseAngle = Math.atan2(e.clientY - sigCy, e.clientX - sigCx) * (180 / Math.PI);
    const delta = mouseAngle - (dragState.startAngle ?? 0);
    setPlacedSigs(prev => prev.map(s => s.id !== dragState.id ? s : {
      ...s, rotation: sig.rotation + delta,
    }));
  }
}, [dragState]);

const onSigMouseDown = (e: React.MouseEvent, id: string) => {
  e.stopPropagation(); e.preventDefault();
  setActiveId(id);
  const sig = placedSigs.find(s => s.id === id)!;
  setDragState({ type: "move", id, startX: e.clientX, startY: e.clientY, startSig: { ...sig } });
};

const onResizeMouseDown = (e: React.MouseEvent, id: string) => {
  e.stopPropagation(); e.preventDefault();
  const sig = placedSigs.find(s => s.id === id)!;
  setDragState({ type: "resize", id, startX: e.clientX, startY: e.clientY, startSig: { ...sig } });
};

const onRotateMouseDown = (e: React.MouseEvent, id: string) => {
  e.stopPropagation(); e.preventDefault();
  const container = pageContainerRef.current; if (!container) return;
  const rect = container.getBoundingClientRect();
  const sig = placedSigs.find(s => s.id === id)!;
  const sigCx = ((sig.xPct + sig.wPct / 2) / 100) * rect.width + rect.left;
  const sigCy = ((sig.yPct + sig.hPct / 2) / 100) * rect.height + rect.top;
  const startAngle = Math.atan2(e.clientY - sigCy, e.clientX - sigCx) * (180 / Math.PI);
  setDragState({ type: "rotate", id, startX: e.clientX, startY: e.clientY, startSig: { ...sig }, startAngle });
};

  const onAreaMouseUp = useCallback(() => setDragState(null), []);

  const onSigTouchStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setActiveId(id);
    const sig = placedSigs.find((s) => s.id === id)!;
    setDragState({
      type: "move",
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      startSig: { ...sig },
    });
  };

  const onResizeTouchStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const sig = placedSigs.find((s) => s.id === id)!;
    setDragState({
      type: "resize",
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      startSig: { ...sig },
    });
  };

  const onRotateTouchStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sig = placedSigs.find((s) => s.id === id)!;
    const sigCx = ((sig.xPct + sig.wPct / 2) / 100) * rect.width + rect.left;
    const sigCy = ((sig.yPct + sig.hPct / 2) / 100) * rect.height + rect.top;
    const startAngle =
      Math.atan2(touch.clientY - sigCy, touch.clientX - sigCx) *
      (180 / Math.PI);
    setDragState({
      type: "rotate",
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      startSig: { ...sig },
      startAngle,
    });
  };

  const deletePlaced = (id: string) => {
    setPlacedSigs((p) => p.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const addSigner = () => {
    if (!newSignerName.trim()) return;
    const id = `s${Date.now()}`;
    setSigners((prev) => [
      ...prev,
      {
        id,
        name: newSignerName.trim(),
        color: SIGNER_COLORS[prev.length % SIGNER_COLORS.length],
      },
    ]);
    setActiveSigner(id);
    setNewSignerName("");
    setShowAddSigner(false);
  };

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
        const x = (sig.xPct / 100) * pw;
        const w = (sig.wPct / 100) * pw;
        const h = (sig.hPct / 100) * ph;
        const y = ph - (sig.yPct / 100) * ph - h;
        page.drawImage(embed, {
          x,
          y,
          width: w,
          height: h,
          opacity: 0.95,
          rotate: degrees(sig.rotation),
        });
      }
      const out = await doc.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(".pdf", "_signed.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setProcessing(false);
    }
  };

  const currentPageSigs = placedSigs.filter((s) => s.page === currentPage);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Dancing+Script:wght@600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sign-root { min-height:100vh; background:#0a0a0a; font-family:'DM Sans',sans-serif; color:#e0e0e0; display:flex; flex-direction:column; }
        .sign-bar { background:#0d0d0d; border-bottom:1px solid #1a1a1a; padding:0 20px; height:56px; display:flex; align-items:center; justify-content:space-between; gap:12px; position:sticky; top:0; z-index:100; flex-shrink:0; }
        .sign-bar-title { font-family:'DM Serif Display',serif; font-size:1rem; color:#f0f0f0; white-space:nowrap; }
        .sign-bar-title span { color:#F59E0B; font-style:italic; }
        .sign-bar-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; font-size:0.8rem; font-weight:600; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap; }
        .btn-ghost { background:transparent; border:1px solid #222; color:#666; }
        .btn-ghost:hover { background:#161616; color:#ccc; border-color:#333; }
        .btn-amber { background:#F59E0B; color:#0a0a0a; }
        .btn-amber:hover { opacity:0.88; }
        .btn-amber:disabled { opacity:0.35; cursor:not-allowed; }
        .btn-sm { padding:5px 10px; font-size:0.75rem; }
        .upload-zone { flex:1; display:flex; align-items:center; justify-content:center; padding:40px 20px; }
        .upload-card { width:100%; max-width:500px; border:2px dashed #1e1e1e; border-radius:20px; padding:56px 32px; text-align:center; cursor:pointer; transition:all 0.2s; background:#0f0f0f; }
        .upload-card:hover { border-color:rgba(245,158,11,0.4); background:#111; }
        .upload-icon { width:60px; height:60px; border-radius:18px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; color:#F59E0B; }
        .upload-title { font-family:'DM Serif Display',serif; font-size:1.6rem; color:#f0f0f0; margin-bottom:8px; }
        .upload-sub { font-size:0.85rem; color:#555; line-height:1.6; }
        .sign-layout { flex:1; display:flex; overflow:hidden; min-height:0; }
        .sign-panel { width:300px; flex-shrink:0; background:#0d0d0d; border-right:1px solid #1a1a1a; display:flex; flex-direction:column; overflow:hidden; }
        .panel-tabs { display:flex; border-bottom:1px solid #141414; flex-shrink:0; }
        .panel-tab { flex:1; padding:11px 6px; background:transparent; border:none; color:#444; font-size:0.72rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; text-transform:uppercase; letter-spacing:0.08em; transition:all 0.15s; border-bottom:2px solid transparent; }
        .panel-tab.active { color:#F59E0B; border-bottom-color:#F59E0B; }
        .panel-scroll { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px; }
        .signer-chip { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:10px; border:1px solid #1e1e1e; background:#111; cursor:pointer; transition:all 0.15s; }
        .signer-chip.active { border-color:rgba(245,158,11,0.4); background:#141000; }
        .signer-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .signer-name { font-size:0.82rem; font-weight:600; color:#888; flex:1; }
        .signer-chip.active .signer-name { color:#e0e0e0; }
        .sig-types { display:flex; gap:4px; background:#111; border-radius:10px; padding:3px; }
        .sig-type-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:8px; border:none; background:transparent; color:#555; font-size:0.68rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .sig-type-btn.active { background:#1a1a1a; color:#F59E0B; }
        .draw-wrap { border:1px solid #1e1e1e; border-radius:12px; overflow:hidden; background:#f8f8f5; position:relative; cursor:crosshair; }
        .draw-wrap canvas { display:block; width:100%; touch-action:none; }
        .draw-hint { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:0.78rem; color:#bbb; pointer-events:none; font-style:italic; }
        .text-input { width:100%; background:#111; border:1px solid #1e1e1e; border-radius:10px; padding:10px 14px; color:#e0e0e0; font-size:0.9rem; outline:none; font-family:'DM Sans',sans-serif; transition:border-color 0.15s; }
        .text-input:focus { border-color:rgba(245,158,11,0.4); }
        .font-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .font-btn { padding:8px 6px; border-radius:8px; border:1px solid #1e1e1e; background:#111; cursor:pointer; text-align:center; color:#777; font-size:0.75rem; transition:all 0.15s; }
        .font-btn.active { border-color:rgba(245,158,11,0.4); background:#161200; color:#F59E0B; }
        .sig-preview { background:#f8f8f5; border-radius:10px; border:1px solid #1e1e1e; height:80px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .sig-preview img { max-width:100%; max-height:100%; object-fit:contain; }
        .saved-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .saved-item { background:#f8f8f5; border-radius:10px; border:1px solid #1e1e1e; height:60px; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; overflow:hidden; transition:all 0.15s; }
        .saved-item:hover { border-color:rgba(245,158,11,0.4); }
        .saved-item img { max-width:90%; max-height:90%; object-fit:contain; }
        .saved-del { position:absolute; top:3px; right:3px; width:18px; height:18px; background:#ef4444; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0; transition:opacity 0.15s; border:none; }
        .saved-item:hover .saved-del { opacity:1; }
        .placed-item { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:10px; background:#111; border:1px solid #1e1e1e; cursor:pointer; transition:all 0.15s; }
        .placed-item.active { border-color:rgba(245,158,11,0.4); background:#141000; }
        .placed-thumb { width:44px; height:28px; object-fit:contain; background:#f8f8f5; border-radius:5px; padding:2px; flex-shrink:0; }
        .placed-info { flex:1; min-width:0; }
        .placed-label { font-size:0.75rem; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .placed-sub { font-size:0.68rem; color:#444; }
        .placed-del { width:24px; height:24px; border-radius:6px; background:transparent; border:none; color:#444; cursor:pointer; display:flex; align-items:center; justify-content:none; transition:all 0.15s; }
        .placed-del:hover { background:#1a0808; color:#ef4444; }
        .place-hint-box { background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.15); border-radius:10px; padding:12px; font-size:0.78rem; color:#a08040; line-height:1.6; }
        .place-hint-box strong { color:#F59E0B; }
        .panel-lbl { font-size:0.65rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#444; }

        /* Canvas area — mouse events captured here */
        .canvas-area { flex:1; overflow:auto; display:flex; flex-direction:column; align-items:center; background:#111; padding:24px 20px; gap:16px; }
        .page-controls { display:flex; align-items:center; gap:8px; background:#0d0d0d; border:1px solid #1a1a1a; border-radius:12px; padding:6px 12px; font-size:0.8rem; color:#555; position:sticky; top:0; z-index:10; flex-wrap:wrap; justify-content:center; }
        .ctrl-btn { width:28px; height:28px; border-radius:7px; background:transparent; border:1px solid #1e1e1e; color:#555; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; }
        .ctrl-btn:hover:not(:disabled) { background:#1a1a1a; color:#ccc; }
        .ctrl-btn:disabled { opacity:0.3; cursor:not-allowed; }
        .zoom-sep { width:1px; height:20px; background:#1e1e1e; margin:0 4px; }

        /* KEY FIX: overflow visible so handles show outside bounds */
        .page-wrap { position:relative; box-shadow:0 8px 48px rgba(0,0,0,0.7); border-radius:4px; overflow:visible !important; user-select:none; flex-shrink:0; }
        .page-wrap img { display:block; width:100%; pointer-events:none; border-radius:4px; }

.sig-ov { position:absolute; cursor:move; border:2px solid transparent; border-radius:4px; touch-action:none; }        .sig-ov:hover { border-color:rgba(245,158,11,0.5); }
        .sig-ov.active-ov { border-color:#F59E0B; }
        .sig-ov img { width:100%; height:100%; object-fit:contain; display:block; pointer-events:none; }

        /* Handles — larger hit targets */
        .sig-del-btn { position:absolute; top:-12px; right:-12px; width:22px; height:22px; background:#ef4444; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:2px solid #0a0a0a; color:white; z-index:10; }
        .sig-resize { position:absolute; bottom:-8px; right:-8px; width:18px; height:18px; background:#F59E0B; border-radius:4px; cursor:se-resize; border:2px solid #0a0a0a; z-index:10; touch-action:none; }
        .sig-rotate { position:absolute; top:-28px; left:50%; transform:translateX(-50%); width:22px; height:22px; background:#3B82F6; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:grab; border:2px solid #0a0a0a; color:white; z-index:10; touch-action:none;}
        .sig-rotate:active { cursor:grabbing; }
        .sig-rotate-line { position:absolute; top:-18px; left:50%; width:1px; height:10px; background:#3B82F644; }
        .sig-signer-badge { position:absolute; bottom:-20px; left:0; font-size:0.62rem; font-weight:700; white-space:nowrap; padding:2px 6px; border-radius:4px; pointer-events:none; }

        @media (max-width:768px) { .sign-panel { width:260px; } }
        @media (max-width:600px) {
          .sign-layout { flex-direction:column; overflow:visible; }
          .sign-panel { width:100%; border-right:none; border-bottom:1px solid #1a1a1a; max-height:55vh; }
          .canvas-area { padding:16px 12px; min-height:50vh; }
        }
      `}</style>

      <div className="sign-root">
        <div className="sign-bar">
          <span className="sign-bar-title">
            PDF<span>Master</span> — Sign
          </span>
          <div className="sign-bar-right">
            {pdfFile && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPdfFile(null);
                  setPageImages([]);
                  setPlacedSigs([]);
                  setStep("upload");
                  setCurrentSigDataUrl(null);
                }}
              >
                <RotateCcw size={12} /> New
              </button>
            )}
            <button
              className="btn btn-amber"
              disabled={placedSigs.length === 0 || processing}
              onClick={exportPDF}
            >
              <Download size={13} />
              {processing ? "Exporting…" : `Export (${placedSigs.length})`}
            </button>
          </div>
        </div>

        {step === "upload" && (
          <div className="upload-zone">
            <div
              className="upload-card"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <div className="upload-icon">
                <Upload size={26} />
              </div>
              <h2 className="upload-title">Drop your PDF here</h2>
              <p className="upload-sub">Click to browse · PDF only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {step === "work" && (
          <div className="sign-layout">
            <div className="sign-panel">
              <div className="panel-tabs">
                {(["create", "saved", "placed"] as const).map((t) => (
                  <button
                    key={t}
                    className={`panel-tab${tab === t ? " active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t === "create"
                      ? "Create"
                      : t === "saved"
                        ? "Saved"
                        : `Placed (${placedSigs.length})`}
                  </button>
                ))}
              </div>

              <div className="panel-scroll">
                {tab === "create" && (
                  <>
                    <div>
                      <p className="panel-lbl" style={{ marginBottom: "10px" }}>
                        Signers
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {signers.map((s) => (
                          <div
                            key={s.id}
                            className={`signer-chip${activeSigner === s.id ? " active" : ""}`}
                            onClick={() => setActiveSigner(s.id)}
                          >
                            <span
                              className="signer-dot"
                              style={{ background: s.color }}
                            />
                            <span className="signer-name">{s.name}</span>
                            {activeSigner === s.id && (
                              <Check size={12} style={{ color: "#F59E0B" }} />
                            )}
                          </div>
                        ))}
                        {showAddSigner ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <input
                              className="text-input"
                              style={{
                                flex: 1,
                                padding: "7px 10px",
                                fontSize: "0.82rem",
                              }}
                              placeholder="Name…"
                              value={newSignerName}
                              onChange={(e) => setNewSignerName(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && addSigner()
                              }
                              autoFocus
                            />
                            <button
                              className="btn btn-amber btn-sm"
                              onClick={addSigner}
                            >
                              <Check size={12} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setShowAddSigner(false)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ justifyContent: "center" }}
                            onClick={() => setShowAddSigner(true)}
                          >
                            <Plus size={12} /> Add Signer
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="panel-lbl" style={{ marginBottom: "10px" }}>
                        Signature Type
                      </p>
                      <div className="sig-types">
                        {(
                          [
                            { t: "draw", icon: <Pen size={14} />, lbl: "Draw" },
                            {
                              t: "type",
                              icon: <Type size={14} />,
                              lbl: "Type",
                            },
                            {
                              t: "image",
                              icon: <ImageIcon size={14} />,
                              lbl: "Image",
                            },
                            {
                              t: "stamp",
                              icon: <Stamp size={14} />,
                              lbl: "Stamp",
                            },
                          ] as {
                            t: SigType;
                            icon: React.ReactNode;
                            lbl: string;
                          }[]
                        ).map(({ t, icon, lbl }) => (
                          <button
                            key={t}
                            className={`sig-type-btn${sigType === t ? " active" : ""}`}
                            onClick={() => {
                              setSigType(t);
                              setCurrentSigDataUrl(null);
                            }}
                          >
                            {icon}
                            <span>{lbl}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {sigType === "draw" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div className="draw-wrap">
                          <canvas
                            ref={drawCanvasRef}
                            width={520}
                            height={200}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={endDraw}
                            onMouseLeave={endDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={endDraw}
                          />
                          <div className="draw-hint">Sign here</div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="btn btn-ghost"
                            style={{ flex: 1 }}
                            onClick={clearCanvas}
                          >
                            <Trash2 size={12} /> Clear
                          </button>
                          <button
                            className="btn btn-amber"
                            style={{ flex: 1 }}
                            onClick={confirmDraw}
                          >
                            <Check size={12} /> Use
                          </button>
                        </div>
                      </div>
                    )}

                    {sigType === "type" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <input
                          className="text-input"
                          placeholder="Your name…"
                          value={typedText}
                          onChange={(e) => setTypedText(e.target.value)}
                        />
                        <div className="font-grid">
                          {TYPED_FONTS.map((f, i) => (
                            <button
                              key={f.label}
                              className={`font-btn${typedFont === i ? " active" : ""}`}
                              onClick={() => setTypedFont(i)}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        {typedText && (
                          <div className="sig-preview">
                            <span
                              style={{
                                font: TYPED_FONTS[typedFont].css,
                                color: "#1a1a2e",
                              }}
                            >
                              {typedText}
                            </span>
                          </div>
                        )}
                        <button
                          className="btn btn-amber"
                          onClick={generateTyped}
                          disabled={!typedText.trim()}
                        >
                          <Check size={12} /> Use
                        </button>
                      </div>
                    )}

                    {(sigType === "image" || sigType === "stamp") && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <button
                          className="btn btn-ghost"
                          style={{ justifyContent: "center", padding: "18px" }}
                          onClick={() =>
                            (sigType === "stamp"
                              ? stampInputRef
                              : imgInputRef
                            ).current?.click()
                          }
                        >
                          <Upload size={14} />{" "}
                          {sigType === "stamp"
                            ? "Upload stamp / seal"
                            : "Upload signature image"}
                        </button>
                        <input
                          ref={imgInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageUpload}
                        />
                        <input
                          ref={stampInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageUpload}
                        />
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "#444",
                            textAlign: "center",
                          }}
                        >
                          PNG with transparent background works best
                        </p>
                      </div>
                    )}

                    {currentSigDataUrl && (
                      <div>
                        <p
                          className="panel-lbl"
                          style={{ marginBottom: "8px" }}
                        >
                          Ready to Place
                        </p>
                        <div className="sig-preview">
                          <img src={currentSigDataUrl} alt="sig" />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            marginTop: "8px",
                          }}
                        >
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ flex: 1 }}
                            onClick={() =>
                              saveSigToStorage(
                                currentSigDataUrl,
                                signers.find((s) => s.id === activeSigner)
                                  ?.name || "Signature",
                              )
                            }
                          >
                            <Save size={12} /> Save
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => setCurrentSigDataUrl(null)}
                          >
                            <X size={12} /> Clear
                          </button>
                        </div>
                        <div
                          className="place-hint-box"
                          style={{ marginTop: "10px" }}
                        >
                          <strong>Click</strong> PDF to place ·{" "}
                          <strong>Drag</strong> to move · <strong>🔵</strong>{" "}
                          rotate · <strong>🟡</strong> resize
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tab === "saved" && (
                  <>
                    <p className="panel-lbl">Saved Signatures</p>
                    {savedSigs.length === 0 ? (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#444",
                          textAlign: "center",
                          padding: "20px 0",
                        }}
                      >
                        No saved signatures yet.
                      </p>
                    ) : (
                      <div className="saved-grid">
                        {savedSigs.map((s) => (
                          <div
                            key={s.id}
                            className="saved-item"
                            onClick={() => {
                              setCurrentSigDataUrl(s.dataUrl);
                              setTab("create");
                            }}
                          >
                            <img src={s.dataUrl} alt="saved" />
                            <button
                              className="saved-del"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSavedSig(s.id);
                              }}
                            >
                              <X size={10} color="white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {tab === "placed" && (
                  <>
                    <p className="panel-lbl">Placed Signatures</p>
                    {placedSigs.length === 0 ? (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#444",
                          textAlign: "center",
                          padding: "20px 0",
                        }}
                      >
                        No signatures placed yet.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {placedSigs.map((sig, i) => {
                          const signer = signers.find(
                            (s) => s.id === sig.signerId,
                          );
                          return (
                            <div
                              key={sig.id}
                              className={`placed-item${activeId === sig.id ? " active" : ""}`}
                              onClick={() => {
                                setCurrentPage(sig.page);
                                setActiveId(sig.id);
                              }}
                            >
                              <img
                                src={sig.dataUrl}
                                className="placed-thumb"
                                alt=""
                              />
                              <div className="placed-info">
                                <p className="placed-label">
                                  {signer?.name || "Sig"} #{i + 1}
                                </p>
                                <p className="placed-sub">
                                  Page {sig.page + 1} ·{" "}
                                  {Math.round(sig.rotation)}°
                                </p>
                              </div>
                              <button
                                className="placed-del"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePlaced(sig.id);
                                }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Canvas area — catches all mouse events */}
            <div
              ref={canvasAreaRef}
              className="canvas-area"
              onMouseMove={onAreaMouseMove}
              onMouseUp={onAreaMouseUp}
              onMouseLeave={onAreaMouseUp}
              onTouchMove={onAreaTouchMove}
              onTouchEnd={onAreaTouchEnd}
            >
              <div className="page-controls">
                <button
                  className="ctrl-btn"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                <span>
                  Page {currentPage + 1} / {totalPages}
                </span>
                <button
                  className="ctrl-btn"
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </button>
                <span className="zoom-sep" />
                <button
                  className="ctrl-btn"
                  onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
                >
                  <ZoomOut size={13} />
                </button>
                <span
                  style={{
                    minWidth: "38px",
                    textAlign: "center",
                    fontSize: "0.75rem",
                  }}
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="ctrl-btn"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              {pageImages[currentPage] && (
                <div
                  ref={pageContainerRef}
                  className="page-wrap"
                  style={{ width: `${pageWidth * zoom}px` }}
                  onClick={currentSigDataUrl ? handlePageClick : undefined}
                >
                  <img
                    src={pageImages[currentPage]}
                    alt={`Page ${currentPage + 1}`}
                    draggable={false}
                  />

                  {currentPageSigs.map((sig) => {
                    const signer = signers.find((s) => s.id === sig.signerId);
                    const isActive = activeId === sig.id;
                    return (
                      <div
                        key={sig.id}
                        className={`sig-ov${isActive ? " active-ov" : ""}`}
                        style={{
                          left: `${sig.xPct}%`,
                          top: `${sig.yPct}%`,
                          width: `${sig.wPct}%`,
                          height: `${sig.hPct}%`,
                          transform: `rotate(${sig.rotation}deg)`,
                          transformOrigin: "center",
                          borderColor: isActive
                            ? signer?.color || "#F59E0B"
                            : "transparent",
                        }}
                        onMouseDown={(e) => onSigMouseDown(e, sig.id)}
                        onTouchStart={(e) => onSigTouchStart(e, sig.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(sig.id);
                        }}
                      >
                        <img src={sig.dataUrl} alt="sig" draggable={false} />
                        {isActive && (
                          <>
                            <div
                              className="sig-del-btn"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlaced(sig.id);
                              }}
                            >
                              <X size={10} />
                            </div>
                            <div
                              className="sig-resize"
                              onMouseDown={(e) => onResizeMouseDown(e, sig.id)}
                              onTouchStart={(e) =>
                                onResizeTouchStart(e, sig.id)
                              }
                            />
                            <div
                              className="sig-rotate"
                              onMouseDown={(e) => onRotateMouseDown(e, sig.id)}
                              onTouchStart={(e) =>
                                onRotateTouchStart(e, sig.id)
                              }
                            >
                              <RotateCw size={11} />
                            </div>
                          </>
                        )}
                        {signer && (
                          <div
                            className="sig-signer-badge"
                            style={{
                              background: `${signer.color}22`,
                              color: signer.color,
                            }}
                          >
                            {signer.name}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {currentSigDataUrl && currentPageSigs.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(245,158,11,0.07)",
                          border: "1px dashed rgba(245,158,11,0.3)",
                          borderRadius: "12px",
                          padding: "16px 24px",
                          color: "#a08040",
                          fontSize: "0.85rem",
                          fontStyle: "italic",
                        }}
                      >
                        Click to place signature
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
