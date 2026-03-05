"use client";
import { useState } from "react";
import type * as PdfjsLibType from "pdfjs-dist";

// Dynamic import helper
async function getPdfjs(): Promise<typeof PdfjsLibType> {
  const lib = await import("pdfjs-dist");
  // Set worker source here inside the loader
  lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
  return lib;
}

import ToolHeader from "@/components/tools/ToolHeader";
import DropZone from "@/components/upload/DropZone";
import ProcessButton from "@/components/tools/ProcessButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { validatePDF } from "@/lib/utils/fileValidation";
import { FileText, X } from "lucide-react";
import { formatBytes } from "@/lib/utils/formatBytes";

interface PDFSide {
  file: File;
  pages: string[]; // base64 preview per page
  pageCount: number;
}

export default function ComparePDFPage() {
  const [leftPDF, setLeftPDF] = useState<PDFSide | null>(null);
  const [rightPDF, setRightPDF] = useState<PDFSide | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay">("side-by-side");
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  const renderPDFPages = async (file: File): Promise<PDFSide> => {
    const pdfjsLib = await getPdfjs(); // Use the loader here
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const pages: string[] = [];

    for (let i = 1; i <= Math.min(pageCount, 10); i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(canvas.toDataURL("image/jpeg", 0.85));
    }

    return { file, pages, pageCount };
  };

  const handleCompare = async () => {
    if (!leftPDF?.file || !rightPDF?.file) {
      setError("Please upload both PDF files to compare.");
      return;
    }
    setError(null);
    setIsDone(false);

    try {
      setIsProcessing(true);
      setProgress(20);

      const [left, right] = await Promise.all([
        renderPDFPages(leftPDF.file),
        renderPDFPages(rightPDF.file),
      ]);

      setProgress(90);
      setLeftPDF(left);
      setRightPDF(right);
      setCurrentPage(0);
      setProgress(100);
      setIsDone(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to compare PDFs.");
      }
    } finally {
      setIsProcessing(false);
    }
  }; // Fixed missing closing brace here

  const handleFileLeft = async (files: File[]) => {
    const file = files[0];
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }
    setLeftPDF({ file, pages: [], pageCount: 0 });
    setIsDone(false);
  };

  const handleFileRight = async (files: File[]) => {
    const file = files[0];
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }
    setRightPDF({ file, pages: [], pageCount: 0 });
    setIsDone(false);
  };

  const maxPages = Math.max(leftPDF?.pages.length || 0, rightPDF?.pages.length || 0);

  const FileSlot = ({
    pdf,
    onAdd,
    onRemove,
    label,
  }: {
    pdf: PDFSide | null;
    onAdd: (f: File[]) => void;
    onRemove: () => void;
    label: string;
  }) => (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      {!pdf?.file ? (
        <DropZone
          onFilesAdded={onAdd}
          multiple={false}
          label="Upload PDF"
          hint="Click or drag"
        />
      ) : (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{pdf.file.name}</p>
            <p className="text-xs text-gray-400">{formatBytes(pdf.file.size)}</p>
          </div>
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="⚖️"
          title="Compare PDF"
          description="View two PDFs side by side and easily spot differences between versions."
          gradient="from-amber-500 to-yellow-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex gap-4">
            <FileSlot
              pdf={leftPDF}
              onAdd={handleFileLeft}
              onRemove={() => { setLeftPDF(null); setIsDone(false); }}
              label="Original PDF"
            />
            <div className="flex items-center justify-center pt-6">
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <span className="text-amber-500 font-bold text-sm">VS</span>
              </div>
            </div>
            <FileSlot
              pdf={rightPDF}
              onAdd={handleFileRight}
              onRemove={() => { setRightPDF(null); setIsDone(false); }}
              label="Modified PDF"
            />
          </div>

          {isProcessing && <UploadProgress progress={progress} label="Loading PDF pages..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleCompare} />}

          {!isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton
                onClick={handleCompare}
                disabled={!leftPDF?.file || !rightPDF?.file}
                label="Compare PDFs"
                processingLabel="Comparing..."
              />
            </div>
          )}

          {isDone && leftPDF && rightPDF && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  {(["side-by-side", "overlay"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        viewMode === m
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {m === "side-by-side" ? "Side by Side" : "Overlay"}
                    </button>
                  ))}
                </div>

                {viewMode === "overlay" && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Left</span>
                    <input
                      type="range" min={0} max={100} value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                      className="w-24 accent-amber-500"
                    />
                    <span>Right</span>
                  </div>
                )}

                {maxPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs"
                    >
                      ‹
                    </button>
                    <span className="text-xs text-gray-500 font-medium">
                      Page {currentPage + 1} of {maxPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(maxPages - 1, p + 1))}
                      disabled={currentPage === maxPages - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>

              {viewMode === "side-by-side" ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { side: leftPDF, label: "Original" },
                    { side: rightPDF, label: "Modified" },
                  ].map(({ side, label }) => (
                    <div key={label} className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 text-center">{label}</p>
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 aspect-[3/4] flex items-center justify-center">
                        {side.pages[currentPage] ? (
                          <image
                            src={side.pages[currentPage]}
                            alt={`${label} page ${currentPage + 1}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-gray-400 p-8">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs">Page not available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative aspect-[3/4]">
                    {rightPDF.pages[currentPage] && (
                      <image
                        src={rightPDF.pages[currentPage]}
                        alt="Modified"
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ opacity: overlayOpacity / 100 }}
                      />
                    )}
                    {leftPDF.pages[currentPage] && (
                      <image
                        src={leftPDF.pages[currentPage]}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ opacity: 1 - overlayOpacity / 100 }}
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: "Original", pdf: leftPDF },
                  { label: "Modified", pdf: rightPDF },
                ].map(({ label, pdf }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-700 truncate">{pdf.file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pdf.pageCount} pages · {formatBytes(pdf.file.size)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-1">
                <button
                  onClick={() => { setLeftPDF(null); setRightPDF(null); setIsDone(false); }}
                  className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                >
                  Compare New Files
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}