"use client";
import FileCard, { UploadedFile } from "./FileCard";

interface Props {
  files: UploadedFile[];
  onRemove: (id: string) => void;
  showDrag?: boolean;
}

export default function FileList({ files, onRemove, showDrag = false }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">
          {files.length} file{files.length > 1 ? "s" : ""} selected
        </p>
        <button
          onClick={() => files.forEach((f) => onRemove(f.id))}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Remove all
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {files.map((f) => (
          <FileCard key={f.id} uploadedFile={f} onRemove={onRemove} showDrag={showDrag} />
        ))}
      </div>
    </div>
  );
}