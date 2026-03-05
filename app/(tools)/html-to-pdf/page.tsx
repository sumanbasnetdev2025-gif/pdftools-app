"use client";
import { useState } from "react";
import { Globe, Link } from "lucide-react";
import ToolHeader from "@/components/tools/ToolHeader";
import ProcessButton from "@/components/tools/ProcessButton";
import DownloadButton from "@/components/shared/DownloadButton";
import ErrorAlert from "@/components/shared/ErrorAlert";
import UploadProgress from "@/components/upload/UploadProgress";
import { useFileDownload } from "@/hooks/useFileDownload";

type InputMode = "url" | "html";

export default function HTMLToPDFPage() {
  const { downloadBlob } = useFileDownload();
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const isValidUrl = (str: string) => {
    try { new URL(str); return true; } catch { return false; }
  };

  const handleConvert = async () => {
    setError(null);
    setIsDone(false);
    setResultBlob(null);

    if (mode === "url" && !url.trim()) {
      setError("Please enter a URL."); return;
    }
    if (mode === "url" && !isValidUrl(url.trim())) {
      setError("Please enter a valid URL including https://"); return;
    }
    if (mode === "html" && !htmlContent.trim()) {
      setError("Please enter some HTML content."); return;
    }

    try {
      setIsProcessing(true);
      setProgress(20);

      const formData = new FormData();
      formData.append("mode", mode);
      if (mode === "url") formData.append("url", url.trim());
      else formData.append("html", htmlContent);

      setProgress(40);

      const res = await fetch("/api/html-to-pdf", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(data.error || "Conversion failed");
      }

      const blob = await res.blob();
      setResultBlob(blob);
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to convert to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const name = mode === "url"
      ? `${new URL(url).hostname}_page.pdf`
      : "converted_page.pdf";
    downloadBlob(resultBlob, name);
  };

  const handleReset = () => {
    setUrl("");
    setHtmlContent("");
    setProgress(0);
    setIsDone(false);
    setError(null);
    setResultBlob(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🌐"
          title="HTML to PDF"
          description="Convert any webpage or HTML content to PDF. Paste a URL or raw HTML."
          gradient="from-violet-500 to-purple-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              {/* Mode tabs */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "url", label: "Website URL", icon: Globe },
                  { value: "html", label: "HTML Code", icon: Link },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMode(value)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      mode === value
                        ? "border-violet-400 bg-violet-50 text-violet-600"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* URL input */}
              {mode === "url" && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Make sure the URL is publicly accessible
                  </p>
                </div>
              )}

              {/* HTML input */}
              {mode === "html" && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">HTML Content</label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<!DOCTYPE html>&#10;<html>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                    rows={10}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y"
                  />
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
                <p className="font-semibold text-gray-800 text-lg">PDF Created!</p>
                <p className="text-gray-400 text-sm mt-1">
                  {mode === "url" ? url : "HTML content"} converted successfully
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label="Download PDF" />
                <button
                  onClick={handleReset}
                  className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                >
                  Convert Another
                </button>
              </div>
            </div>
          )}

          {!isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton
                onClick={handleConvert}
                disabled={mode === "url" ? !url.trim() : !htmlContent.trim()}
                label="Convert to PDF"
                processingLabel="Converting..."
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}