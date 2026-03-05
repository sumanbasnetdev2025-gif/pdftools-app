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
import { generateOutputFilename } from "@/lib/utils/fileDownload";

export default function CropPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  // Margins in points (1 pt = 1/72 inch)
  const [margins, setMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [applyTo, setApplyTo] = useState<"all" | "odd" | "even">("all");

  const updateMargin = (side: keyof typeof margins, value: number) => {
    setMargins((prev) => ({ ...prev, [side]: Math.max(0, value) }));
  };

  const handleCrop = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    const totalMargin = margins.top + margins.bottom + margins.left + margins.right;
    if (totalMargin === 0) {
      setError("Please set at least one margin to crop.");
      return;
    }

    try {
      setAllStatus("processing");
      setProgress(20);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();
      setProgress(45);

      pages.forEach((page, i) => {
        const pageNum = i + 1;
        const shouldApply =
          applyTo === "all" ||
          (applyTo === "odd" && pageNum % 2 !== 0) ||
          (applyTo === "even" && pageNum % 2 === 0);

        if (!shouldApply) return;

        const { width, height } = page.getSize();
        const cropBox = {
          x: margins.left,
          y: margins.bottom,
          width: Math.max(10, width - margins.left - margins.right),
          height: Math.max(10, height - margins.top - margins.bottom),
        };
        page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      });

      setProgress(80);
      const bytes = await pdf.save();
      setResultBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to crop PDF.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    downloadBytes(resultBytes, generateOutputFilename(files[0]?.file.name || "cropped", "cropped"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setResultBytes(null);
    setMargins({ top: 0, right: 0, bottom: 0, left: 0 });
  };

  const MarginInput = ({ side, label }: { side: keyof typeof margins; label: string }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={300}
          value={margins[side]}
          onChange={(e) => updateMargin(side, Number(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-300"
        />
        <span className="text-xs text-gray-400 shrink-0">pt</span>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🔲"
          title="Crop PDF"
          description="Crop the margins of your PDF pages. Set custom margins for all or specific pages."
          gradient="from-lime-500 to-green-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF to crop"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Visual margin editor */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Crop margins (points)</p>

                    {/* Top margin */}
                    <div className="max-w-xs mx-auto">
                      <MarginInput side="top" label="Top" />
                    </div>

                    {/* Left / Right */}
                    <div className="grid grid-cols-2 gap-3">
                      <MarginInput side="left" label="Left" />
                      <MarginInput side="right" label="Right" />
                    </div>

                    {/* Bottom */}
                    <div className="max-w-xs mx-auto">
                      <MarginInput side="bottom" label="Bottom" />
                    </div>
                  </div>

                  {/* Visual preview box */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center mb-3">Crop preview</p>
                    <div className="relative w-32 h-44 mx-auto border-2 border-gray-300 rounded bg-white">
                      <div
                        className="absolute bg-lime-100 border border-lime-400 border-dashed rounded"
                        style={{
                          top: `${Math.min((margins.top / 200) * 100, 45)}%`,
                          left: `${Math.min((margins.left / 200) * 100, 45)}%`,
                          right: `${Math.min((margins.right / 200) * 100, 45)}%`,
                          bottom: `${Math.min((margins.bottom / 200) * 100, 45)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">Green area = kept content</p>
                  </div>

                  {/* Apply to */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Apply to pages</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["all", "odd", "even"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setApplyTo(opt)}
                          className={`py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                            applyTo === opt
                              ? "border-lime-400 bg-lime-50 text-lime-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {opt === "all" ? "All Pages" : opt === "odd" ? "Odd Pages" : "Even Pages"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Cropping pages..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleCrop} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Cropped!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Margins: T{margins.top} R{margins.right} B{margins.bottom} L{margins.left} pt
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Cropped PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Crop Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleCrop} label="Crop PDF" processingLabel="Cropping..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}