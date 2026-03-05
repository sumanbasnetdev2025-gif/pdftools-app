"use client";
import { useState } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
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

type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const positions: { value: WatermarkPosition; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

export default function WatermarkPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watermarkedBytes, setWatermarkedBytes] = useState<Uint8Array | null>(null);

  // Watermark options
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30);
  const [color, setColor] = useState("#ff0000");
  const [position, setPosition] = useState<WatermarkPosition>("center");
  const [diagonal, setDiagonal] = useState(true);

  const getPosition = (width: number, height: number, textWidth: number) => {
    const padding = 40;
    switch (position) {
      case "top-left": return { x: padding, y: height - fontSize - padding };
      case "top-right": return { x: width - textWidth - padding, y: height - fontSize - padding };
      case "bottom-left": return { x: padding, y: padding };
      case "bottom-right": return { x: width - textWidth - padding, y: padding };
      default: return { x: (width - textWidth) / 2, y: (height - fontSize) / 2 };
    }
  };

  const handleWatermark = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;
    if (!text.trim()) { setError("Please enter watermark text."); return; }

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(15);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgb(color);
      setProgress(40);

      const pages = pdf.getPages();
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const { x, y } = getPosition(width, height, textWidth);

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: diagonal ? degrees(45) : degrees(0),
        });
      });

      setProgress(85);
      const bytes = await pdf.save();
      setWatermarkedBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to add watermark. Please try again.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!watermarkedBytes) return;
    downloadBytes(watermarkedBytes, generateOutputFilename(files[0]?.file.name || "watermarked", "watermarked"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setWatermarkedBytes(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="💧"
          title="Watermark PDF"
          description="Stamp a text watermark over your PDF. Choose typography, color and position."
          gradient="from-rose-500 to-red-500"
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

                  {/* Watermark text */}
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Watermark text</label>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>

                  {/* Font size + opacity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Font size: {fontSize}px</label>
                      <input
                        type="range" min={12} max={120} value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Opacity: {opacity}%</label>
                      <input
                        type="range" min={5} max={100} value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                  </div>

                  {/* Color + diagonal */}
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Color</label>
                      <input
                        type="color" value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox" id="diagonal" checked={diagonal}
                        onChange={(e) => setDiagonal(e.target.checked)}
                        className="w-4 h-4 accent-rose-500 cursor-pointer"
                      />
                      <label htmlFor="diagonal" className="text-sm text-gray-600 cursor-pointer">
                        Diagonal (45°)
                      </label>
                    </div>
                  </div>

                  {/* Position */}
                  {!diagonal && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Position</p>
                      <div className="grid grid-cols-3 gap-2">
                        {positions.map((pos) => (
                          <button
                            key={pos.value}
                            onClick={() => setPosition(pos.value)}
                            className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                              position === pos.value
                                ? "border-rose-400 bg-rose-50 text-rose-600"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Adding watermark..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleWatermark} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <p className="font-semibold text-gray-800 text-lg">Watermark Added!</p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Watermark Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleWatermark} label="Add Watermark" processingLabel="Adding..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}