"use client";
import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import ToolHeader from "@/components/tools/ToolHeader";
import DropZone from "@/components/upload/DropZone";
import ProcessButton from "@/components/tools/ProcessButton";
import DownloadButton from "@/components/shared/DownloadButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileDownload } from "@/hooks/useFileDownload";
import { validatePDF } from "@/lib/utils/fileValidation";
import { generateOutputFilename } from "@/lib/utils/fileDownload";

interface PageItem {
  index: number;
  label: string;
  selected: boolean;
}

export default function OrganizePDFPage() {
  const { files, addFiles, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizedBytes, setOrganizedBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!hasFiles) { setPages([]); setTotalPages(0); return; }
    const loadPages = async () => {
      try {
        const ab = await files[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(ab);
        const count = pdf.getPageCount();
        setTotalPages(count);
        setPages(
          Array.from({ length: count }, (_, i) => ({
            index: i,
            label: `Page ${i + 1}`,
            selected: true,
          }))
        );
      } catch { setError("Could not read PDF pages."); }
    };
    loadPages();
  }, [files, hasFiles]);

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
      if (i === prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const togglePage = (i: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleOrganize = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    const selectedPages = pages.filter((p) => p.selected);
    if (selectedPages.length === 0) {
      setError("Please select at least one page.");
      return;
    }

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(20);

      const arrayBuffer = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      setProgress(45);

      const indices = selectedPages.map((p) => p.index);
      const copied = await newPdf.copyPages(srcPdf, indices);
      copied.forEach((page) => newPdf.addPage(page));

      setProgress(85);
      const bytes = await newPdf.save();
      setOrganizedBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to organize PDF.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!organizedBytes) return;
    downloadBytes(organizedBytes, generateOutputFilename(files[0]?.file.name || "organized", "organized"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setOrganizedBytes(null);
    setPages([]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="📋"
          title="Organize PDF"
          description="Reorder, delete, or rearrange pages in your PDF document."
          gradient="from-yellow-500 to-lime-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              {!hasFiles && (
                <DropZone
                  onFilesAdded={(f) => addFiles([f[0]])}
                  multiple={false}
                  label="Upload a PDF to organize its pages"
                  hint="Single PDF file · Max 100MB"
                />
              )}

              {hasFiles && pages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {totalPages} pages · {pages.filter((p) => p.selected).length} selected
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPages((p) => p.map((pg) => ({ ...pg, selected: true })))}
                        className="text-xs text-sky-500 hover:text-sky-600 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        onClick={() => setPages((p) => p.map((pg) => ({ ...pg, selected: false })))}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {pages.map((page, i) => (
                      <div
                        key={`${page.index}-${i}`}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                          page.selected
                            ? "bg-white border-gray-200"
                            : "bg-gray-50 border-gray-100 opacity-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={page.selected}
                          onChange={() => togglePage(i)}
                          className="w-4 h-4 accent-yellow-500 cursor-pointer"
                        />

                        {/* Page thumbnail placeholder */}
                        <div className="w-8 h-10 rounded bg-gradient-to-br from-yellow-100 to-lime-100 border border-yellow-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-yellow-600">{i + 1}</span>
                        </div>

                        <span className="flex-1 text-sm text-gray-700 font-medium">{page.label}</span>

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveUp(i)}
                            disabled={i === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-all"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveDown(i)}
                            disabled={i === pages.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-all"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => togglePage(i)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Organizing pages..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleOrganize} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Organized!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {pages.filter((p) => p.selected).length} pages saved in your new order
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Organized PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Organize Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && pages.length > 0 && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleOrganize} label="Save Organized PDF" processingLabel="Organizing..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}