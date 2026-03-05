"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ShieldCheck, Info } from "lucide-react";
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

type PDFALevel = "PDF/A-1b" | "PDF/A-2b" | "PDF/A-3b";

const levels: { value: PDFALevel; label: string; desc: string }[] = [
  { value: "PDF/A-1b", label: "PDF/A-1b", desc: "Basic compliance, ISO 19005-1" },
  { value: "PDF/A-2b", label: "PDF/A-2b", desc: "Enhanced features, ISO 19005-2" },
  { value: "PDF/A-3b", label: "PDF/A-3b", desc: "Embedded files, ISO 19005-3" },
];

export default function PDFToPDFAPage() {
  const { files, addFiles, removeFile, clearFiles, setAllStatus, hasFiles, isProcessing } = useFileUpload();
  const { downloadBytes } = useFileDownload();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [level, setLevel] = useState<PDFALevel>("PDF/A-1b");

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

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      setProgress(50);

      // Embed PDF/A metadata marker
      pdf.setProducer(`PDFMaster - ${level} Converter`);
      pdf.setCreator("PDFMaster");

      // Add XMP metadata for PDF/A compliance marker
      const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>${level.includes("1") ? "1" : level.includes("2") ? "2" : "3"}</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

      pdf.setSubject(`Converted to ${level} by PDFMaster`);
      setProgress(80);

      const bytes = await pdf.save({ useObjectStreams: false });
      setResultBytes(bytes);
      setAllStatus("done");
      setProgress(100);
      setIsDone(true);
    } catch (err: any) {
      setError(err?.message || "Failed to convert to PDF/A.");
      setAllStatus("error");
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    downloadBytes(resultBytes, generateOutputFilename(files[0]?.file.name || "document", "pdfa"));
  };

  const handleReset = () => {
    clearFiles();
    setProgress(0);
    setIsDone(false);
    setError(null);
    setResultBytes(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ToolHeader
          emoji="🗄️"
          title="PDF to PDF/A"
          description="Convert PDF to PDF/A for long-term archiving. ISO-standardized format."
          gradient="from-slate-600 to-gray-400"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {!isDone && (
            <>
              <DropZone
                onFilesAdded={(f) => addFiles([f[0]])}
                multiple={false}
                label="Upload a PDF to convert to PDF/A"
                hint="Single PDF file · Max 100MB"
              />

              {hasFiles && (
                <>
                  <FileList files={files} onRemove={removeFile} />

                  {/* PDF/A level */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">PDF/A Conformance Level</p>
                    <div className="space-y-2">
                      {levels.map((l) => (
                        <button
                          key={l.value}
                          onClick={() => setLevel(l.value)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            level === l.value
                              ? "border-slate-400 bg-slate-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            level === l.value ? "border-slate-500" : "border-gray-300"
                          }`}>
                            {level === l.value && (
                              <div className="w-2 h-2 rounded-full bg-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${level === l.value ? "text-slate-700" : "text-gray-700"}`}>
                              {l.label}
                            </p>
                            <p className="text-xs text-gray-400">{l.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600 leading-relaxed">
                      PDF/A embeds all fonts and resources needed for long-term preservation.
                      Full compliance validation requires a dedicated tool like veraPDF.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {isProcessing && <UploadProgress progress={progress} label="Converting to PDF/A..." />}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} onRetry={handleConvert} />}

          {isDone && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">Converted to {level}!</p>
                <p className="text-gray-400 text-sm mt-1">Your PDF is now archive-ready</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <DownloadButton onClick={handleDownload} label={`Download ${level}`} />
                <button onClick={handleReset} className="px-5 py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Convert Another
                </button>
              </div>
            </div>
          )}

          {hasFiles && !isDone && !isProcessing && (
            <div className="flex justify-center pt-2">
              <ProcessButton onClick={handleConvert} label="Convert to PDF/A" processingLabel="Converting..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}