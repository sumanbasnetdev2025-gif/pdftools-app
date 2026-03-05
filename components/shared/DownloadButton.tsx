"use client";
import { Download, Loader2, CheckCircle } from "lucide-react";

interface Props {
  onClick: () => void;
  isDownloading?: boolean;
  isDone?: boolean;
  label?: string;
  doneLabel?: string;
  disabled?: boolean;
  className?: string;
}

export default function DownloadButton({
  onClick,
  isDownloading = false,
  isDone = false,
  label = "Download",
  doneLabel = "Downloaded!",
  disabled = false,
  className = "",
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isDownloading}
      className={`
        inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
        transition-all duration-200 shadow-md hover:shadow-lg active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${isDone
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
        }
        ${className}
      `}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Downloading...
        </>
      ) : isDone ? (
        <>
          <CheckCircle className="w-4 h-4" />
          {doneLabel}
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}