"use client";
import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Camera, Upload, RotateCcw, X } from "lucide-react";
import ToolHeader from "@/components/tools/ToolHeader";
import ProcessButton from "@/components/tools/ProcessButton";
import DownloadButton from "@/components/shared/DownloadButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileDownload } from "@/hooks/useFileDownload";
import { ACCEPTED_IMAGES } from "@/lib/utils/fileValidation";

interface ScannedPage {
  id: string;
  dataUrl: string;
  file: File;
}

export default function ScanToPDFPage() {
  const { downloadBytes } = useFileDownload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [pageSize, setPageSize] = useState<"fit" | "a4">("a4");

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newPages: ScannedPage[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setPages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            dataUrl: e.target?.result as string,
            file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    setPages((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const moveDown = (i: number) => {
    setPages((prev) => {
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const handleConvert = async () => {
    if (pages.length === 0) {
      setError("Please add at least one image.");
      return;
    }
    setError(null);
    setIsDone(false);

    try {
      setIsProcessing(true);
      setProgress(10);

      const pdf = await PDFDocument.create();
      const a4 = { width: 595, height: 842 };

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const arrayBuffer = await page.file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        let image;
        if (page.file.type === "image/png") {
          image = await pdf.embedPng(uint8);
        } else {
          image = await pdf.embedJpg(uint8);
        }

        const imgDims = image.size();
        let pageW: number, pageH: number;

        if (pageSize === "a4") {
          pageW = a4.width;
          pageH = a4.height;
        } else {
          pageW = imgDims.width;
          pageH = imgDims.height;
        }

        const pdfPage = pdf.addPage([pageW, pageH]);
        const scale = Math.min(pageW / imgDims.width, pageH / imgDims.height, 1);
        const drawW = imgDims.width * scale;
        const drawH = imgDims.height * scale;

        pdfPage.drawImage(image, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH,
        });

        setProgress(10 + Math.round(((i + 1) / pages.length) * 85));
      }

      const bytes = await pdf.save();
      setResultBytes(bytes);
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to create PDF from scans.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    downloadBytes(resultBytes, `scanned_document_${Date.now()}.pdf`);
  };

  const handleReset = () => {
    setPages([]);
    setProgress(0);
    setIsDone(false);
    setError(null);
    setResultBytes(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="📷"
          title="Scan to PDF"
          description="Convert photos and scanned images into a PDF document. Supports multiple pages."
          gradient="from-indigo-500 to-blue-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              {/* Upload buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Camera (mobile) */}
                <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                  <Camera className="w-7 h-7 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">Use Camera</span>
                  <span className="text-xs text-gray-400">Mobile only</span>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(e) => addImages(e.target.files)}
                  />
                </label>

                {/* File upload */}
                <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                  <Upload className="w-7 h-7 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">Upload Images</span>
                  <span className="text-xs text-gray-400">JPG, PNG, WEBP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addImages(e.target.files)}
                  />
                </label>
              </div>

              {/* Page size option */}
              <div className="space-y-2">
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

              {/* Pages preview */}
              {pages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {pages.length} page{pages.length > 1 ? "s" : ""} added
                    </p>
                    <button
                      onClick={() => setPages([])}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                    {pages.map((page, i) => (
                      <div key={page.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-[3/4]">
                        <img
                          src={page.dataUrl}
                          alt={`Page ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Page number */}
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          {i + 1}
                        </div>
                        {/* Controls */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => removePage(page.id)}
                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveUp(i)}
                            disabled={i === 0}
                            className="w-5 h-5 bg-white/90 text-gray-600 rounded flex items-center justify-center text-xs disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveDown(i)}
                            disabled={i === pages.length - 1}
                            className="w-5 h-5 bg-white/90 text-gray-600 rounded flex items-center justify-center text-xs disabled:opacity-40"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Creating PDF from scans..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
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
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Scan More
                </button>
              </div>
            </div>
          )}

          {pages.length > 0 && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton
                onClick={handleConvert}
                label={`Create PDF from ${pages.length} scan${pages.length > 1 ? "s" : ""}`}
                processingLabel="Creating PDF..."
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}