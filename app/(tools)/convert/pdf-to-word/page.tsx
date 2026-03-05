"use client";
import { useState } from "react";
import { FileText, Info } from "lucide-react";
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

export default function PDFToWordPage() {
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
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(10);

      // Send to API route for server-side conversion
      const formData = new FormData();
      formData.append("file", file);
      setProgress(30);

      const res = await fetch("/api/convert/pdf-to-word", {
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

      // Auto-download
      const filename = file.name.replace(/\.pdf$/i, ".docx");
      downloadBlob(blob, filename);
    } catch (err: any) {
      setError(err?.message || "Failed to convert PDF to Word.");
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
          emoji="📝"
          title="PDF to Word"
          description="Convert your PDF files into editable DOC and DOCX documents with high accuracy."
          gradient="from-blue-600 to-blue-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF to convert to Word"
                hint="Single PDF file · Max 100MB"
              />
              {hasFiles && <FileList files={files} onRemove={removeFile} />}

              {/* Info note */}
              {hasFiles && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Conversion preserves text, fonts, and basic layout. Complex formatting may vary.
                    Scanned PDFs require OCR for best results.
                  </p>
                </div>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Converting to Word..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">Converted to Word!</p>
                <p className="text-gray-400 text-sm mt-1">Your DOCX file has been downloaded</p>
              </div>
              <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                Convert Another
              </button>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleConvert} label="Convert to Word" processingLabel="Converting..." />
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "📄", title: "Preserves Layout", desc: "Keeps original formatting intact" },
            { icon: "🔤", title: "Editable Text", desc: "Fully editable DOCX output" },
            { icon: "⚡", title: "Fast Conversion", desc: "Results in seconds" },
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