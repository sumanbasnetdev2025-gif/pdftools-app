"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Eye, EyeOff, LockOpen } from "lucide-react";
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

export default function UnlockPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockedBytes, setUnlockedBytes] = useState<Uint8Array | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(20);

      const arrayBuffer = await file.arrayBuffer();
      setProgress(40);

      // Try loading — with password if provided
      const pdf = await PDFDocument.load(arrayBuffer, {
        password: password || undefined,
        ignoreEncryption: true,
      });

      setProgress(75);
      const bytes = await pdf.save();
      setUnlockedBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      const msg = err?.message?.toLowerCase();
      if (msg?.includes("password") || msg?.includes("encrypt")) {
        setError("Incorrect password or the PDF is heavily encrypted. Try with the correct password.");
      } else {
        setError(err?.message || "Failed to unlock PDF. Please try again.");
      }
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!unlockedBytes) return;
    downloadBytes(unlockedBytes, generateOutputFilename(files[0]?.file.name || "unlocked", "unlocked"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setUnlockedBytes(null);
    setPassword("");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🔓"
          title="Unlock PDF"
          description="Remove PDF password protection and unlock your PDF for free use."
          gradient="from-green-600 to-teal-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Click to upload or drag and drop a PDF"
                hint="Password-protected PDF · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Password input */}
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">
                      PDF Password <span className="text-gray-400 font-normal">(if required)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter PDF password"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <LockOpen className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Only unlock PDFs you own or have permission to access. Unauthorized unlocking may be illegal.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Unlocking PDF..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleUnlock} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">🔓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Unlocked Successfully!</p>
                <p className="text-gray-400 text-sm mt-1">Password protection has been removed</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Unlocked PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Unlock Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleUnlock} label="Unlock PDF" processingLabel="Unlocking..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}