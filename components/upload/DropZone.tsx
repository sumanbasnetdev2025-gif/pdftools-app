"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

interface Props {
  onFilesAdded: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number; // bytes
  label?: string;
  hint?: string;
}

export default function DropZone({
  onFilesAdded,
  accept = { "application/pdf": [".pdf"] },
  multiple = true,
  maxSize = 100 * 1024 * 1024, // 100MB
  label = "Click to upload or drag and drop",
  hint = "PDF files supported up to 100MB",
}: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setError(null);
      if (rejected.length > 0) {
        const reason = rejected[0].errors[0];
        if (reason.code === "file-too-large") {
          setError(`File too large. Max size is ${maxSize / 1024 / 1024}MB.`);
        } else if (reason.code === "file-invalid-type") {
          setError("Invalid file type. Please upload a valid file.");
        } else {
          setError("File rejected. Please try again.");
        }
        return;
      }
      if (accepted.length > 0) {
        onFilesAdded(accepted);
      }
    },
    [onFilesAdded, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200
          ${isDragActive && !isDragReject ? "border-red-400 bg-red-50 scale-[1.01]" : ""}
          ${isDragReject ? "border-red-500 bg-red-50" : ""}
          ${!isDragActive ? "border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/50" : ""}
        `}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200
          ${isDragActive ? "bg-red-500 scale-110" : "bg-white shadow-md border border-gray-100"}`}>
          {isDragActive ? (
            <Upload className="w-7 h-7 text-white" />
          ) : (
            <FileText className="w-7 h-7 text-red-500" />
          )}
        </div>

        {/* Text */}
        {isDragActive && !isDragReject ? (
          <p className="text-red-500 font-semibold text-lg">Drop your files here!</p>
        ) : isDragReject ? (
          <p className="text-red-600 font-semibold text-lg">Invalid file type!</p>
        ) : (
          <>
            <p className="text-gray-700 font-semibold text-base mb-1">{label}</p>
            <p className="text-gray-400 text-sm">{hint}</p>
            <div className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
              <Upload className="w-4 h-4" />
              Select Files
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}