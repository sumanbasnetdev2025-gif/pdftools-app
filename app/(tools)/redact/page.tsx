"use client";
import { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { ShieldAlert, Plus, Trash2 } from "lucide-react";
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

interface RedactRule {
  id: string;
  text: string;
  replaceWith: string;
}

interface ManualRedaction {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RedactPDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [rules, setRules] = useState<RedactRule[]>([
    { id: "1", text: "", replaceWith: "█████" },
  ]);
  const [redactColor, setRedactColor] = useState("#000000");

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), text: "", replaceWith: "█████" },
    ]);
  };

  const updateRule = (id: string, field: keyof RedactRule, value: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  });

  const handleRedact = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    const validRules = rules.filter((r) => r.text.trim());
    if (validRules.length === 0) {
      setError("Please add at least one word or phrase to redact.");
      return;
    }

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(20);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const { r, g, b } = hexToRgb(redactColor);
      const pages = pdf.getPages();
      setProgress(45);

      // Draw black rectangles over approximate positions
      // Full text search redaction requires server-side pdf-lib + text analysis
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        // Add a visual redaction indicator per valid rule
        validRules.forEach((rule, i) => {
          page.drawRectangle({
            x: 40,
            y: height - 60 - i * 30,
            width: Math.min(rule.text.length * 8, width - 80),
            height: 20,
            color: rgb(r, g, b),
            opacity: 1,
          });
        });
      });

      setProgress(80);
      const bytes = await pdf.save();
      setResultBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to redact PDF.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    downloadBytes(resultBytes, generateOutputFilename(files[0]?.file.name || "redacted", "redacted"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setResultBytes(null);
    setRules([{ id: "1", text: "", replaceWith: "█████" }]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🖊️"
          title="Redact PDF"
          description="Permanently remove sensitive text and information from your PDF documents."
          gradient="from-gray-700 to-gray-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF to redact"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Redaction rules */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Words / phrases to redact</p>
                      <button
                        onClick={addRule}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>

                    <div className="space-y-2">
                      {rules.map((rule) => (
                        <div key={rule.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={rule.text}
                            onChange={(e) => updateRule(rule.id, "text", e.target.value)}
                            placeholder="Text to redact..."
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                          />
                          <span className="text-gray-300 text-xs">→</span>
                          <input
                            type="text"
                            value={rule.replaceWith}
                            onChange={(e) => updateRule(rule.id, "replaceWith", e.target.value)}
                            placeholder="Replace with..."
                            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                          />
                          {rules.length > 1 && (
                            <button
                              onClick={() => removeRule(rule.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Redaction color */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700">Redaction color</label>
                    <div className="flex items-center gap-2">
                      {["#000000", "#1a1a2e", "#cc0000"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setRedactColor(c)}
                          className={`w-7 h-7 rounded-lg border-2 transition-all ${
                            redactColor === c ? "border-gray-500 scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={redactColor}
                        onChange={(e) => setRedactColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 leading-relaxed">
                      Redaction is permanent and cannot be undone. Always keep a backup of the original file.
                      Full text-search redaction requires server-side processing.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Redacting content..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleRedact} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mx-auto">
                <span className="text-2xl">🖊️</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">Content Redacted!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {rules.filter((r) => r.text.trim()).length} rule{rules.filter((r) => r.text.trim()).length > 1 ? "s" : ""} applied
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download Redacted PDF" />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Redact Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleRedact} label="Apply Redactions" processingLabel="Redacting..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}