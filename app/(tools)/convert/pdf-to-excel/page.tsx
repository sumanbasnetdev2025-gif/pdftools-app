"use client";
import { useState } from "react";
import { Info, Table } from "lucide-react";
import ToolHeader from "@/components/tools/ToolHeader";
import DropZone from "@/components/upload/DropZone";
import FileList from "@/components/upload/FileList";
import ProcessButton from "@/components/tools/ProcessButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileDownload } from "@/hooks/useFileDownload";
import { validatePDF } from "@/lib/utils/fileValidation";

export default function PDFToExcelPage() {
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
      setProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      setProgress(40);

      const res = await fetch("/api/convert/pdf-to-excel", {
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

      const filename = file.name.replace(/\.pdf$/i, ".xlsx");
      downloadBlob(blob, filename);
    } catch (err: any) {
      setError(err?.message || "Failed to convert PDF to Excel.");
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
          emoji="📈"
          title="PDF to Excel"
          description="Extract tables and data from PDFs straight into Excel spreadsheets."
          gradient="from-green-600 to-emerald-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF with tables or data"
                hint="Single PDF file · Max 100MB"
              />
              {hasFiles && <FileList files={files} onRemove={removeFile} />}

              {hasFiles && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl p-3">
                    <Table className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700 leading-relaxed">
                      Best results with PDFs that contain structured tables or tabular data.
                      Text-based PDFs work better than scanned documents.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600 leading-relaxed">
                      This conversion requires time for processing. If it doesn't work contact our team.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Extracting data to Excel..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">Converted to Excel!</p>
                <p className="text-gray-400 text-sm mt-1">Your XLSX file has been downloaded</p>
              </div>
              <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                Convert Another
              </button>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleConvert} label="Convert to Excel" processingLabel="Extracting..." />
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Tips for best results</h3>
          <ul className="space-y-2">
            {[
              "Use text-based PDFs rather than scanned images",
              "PDFs with clear table borders convert more accurately",
              "Multi-page PDFs will have each table on a separate sheet",
              "Review the Excel output and adjust formatting as needed",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-2" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}