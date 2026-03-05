import { useCallback, useState } from "react";

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  // Download from a Blob (client-side processing result)
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Download from a URL (server-side API result)
  const downloadFromUrl = useCallback(async (url: string, filename: string) => {
    try {
      setIsDownloading(true);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [downloadBlob]);

  // Download raw bytes (e.g. from pdf-lib)
  const downloadBytes = useCallback((bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    downloadBlob(blob, filename);
  }, [downloadBlob]);

  return {
    downloadBlob,
    downloadFromUrl,
    downloadBytes,
    isDownloading,
  };
}