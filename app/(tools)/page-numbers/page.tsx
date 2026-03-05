"use client";
import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

type Position =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

const positions: { value: Position; label: string }[] = [
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "top-center", label: "Top Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
];

export default function PageNumbersPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numberedBytes, setNumberedBytes] = useState<Uint8Array | null>(null);

  const [position, setPosition] = useState<Position>("bottom-center");
  const [startFrom, setStartFrom] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");

  const getXY = (pos: Position, width: number, height: number, textWidth: number) => {
    const margin = 30;
    const topY = height - margin;
    const bottomY = margin;
    switch (pos) {
      case "bottom-left":   return { x: margin, y: bottomY };
      case "bottom-right":  return { x: width - textWidth - margin, y: bottomY };
      case "bottom-center": return { x: (width - textWidth) / 2, y: bottomY };
      case "top-left":      return { x: margin, y: topY };
      case "top-right":     return { x: width - textWidth - margin, y: topY };
      case "top-center":    return { x: (width - textWidth) / 2, y: topY };
    }
  };

  const handleAddNumbers = async () => {
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
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      setProgress(40);

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const pageNum = i + startFrom;
        const text = `${prefix}${pageNum}${suffix}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const { x, y } = getXY(position, width, height, textWidth);

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
          opacity: 0.8,
        });
      });

      setProgress(85);
      const bytes = await pdf.save();
      setNumberedBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to add page numbers.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!numberedBytes) return;
    downloadBytes(numberedBytes, generateOutputFilename(files[0]?.file.name || "numbered", "numbered"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setNumberedBytes(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🔢"
          title="Page Numbers"
          description="Add page numbers to your PDF. Choose position, size, and format."
          gradient="from-blue-500 to-indigo-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF to add page numbers"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Position grid */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Position</p>
                    <div className="grid grid-cols-3 gap-2">
                      {positions.map((pos) => (
                        <button
                          key={pos.value}
                          onClick={() => setPosition(pos.value)}
                          className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                            position === pos.value
                              ? "border-blue-400 bg-blue-50 text-blue-600"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Start from</label>
                      <input
                        type="number" min={1} value={startFrom}
                        onChange={(e) => setStartFrom(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Font size</label>
                      <input
                        type="number" min={8} max={24} value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Prefix (optional)</label>
                      <input
                        type="text" value={prefix} placeholder="e.g. Page "
                        onChange={(e) => setPrefix(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Suffix (optional)</label>
                      <input
                        type="text" value={suffix} placeholder="e.g.  of 10"
                        onChange={(e) => setSuffix(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-500 font-medium mb-1">Preview</p>
                    <p className="text-sm font-semibold text-blue-700">
                      {prefix}{startFrom}{suffix}  ·  {prefix}{startFrom + 1}{suffix}  ·  {prefix}{startFrom + 2}{suffix}  ...
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Adding page numbers..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleAddNumbers} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">Page Numbers Added!</p>
                <p className="text-gray-400 text-sm mt-1">Numbers added at {position.replace("-", " ")}</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Number Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleAddNumbers} label="Add Page Numbers" processingLabel="Adding..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}