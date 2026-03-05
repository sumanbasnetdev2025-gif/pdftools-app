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
import { ACCEPTED_IMAGES } from "@/lib/utils/fileValidation";

type PageSize = "fit" | "a4" | "letter";
type Orientation = "portrait" | "landscape";

const pageSizes = {
  a4: { width: 595, height: 842 },
  letter: { width: 612, height: 792 },
};

export default function JPGToPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>("fit");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState(20);

  const handleConvert = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    try {
      setAllStatus("processing");
      setProgress(10);

      const pdf = await PDFDocument.create();
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const file = files[i].file;
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        let image;
        if (file.type === "image/png") {
          image = await pdf.embedPng(uint8);
        } else {
          image = await pdf.embedJpg(uint8);
        }

        const imgDims = image.size();

        let pageW: number, pageH: number;

        if (pageSize === "fit") {
          pageW = imgDims.width + margin * 2;
          pageH = imgDims.height + margin * 2;
        } else {
          const dims = pageSizes[pageSize];
          pageW = orientation === "portrait" ? dims.width : dims.height;
          pageH = orientation === "portrait" ? dims.height : dims.width;
        }

        const page = pdf.addPage([pageW, pageH]);

        // Scale image to fit within margins
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1);
        const drawW = imgDims.width * scale;
        const drawH = imgDims.height * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        page.drawImage(image, { x, y, width: drawW, height: drawH });
        setProgress(10 + Math.round(((i + 1) / total) * 85));
      }

      const bytes = await pdf.save();
      setResultBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to convert images to PDF.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    downloadBytes(resultBytes, "images_converted.pdf");
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setResultBytes(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🗃️"
          title="JPG to PDF"
          description="Convert JPG, PNG or WEBP images to PDF. Adjust page size and orientation."
          gradient="from-pink-500 to-rose-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={addFiles}
                accept={ACCEPTED_IMAGES}
                multiple={true}
                label="Upload images to convert to PDF"
                hint="JPG, PNG, WEBP supported · Multiple files allowed"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} showDrag />

                  {/* Page size */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Page size</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["fit", "a4", "letter"] as PageSize[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setPageSize(s)}
                          className={`py-2.5 rounded-xl border text-sm font-medium uppercase transition-all ${
                            pageSize === s
                              ? "border-pink-400 bg-pink-50 text-pink-600"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {s === "fit" ? "Fit Image" : s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orientation (only for fixed sizes) */}
                  {pageSize !== "fit" && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Orientation</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["portrait", "landscape"] as Orientation[]).map((o) => (
                          <button
                            key={o}
                            onClick={() => setOrientation(o)}
                            className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                              orientation === o
                                ? "border-pink-400 bg-pink-50 text-pink-600"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {o === "portrait" ? "📄 Portrait" : "📃 Landscape"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Margin */}
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">
                      Margin: {margin}px
                    </label>
                    <input
                      type="range" min={0} max={60} value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Creating PDF..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Created!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {files.length} image{files.length > 1 ? "s" : ""} converted into one PDF
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Convert More
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleConvert} label="Convert to PDF" processingLabel="Converting..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}