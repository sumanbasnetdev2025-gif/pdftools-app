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
import { validateMultiplePDFs } from "@/lib/utils/fileValidation";
import { generateOutputFilename } from "@/lib/utils/fileDownload";

export default function MergePDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergedBytes, setMergedBytes] = useState<Uint8Array | null>(null);

  const handleMerge = async () => {
    setError(null);
    setIsDone(false);

    const rawFiles = files.map((f) => f.file);
    const validation = validateMultiplePDFs(rawFiles, 2);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    try {
      setAllStatus("processing");
      setProgress(10);

      const mergedPdf = await PDFDocument.create();
      const total = rawFiles.length;

      for (let i = 0; i < total; i++) {
        const arrayBuffer = await rawFiles[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
        setProgress(10 + Math.round(((i + 1) / total) * 75));
      }

      setProgress(90);
      const bytes = await mergedPdf.save();
      setMergedBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to merge PDFs. Please try again.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!mergedBytes) return;
    const name = generateOutputFilename(files[0]?.file.name || "merged", "merged");
    downloadBytes(mergedBytes, name);
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setMergedBytes(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🔀"
          title="Merge PDF"
          description="Combine multiple PDF files into one document. Drag to reorder before merging."
          gradient="from-red-500 to-orange-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {/* Drop zone */}
          {!isDone && (
            <DropZone
              onFilesAdded={addFiles}
              multiple={true}
              label="Click to upload or drag and drop PDFs"
              hint="Upload 2 or more PDF files · Max 100MB each"
            />
          )}

          {/* File list */}
          {hasFiles && !isDone && (
            <FileList files={files} onRemove={removeFile} showDrag={true} />
          )}

          {/* Progress */}
          {isProcessing && (
            <UploadProgress progress={progress} label="Merging PDFs..." />
          )}

          {/* Error */}
          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => setError(null)}
              onRetry={handleMerge}
            />
          )}

          {/* Success state */}
          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDFs Merged Successfully!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {files.length} files combined into one PDF
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Merged PDF" />
                <button
                  onClick={handleReset}
                  className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
                >
                  Merge More
                </button>
              </div>
            </div>
          )}

          {/* Action button */}
          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton
                onClick={handleMerge}
                disabled={files.length < 2}
                label="Merge PDFs"
                processingLabel="Merging..."
              />
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">How to merge PDFs</h3>
          <ol className="space-y-2">
            {[
              "Upload two or more PDF files using the upload area above.",
              "Drag the file cards to reorder them as needed.",
              "Click Merge PDFs and wait for processing to complete.",
              "Download your merged PDF file.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
                <span className="w-5 h-5 rounded-full bg-red-50 text-red-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}