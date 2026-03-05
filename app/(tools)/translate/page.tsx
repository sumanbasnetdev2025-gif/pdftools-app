"use client";
import { useState } from "react";
import { Languages, ArrowRight, Info } from "lucide-react";
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

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
];

export default function TranslatePDFPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBlob } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [preserveLayout, setPreserveLayout] = useState(true);

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const handleTranslate = async () => {
    setError(null);
    setIsDone(false);
    if (!hasFiles) return;

    if (sourceLang === targetLang) {
      setError("Source and target languages must be different.");
      return;
    }

    const file = files[0].file;
    const validation = validatePDF(file);
    if (!validation.valid) { setError(validation.error!); return; }

    try {
      setAllStatus("processing");
      setProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sourceLang", sourceLang);
      formData.append("targetLang", targetLang);
      formData.append("preserveLayout", String(preserveLayout));
      setProgress(40);

      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Translation failed" }));
        throw new Error(data.error || "Translation failed");
      }

      const blob = await res.blob();
      setProgress(100);
      setAllStatus("done");
      setIsDone(true);

      const targetLabel = languages.find((l) => l.code === targetLang)?.label || targetLang;
      downloadBlob(blob, file.name.replace(".pdf", `_${targetLabel}.pdf`));
    } catch (err: any) {
      setError(err?.message || "Translation failed. Please check your API configuration.");
      setAllStatus("error");
    }
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
  };

  const sourceLabel = languages.find((l) => l.code === sourceLang);
  const targetLabel = languages.find((l) => l.code === targetLang);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🌍"
          title="Translate PDF"
          description="Translate your PDF into any language while keeping the original layout and fonts."
          gradient="from-teal-500 to-emerald-500"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF to translate"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* Language pair selector */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Translation direction</p>
                    <div className="flex items-center gap-3">
                      {/* Source */}
                      <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                      >
                        {languages.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.flag} {l.label}
                          </option>
                        ))}
                      </select>

                      {/* Swap button */}
                      <button
                        onClick={swapLanguages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-teal-50 hover:border-teal-300 text-gray-400 hover:text-teal-600 transition-all shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* Target */}
                      <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                      >
                        {languages.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.flag} {l.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preview */}
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2">
                        <span className="text-lg">{sourceLabel?.flag}</span>
                        <span className="text-sm font-semibold text-teal-700">{sourceLabel?.label}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                        <span className="text-lg">{targetLabel?.flag}</span>
                        <span className="text-sm font-semibold text-emerald-700">{targetLabel?.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preserve layout toggle */}
                  <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Preserve layout</p>
                      <p className="text-xs text-gray-400 mt-0.5">Keep original fonts, images and formatting</p>
                    </div>
                    <button
                      onClick={() => setPreserveLayout(!preserveLayout)}
                      className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
                        preserveLayout ? "bg-teal-500" : "bg-gray-300"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all duration-200 ${
                        preserveLayout ? "left-6" : "left-1"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-100 rounded-xl p-3">
                    <Languages className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-teal-700 leading-relaxed">
                      Translation uses AI to convert your PDF content. Requires a translation API
                      (DeepL, Google Translate, or OpenAI) to be configured in your environment.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-600 leading-relaxed space-y-1">
                      <p className="font-semibold">Setup required:</p>
                      <p>Add <code className="bg-blue-100 px-1 rounded">TRANSLATION_API_KEY</code> to your <code className="bg-blue-100 px-1 rounded">.env.local</code> and implement <code className="bg-blue-100 px-1 rounded">app/api/translate/route.ts</code></p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && (
            <UploadProgress
              progress={progress}
              label={`Translating to ${targetLabel?.label}...`}
            />
          )}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleTranslate} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">PDF Translated!</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-lg">{sourceLabel?.flag}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-lg">{targetLabel?.flag}</span>
                  <span className="text-sm text-gray-500 font-medium">{targetLabel?.label}</span>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Translate Another
              </button>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton
                onClick={handleTranslate}
                disabled={sourceLang === targetLang}
                label={`Translate to ${targetLabel?.label}`}
                processingLabel="Translating..."
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}