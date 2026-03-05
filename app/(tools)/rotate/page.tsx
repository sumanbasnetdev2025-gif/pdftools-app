"use client";
import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
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
import { generateOutputFilename } from "@/lib/utils/fileDownload";

type RotateDeg = 90 | 180 | 270;

const rotateOptions: { value: RotateDeg; label: string; icon: string }[] = [
  { value: 90, label: "90° Clockwise", icon: "↻" },
  { value: 180, label: "180°", icon: "↕" },
  { value: 270, label: "90° Counter-clockwise", icon: "↺" },
];

export default function RotatePDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotateDeg, setRotateDeg] = useState<RotateDeg>(90);
  const [pageMode, setPageMode] = useState<"all" | "custom">("all");
  const [customPages, setCustomPages] = useState("");
  const [rotatedBytes, setRotatedBytes] = useState<Uint8Array | null>(null);

  const parseCustomPages = (input: string, total: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= Math.min(end, total); i++) pages.push(i - 1);
      } else {
        const p = Number(part);
        if (p >= 1 && p <= total) pages.push(p - 1);
      }
    }
    return [...new Set(pages)];
  };

  const handleRotate = async () => {
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
      const pdf = await PDFDocument.load(arrayBuffer);
      const totalPages = pdf.getPageCount();
      setProgress(40);

      const pageIndices =
        pageMode === "all"
          ? Array.from({ length: totalPages }, (_, i) => i)
          : parseCustomPages(customPages, totalPages);

      if (pageMode === "custom" && pageIndices.length === 0) {
        setError("No valid pages found. Example: 1, 3-5, 7");
        setAllStatus("error");
        return;
      }

      pageIndices.forEach((i) => {
        const page = pdf.getPage(i);
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + rotateDeg) % 360));
      });

      setProgress(80);
      const bytes = await pdf.save();
      setRotatedBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to rotate PDF. Please try again.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!rotatedBytes) return;
    downloadBytes(rotatedBytes, generateOutputFilename(files[0]?.file.name || "rotated", "rotated"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setRotatedBytes(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🔄"
          title="Rotate PDF"
          description="Rotate your PDF pages the way you need. Rotate all or specific pages."
          gradient="from-fuchsia-500 to-pink-500"
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
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Rotation angle */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Rotation angle</p>
                    <div className="grid grid-cols-3 gap-2">
                      {rotateOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setRotateDeg(opt.value)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            rotateDeg === opt.value
                              ? "border-fuchsia-400 bg-fuchsia-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className={`text-2xl block mb-1 ${rotateDeg === opt.value ? "text-fuchsia-500" : "text-gray-400"}`}>
                            {opt.icon}
                          </span>
                          <span className={`text-xs font-medium ${rotateDeg === opt.value ? "text-fuchsia-600" : "text-gray-600"}`}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page mode */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Pages to rotate</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["all", "custom"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPageMode(mode)}
                          className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            pageMode === mode
                              ? "border-fuchsia-400 bg-fuchsia-50 text-fuchsia-600"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {mode === "all" ? "All Pages" : "Custom Pages"}
                        </button>
                      ))}
                    </div>

                    {pageMode === "custom" && (
                      <input
                        type="text"
                        value={customPages}
                        onChange={(e) => setCustomPages(e.target.value)}
                        placeholder="e.g. 1, 3-5, 7"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                      />
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Rotating pages..." />}

          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleRotate} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Rotated Successfully!</p>
                <p className="text-gray-400 text-sm mt-1">Pages rotated by {rotateDeg}°</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Rotated PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Rotate Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleRotate} label="Rotate PDF" processingLabel="Rotating..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}