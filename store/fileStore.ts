import { create } from "zustand";
import { UploadedFile, FileStatus } from "@/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface FileStore {
  files: UploadedFile[];

  // Actions
  addFiles: (newFiles: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateStatus: (id: string, status: FileStatus, error?: string) => void;
  setAllStatus: (status: FileStatus) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;

  // Computed
  hasFiles: () => boolean;
  isProcessing: () => boolean;
  allDone: () => boolean;
  hasErrors: () => boolean;
  totalSize: () => number;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],

  addFiles: (newFiles) => {
    const uploaded: UploadedFile[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      status: "idle",
    }));
    set((state) => ({ files: [...state.files, ...uploaded] }));
  },

  removeFile: (id) => {
    set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
  },

  clearFiles: () => set({ files: [] }),

  updateStatus: (id, status, error) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status, error } : f
      ),
    }));
  },

  setAllStatus: (status) => {
    set((state) => ({
      files: state.files.map((f) => ({ ...f, status })),
    }));
  },

  reorderFiles: (fromIndex, toIndex) => {
    set((state) => {
      const updated = [...state.files];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { files: updated };
    });
  },

  // Computed helpers
  hasFiles: () => get().files.length > 0,
  isProcessing: () => get().files.some((f) => f.status === "processing"),
  allDone: () =>
    get().files.length > 0 && get().files.every((f) => f.status === "done"),
  hasErrors: () => get().files.some((f) => f.status === "error"),
  totalSize: () => get().files.reduce((acc, f) => acc + f.file.size, 0),
}));