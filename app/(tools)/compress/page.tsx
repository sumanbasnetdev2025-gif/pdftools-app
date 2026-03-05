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
import { formatBytes } from "@/lib/utils/formatBytes";
import { generateOutputFilename } from "@/lib/utils/fileDownload";

type Quality = "low" | "medium" | "high";

const qualityOptions: { value: Quality; label: string; desc: string; color: string }[] = [
  { value: "low", label: "Strong", desc: "Smaller file, lower quality", color: "text-red-500" },
  { value: "medium", label: "Balanced", desc: "Good balance of size and quality", color: "text-orange-500" },
  { value: "high", label: "Light", desc: "Larger file, best quality", color: "text-green-500" },
];

export default function CompressPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [compressedBytes, setCompressedBytes] = useState<Uint8Array | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  const handleCompress = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(10);
      setOriginalSize(file.size);

      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
      });

      setProgress(60);

      // Save with compression options based on quality
      const bytes = await pdf.save({
        useObjectStreams: quality !== "high",
        addDefaultPage: false,
        objectsPerTick: quality === "low" ? 50 : quality === "medium" ? 20 : 10,
      });

      setProgress(90);
      setCompressedBytes(bytes);
      setCompressedSize(bytes.length);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to compress PDF. Please try again.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!compressedBytes) return;
    const name = generateOutputFilename(files[0]?.file.name || "compressed", "compressed");
    downloadBytes(compressedBytes, name);
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setCompressedBytes(null);
    setOriginalSize(0);
    setCompressedSize(0);
  };

  const savedPercent =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="📦"
          title="Compress PDF"
          description="Reduce your PDF file size while keeping the best possible quality."
          gradient="from-green-500 to-teal-500"
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

                  {/* Quality selector */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Compression level</p>
                    <div className="grid grid-cols-3 gap-2">
                      {qualityOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setQuality(opt.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            quality === opt.value
                              ? "border-green-400 bg-green-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <p className={`text-sm font-semibold ${quality === opt.value ? opt.color : "text-gray-700"}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && (
            <UploadProgress progress={progress} label="Compressing PDF..." />
          )}

          {error && (
            <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleCompress} />
          )}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Compressed!</p>
                {/* Size comparison */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Original</p>
                    <p className="text-sm font-semibold text-gray-700">{formatBytes(originalSize)}</p>
                  </div>
                  <span className="text-gray-300 text-lg">→</span>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Compressed</p>
                    <p className="text-sm font-semibold text-green-600">{formatBytes(compressedSize)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Saved</p>
                    <p className="text-sm font-bold text-green-500">
                      {savedPercent > 0 ? `${savedPercent}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Compressed PDF" />
                <button
                  onClick={handleReset}
                  className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
                >
                  Compress Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleCompress} label="Compress PDF" processingLabel="Compressing..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}