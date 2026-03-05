"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import ToolHeader from "@/components/tools/ToolHeader";
import DropZone from "@/components/upload/DropZone";
import FileList from "@/components/upload/FileList";
import ProcessButton from "@/components/tools/ProcessButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileDownload } from "@/hooks/useFileDownload";
import { ACCEPTED_PPT } from "@/lib/utils/fileValidation";

export default function PowerPointToPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBlob } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    const file = files[0].file;

    try {
      setAllStatus("processing");
      setProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      setProgress(45);

      const res = await fetch("/api/convert/powerpoint-to-pdf", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error || "Conversion failed");
      }

      const blob = await res.blob();
      setProgress(100);
      setAllStatus("done");
      setIsDone(true);

      const filename = file.name.replace(/\.(ppt|pptx)$/i, ".pdf");
      downloadBlob(blob, filename);
    } catch (err: any) {
      setError(err?.message || "Failed to convert PowerPoint to PDF.");
      setAllStatus("error");
    }
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🎯"
          title="PowerPoint to PDF"
          description="Convert PPT and PPTX presentations to PDF. Each slide becomes a PDF page."
          gradient="from-red-600 to-orange-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                accept={ACCEPTED_PPT}
                multiple={false}
                label="Upload a PowerPoint file to convert"
                hint="PPT or PPTX file · Max 100MB"
              />
              {hasFiles && <FileList files={files} onRemove={removeFile} />}

              {hasFiles && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3">
                  <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-relaxed">
                    Each slide will be converted to a PDF page. Animations and transitions are not preserved.
                  </p>
                </div>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Converting presentation..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">Presentation Converted!</p>
                <p className="text-gray-400 text-sm mt-1">Your PDF has been downloaded</p>
              </div>
              <button
                onClick={handleReset}
                className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Convert Another
              </button>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton
                onClick={handleConvert}
                label="Convert to PDF"
                processingLabel="Converting..."
              />
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "🖼️", title: "Slides Preserved", desc: "Every slide becomes a page" },
            { icon: "🎨", title: "Design Intact", desc: "Colors and fonts maintained" },
            { icon: "📦", title: "Easy Sharing", desc: "Share without PowerPoint" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
              <span className="text-2xl block mb-2">{f.icon}</span>
              <p className="text-xs font-semibold text-gray-700 mb-1">{f.title}</p>
              <p className="text-xs text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}