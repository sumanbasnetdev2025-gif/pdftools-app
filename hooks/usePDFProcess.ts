import { useState, useCallback } from "react";

export type ProcessStatus = "idle" | "processing" | "done" | "error";

interface UsePDFProcessOptions {
  onSuccess?: (result: Blob | Uint8Array) => void;
  onError?: (error: string) => void;
}

export function usePDFProcess({ onSuccess, onError }: UsePDFProcessOptions = {}) {
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setErrorMessage(null);
    setResultBlob(null);
  }, []);

  // Run a client-side processing function
  const processClient = useCallback(
    async (fn: () => Promise<Uint8Array | Blob>) => {
      try {
        setStatus("processing");
        setProgress(10);
        setErrorMessage(null);

        const result = await fn();
        setProgress(90);

        const blob =
          result instanceof Blob
            ? result
            : new Blob([result], { type: "application/pdf" });

        setResultBlob(blob);
        setProgress(100);
        setStatus("done");
        onSuccess?.(result);
      } catch (err: any) {
        const msg = err?.message || "Something went wrong. Please try again.";
        setErrorMessage(msg);
        setStatus("error");
        onError?.(msg);
      }
    },
    [onSuccess, onError]
  );

  // Run a server-side API route processing
  const processServer = useCallback(
    async (apiRoute: string, formData: FormData) => {
      try {
        setStatus("processing");
        setProgress(20);
        setErrorMessage(null);

        const res = await fetch(apiRoute, {
          method: "POST",
          body: formData,
        });

        setProgress(70);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Server error" }));
          throw new Error(err.error || "Processing failed");
        }

        const blob = await res.blob();
        setResultBlob(blob);
        setProgress(100);
        setStatus("done");
        onSuccess?.(blob);
      } catch (err: any) {
        const msg = err?.message || "Server error. Please try again.";
        setErrorMessage(msg);
        setStatus("error");
        onError?.(msg);
      }
    },
    [onSuccess, onError]
  );

  return {
    status,
    progress,
    errorMessage,
    resultBlob,
    reset,
    processClient,
    processServer,
    isIdle: status === "idle",
    isProcessing: status === "processing",
    isDone: status === "done",
    isError: status === "error",
  };
}