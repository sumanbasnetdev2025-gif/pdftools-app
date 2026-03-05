"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ShieldCheck, AlertTriangle } from "lucide-react";
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
import { formatBytes } from "@/lib/utils/formatBytes";

export default function RepairPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repairedBytes, setRepairedBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const handleRepair = async () => {
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
      setProgress(35);

      // Load with forgiving options to handle corrupt files
      const pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: true,
      });

      setProgress(65);
      const count = pdf.getPageCount();
      setPageCount(count);

      // Re-save to clean up structure
      const bytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      setProgress(90);
      setRepairedBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(
        "Unable to repair this PDF. The file may be too severely corrupted or use unsupported encryption."
      );
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!repairedBytes) return;
    downloadBytes(repairedBytes, generateOutputFilename(files[0]?.file.name || "repaired", "repaired"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setRepairedBytes(null);
    setPageCount(0);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🔧"
          title="Repair PDF"
          description="Repair a damaged PDF and recover data from corrupt PDF files."
          gradient="from-teal-500 to-cyan-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a damaged or corrupt PDF"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Warning note */}
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      This tool attempts to recover readable content from corrupted PDFs.
                      Severely damaged files may not be fully recoverable.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Repairing PDF..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleRepair} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">🔧</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Repaired Successfully!</p>
                <div className="flex items-center justify-center gap-6 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Pages recovered</p>
                    <p className="text-sm font-bold text-teal-600">{pageCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Output size</p>
                    <p className="text-sm font-bold text-gray-700">
                      {repairedBytes ? formatBytes(repairedBytes.length) : "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Repaired PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Repair Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleRepair} label="Repair PDF" processingLabel="Repairing..." />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <h3 className="font-semibold text-gray-800 text-sm">What gets repaired?</h3>
          </div>
          <ul className="space-y-1.5">
            {[
              "Corrupted cross-reference tables",
              "Broken object streams",
              "Invalid or mismatched PDF structure",
              "Minor encoding and formatting issues",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}