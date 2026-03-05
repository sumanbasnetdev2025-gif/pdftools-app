"use client";
import { AlertCircle, X, RefreshCw } from "lucide-react";

interface Props {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorAlert({ message, onDismiss, onRetry }: Props) {
  return (
    <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-700 mb-0.5">
            Something went wrong
          </p>
          <p className="text-sm text-red-600 leading-relaxed">{message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Try again
            </button>
          )}
        </div>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}