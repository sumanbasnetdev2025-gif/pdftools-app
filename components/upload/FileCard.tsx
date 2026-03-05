import { FileText, X, CheckCircle, Loader2 } from "lucide-react";

export type FileStatus = "idle" | "processing" | "done" | "error";

export interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

interface Props {
  uploadedFile: UploadedFile;
  onRemove: (id: string) => void;
  showDrag?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileCard({ uploadedFile, onRemove, showDrag = false }: Props) {
  const { id, file, status, error } = uploadedFile;

  return (
    <div className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm transition-all
      ${status === "error" ? "border-red-200 bg-red-50" : "border-gray-100 hover:border-gray-200"}
      ${showDrag ? "cursor-grab active:cursor-grabbing" : ""}
    `}>
      {/* Drag handle */}
      {showDrag && (
        <div className="flex flex-col gap-0.5 opacity-30 hover:opacity-60 shrink-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-3.5 h-0.5 bg-gray-400 rounded-full" />
          ))}
        </div>
      )}

      {/* File icon */}
      <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-red-500" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>

      {/* Status */}
      <div className="shrink-0">
        {status === "processing" && (
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
        )}
        {status === "done" && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        {(status === "idle" || status === "error") && (
          <button
            onClick={() => onRemove(id)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}