"use client";
import { useState } from "react";
import { ScanText, Copy, CheckCheck, Info } from "lucide-react";
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
import type * as PdfjsLibType from "pdfjs-dist";

// Dynamic import helper
async function getPdfjs(): Promise<typeof PdfjsLibType> {
  const lib = await import("pdfjs-dist");
  // Set worker source here inside the loader
  lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
  return lib;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
export default function OCRPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBlob } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState("eng");
  const [outputMode, setOutputMode] = useState<"text" | "searchable-pdf">("text");

  const languages = [
    { value: "eng", label: "English" },
    { value: "fra", label: "French" },
    { value: "deu", label: "German" },
    { value: "spa", label: "Spanish" },
    { value: "zho", label: "Chinese" },
    { value: "jpn", label: "Japanese" },
  ];

  const handleOCR = async () => {
    setError(null);
    setIsDone(false);
    setExtractedText("");
    if (!hasFiles) return;

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(10);

      // Extract text using pdf.js (works for text-based PDFs)
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      let fullText = "";

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        setProgress(10 + Math.round((i / totalPages) * 75));
      }

      if (!fullText.trim()) {
        // For scanned PDFs, send to server-side OCR
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        setProgress(60);

        const res = await fetch("/api/ocr", { method: "POST", body: formData });
        if (!res.ok) throw new Error("OCR failed on server");
        const data = await res.json();
        fullText = data.text || "No text could be extracted.";
      }

      setProgress(90);
      setExtractedText(fullText);

      if (outputMode === "searchable-pdf") {
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: (() => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("language", language);
            fd.append("output", "pdf");
            return fd;
          })(),
        });
        if (res.ok) {
          const blob = await res.blob();
          downloadBlob(blob, file.name.replace(".pdf", "_searchable.pdf"));
        }
      }

      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "OCR failed. The file may be a scanned image PDF requiring server-side OCR.");
      setAllStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    downloadBlob(blob, files[0]?.file.name.replace(".pdf", "_ocr.txt") || "ocr_result.txt");
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setExtractedText("");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🔍"
          title="OCR PDF"
          description="Extract text from scanned PDFs. Convert image-based PDFs to searchable text."
          gradient="from-cyan-500 to-blue-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a scanned or image-based PDF"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Language */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Document language</p>
                    <div className="grid grid-cols-3 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => setLanguage(lang.value)}
                          className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                            language === lang.value
                              ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output mode */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Output format</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: "text", label: "📄 Extract Text" },
                        { value: "searchable-pdf", label: "🔍 Searchable PDF" },
                      ] as const).map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setOutputMode(value)}
                          className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            outputMode === value
                              ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600 leading-relaxed">
                      Text-based PDFs are processed instantly in browser. Scanned image PDFs require
                      server-side OCR using Tesseract.js or a cloud OCR API.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Extracting text..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleOCR} />}

          {isDone && extractedText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ScanText className="w-4 h-4 text-cyan-500" />
                  Extracted Text
                </p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-cyan-600 transition-colors"
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy all"}
                </button>
              </div>

              <textarea
                readOnly
                value={extractedText}
                rows={12}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 bg-gray-50 resize-y focus:outline-none"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadText}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm"
                >
                  ⬇ Download as .txt
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                >
                  New File
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleOCR} label="Extract Text (OCR)" processingLabel="Running OCR..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}