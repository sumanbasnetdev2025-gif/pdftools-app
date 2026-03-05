"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import ToolHeader from "@/components/tools/ToolHeader";
import DropZone from "@/components/upload/DropZone";
import FileList from "@/components/upload/FileList";
import ProcessButton from "@/components/tools/ProcessButton";
import DownloadButton from "@/components/shared/DownloadButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileDownload } from "@/hooks/useFileDownload";
import { validatePDF } from "@/lib/utils/fileValidation";
import { downloadBlob } from "@/lib/utils/fileDownload";

type SplitMode = "all" | "range" | "every";

function parsePageRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (start >= 1 && end <= total && start <= end) {
        groups.push(
          Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i)
        );
      }
    } else {
      const page = Number(part);
      if (page >= 1 && page <= total) groups.push([page - 1]);
    }
  }
  return groups;
}

export default function SplitPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("all");
  const [rangeInput, setRangeInput] = useState("");
  const [everyN, setEveryN] = useState(1);
  const [splitCount, setSplitCount] = useState(0);

  const handleSplit = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(15);

      const arrayBuffer = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const totalPages = srcPdf.getPageCount();
      setProgress(35);

      let pageGroups: number[][] = [];

      if (splitMode === "all") {
        pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
      } else if (splitMode === "every") {
        for (let i = 0; i < totalPages; i += everyN) {
          pageGroups.push(
            Array.from({ length: Math.min(everyN, totalPages - i) }, (_, j) => i + j)
          );
        }
      } else if (splitMode === "range") {
        pageGroups = parsePageRanges(rangeInput, totalPages);
        if (pageGroups.length === 0) {
          setError("Invalid page range. Example: 1-3, 5, 7-9");
          setAllStatus("error");
          return;
        }
      }

      setProgress(50);

      for (let i = 0; i < pageGroups.length; i++) {
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(srcPdf, pageGroups[i]);
        pages.forEach((p) => newPdf.addPage(p));
        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const baseName = file.name.replace(".pdf", "");
        downloadBlob(blob, `${baseName}_part${i + 1}.pdf`);
        setProgress(50 + Math.round(((i + 1) / pageGroups.length) * 45));
        await new Promise((r) => setTimeout(r, 300));
      }

      setSplitCount(pageGroups.length);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to split PDF. Please try again.");
      setAllStatus("error");
    }
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setSplitCount(0);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="✂️"
          title="Split PDF"
          description="Separate one page or a whole set into independent PDF files."
          gradient="from-orange-500 to-yellow-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Click to upload or drag and drop a PDF"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <FileList files={files} onRemove={removeFile} />
              )}

              {/* Split mode selector */}
              {hasFiles && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Split mode</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["all", "range", "every"] as SplitMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSplitMode(mode)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                          splitMode === mode
                            ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        {mode === "all" && "Extract All Pages"}
                        {mode === "range" && "By Range"}
                        {mode === "every" && "Every N Pages"}
                      </button>
                    ))}
                  </div>

                  {/* Range input */}
                  {splitMode === "range" && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Page ranges (e.g. 1-3, 5, 7-9)
                      </label>
                      <input
                        type="text"
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder="1-3, 5, 7-9"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Every N pages */}
                  {splitMode === "every" && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Split every N pages
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={everyN}
                        onChange={(e) => setEveryN(Number(e.target.value))}
                        className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {isProcessing && (
            <UploadProgress progress={progress} label="Splitting PDF..." />
          )}

          {error && (
            <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleSplit} />
          )}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Split Successfully!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {splitCount} file{splitCount > 1 ? "s" : ""} downloaded to your device
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
              >
                Split Another PDF
              </button>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleSplit} label="Split PDF" processingLabel="Splitting..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}