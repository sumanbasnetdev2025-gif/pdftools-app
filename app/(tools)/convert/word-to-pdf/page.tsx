"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import ToolHeader from "@/components/tools/ToolHeader";
import DropZone from "@/components/upload/DropZone";
import FileList from "@/components/upload/FileList";
import ProcessButton from "@/components/tools/ProcessButton";
import DownloadButton from "@/components/shared/DownloadButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileDownload } from "@/hooks/useFileDownload";
import { ACCEPTED_WORD, validateWord } from "@/lib/utils/fileValidation";

export default function WordToPDFPage() {
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
    const validation = validateWord(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      setProgress(40);

      const res = await fetch("/api/convert/word-to-pdf", {
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

      const filename = file.name.replace(/\.(doc|docx)$/i, ".pdf");
      downloadBlob(blob, filename);
    } catch (err: any) {
      setError(err?.message || "Failed to convert Word to PDF.");
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
          emoji="📄"
          title="Word to PDF"
          description="Convert DOC and DOCX files to PDF while preserving formatting and layout."
          gradient="from-indigo-600 to-blue-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                accept={ACCEPTED_WORD}
                multiple={false}
                label="Upload a Word document to convert"
                hint="DOC or DOCX file · Max 100MB"
              />
              {hasFiles && <FileList files={files} onRemove={removeFile} />}

              {hasFiles && (
                <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-600 leading-relaxed">
                    Conversion is handled server-side to preserve fonts, tables, and styles accurately.
                  </p>
                </div>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Converting to PDF..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">Converted to PDF!</p>
                <p className="text-gray-400 text-sm mt-1">Your PDF file has been downloaded</p>
              </div>
              <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                Convert Another
              </button>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleConvert} label="Convert to PDF" processingLabel="Converting..." />
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">How it works</h3>
          <ol className="space-y-2">
            {[
              "Upload your DOC or DOCX file.",
              "Our server converts it preserving all formatting.",
              "Download your ready-to-share PDF.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
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