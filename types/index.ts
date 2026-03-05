export type FileStatus = "idle" | "processing" | "done" | "error";
export type ProcessStatus = "idle" | "processing" | "done" | "error";
export type ToolCategory = "all" | "organize" | "optimize" | "convert" | "edit" | "security";

export interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

export interface ProcessResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export interface ToolPageProps {
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  acceptedFiles?: Record<string, string[]>;
  multiple?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface CompressOptions {
  quality: "low" | "medium" | "high";
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  color: string;
}

export interface RotateOptions {
  degrees: 90 | 180 | 270;
  pageRange: "all" | "custom";
  customPages?: number[];
}

export interface SplitOptions {
  mode: "range" | "every" | "extract";
  ranges?: string;
  everyN?: number;
  pages?: number[];
}

export interface ProtectOptions {
  password: string;
  confirmPassword: string;
  allowPrinting: boolean;
  allowCopying: boolean;
}

export interface PageNumberOptions {
  position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  startFrom: number;
  fontSize: number;
  prefix: string;
  suffix: string;
}