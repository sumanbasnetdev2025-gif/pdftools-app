"use client";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  onClick: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
  label?: string;
  processingLabel?: string;
  className?: string;
}

export default function ProcessButton({
  onClick,
  isProcessing = false,
  disabled = false,
  label = "Process",
  processingLabel = "Processing...",
  className = "",
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`
        inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white
        bg-linear-to-r from-red-500 to-rose-500
        hover:from-red-600 hover:to-rose-600
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 shadow-md hover:shadow-lg
        active:scale-95 disabled:active:scale-100
        ${className}
      `}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {processingLabel}
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}