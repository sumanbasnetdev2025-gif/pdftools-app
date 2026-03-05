"use client";
import { useState } from "react";
import type * as PdfjsLibType from "pdfjs-dist";

async function getPdfjs(): Promise<typeof PdfjsLibType> {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
  return lib;
}
import ToolHeader from "@/components/tools/ToolHeader";
import DropZone from "@/components/upload/DropZone";
import FileList from "@/components/upload/FileList";
import ProcessButton from "@/components/tools/ProcessButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { validatePDF } from "@/lib/utils/fileValidation";
import { downloadBlob } from "@/lib/utils/fileDownload";

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
type Quality = "low" | "medium" | "high";
const qualityMap: Record<Quality, number> = { low: 1, medium: 1.5, high: 2 };

export default function PDFToJPGPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [previews, setPreviews] = useState<string[]>([]);
  const [convertedBlobs, setConvertedBlobs] = useState<{ blob: Blob; name: string }[]>([]);

  const handleConvert = async () => {
    setError(null);
    setIsDone(false);
    setPreviews([]);
    if (!hasFiles) return;

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(10);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const scale = qualityMap[quality];
      const blobs: { blob: Blob; name: string }[] = [];
      const previewUrls: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await await (page.render as any)({ canvasContext: ctx, viewport }).promise;;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        previewUrls.push(dataUrl);

        const blob = await new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b!), "image/jpeg", 0.92)
        );

        const baseName = file.name.replace(/\.pdf$/i, "");
        blobs.push({ blob, name: `${baseName}_page${i}.jpg` });
        setProgress(10 + Math.round((i / totalPages) * 85));
      }

      setPreviews(previewUrls);
      setConvertedBlobs(blobs);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to convert PDF to JPG.");
      setAllStatus("error");
    }
  };

  const downloadAll = () => {
    convertedBlobs.forEach(({ blob, name }, i) => {
      setTimeout(() => downloadBlob(blob, name), i * 300);
    });
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setPreviews([]);
    setConvertedBlobs([]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🖼️"
          title="PDF to JPG"
          description="Convert each PDF page into a high-quality JPG image."
          gradient="from-yellow-500 to-orange-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF to convert to JPG"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Quality */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Image quality</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["low", "medium", "high"] as Quality[]).map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                            quality === q
                              ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Converting pages to JPG..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-lg">✅ Converted {previews.length} page{previews.length > 1 ? "s" : ""}!</p>
                <p className="text-gray-400 text-sm mt-1">Click any image to download individually</p>
              </div>

              {/* Image previews */}
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {previews.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => downloadBlob(convertedBlobs[i].blob, convertedBlobs[i].name)}
                    className="relative cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-yellow-400 group transition-all"
                  >
                    <img src={url} alt={`Page ${i + 1}`} className="w-full object-cover aspect-[3/4]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        ⬇ Download
                      </span>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={downloadAll}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md"
                >
                  ⬇ Download All JPGs
                </button>
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Convert Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleConvert} label="Convert to JPG" processingLabel="Converting..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}