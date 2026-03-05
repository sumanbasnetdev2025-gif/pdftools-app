import { useState, useCallback } from "react";
import { UploadedFile, FileStatus } from "@/components/upload/FileCard";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const addFiles = useCallback((newFiles: File[]) => {
    const uploaded: UploadedFile[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      status: "idle" as FileStatus,
    }));
    setFiles((prev) => [...prev, ...uploaded]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const updateStatus = useCallback((id: string, status: FileStatus, error?: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status, error } : f))
    );
  }, []);

  const setAllStatus = useCallback((status: FileStatus) => {
    setFiles((prev) => prev.map((f) => ({ ...f, status })));
  }, []);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const hasFiles = files.length > 0;
  const isProcessing = files.some((f) => f.status === "processing");
  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasErrors = files.some((f) => f.status === "error");

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    updateStatus,
    setAllStatus,
    reorderFiles,
    hasFiles,
    isProcessing,
    allDone,
    hasErrors,
  };
}