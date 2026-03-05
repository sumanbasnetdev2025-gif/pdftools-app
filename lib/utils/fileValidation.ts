export const ACCEPTED_PDF = { "application/pdf": [".pdf"] };
export const ACCEPTED_IMAGES = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] };
export const ACCEPTED_WORD = { "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] };
export const ACCEPTED_EXCEL = { "application/vnd.ms-excel": [".xls"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] };
export const ACCEPTED_PPT = { "application/vnd.ms-powerpoint": [".ppt"], "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] };

export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePDF(file: File): ValidationResult {
  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return { valid: false, error: "Only PDF files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` };
  }
  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }
  return { valid: true };
}

export function validateImage(file: File): ValidationResult {
  const accepted = ["image/jpeg", "image/png", "image/webp"];
  if (!accepted.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, or WEBP images are accepted." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` };
  }
  return { valid: true };
}

export function validateWord(file: File): ValidationResult {
  const accepted = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!accepted.includes(file.type)) {
    return { valid: false, error: "Only DOC or DOCX files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` };
  }
  return { valid: true };
}

export function validateMultiplePDFs(files: File[], min = 2): ValidationResult {
  if (files.length < min) {
    return { valid: false, error: `Please upload at least ${min} PDF files.` };
  }
  for (const file of files) {
    const result = validatePDF(file);
    if (!result.valid) return result;
  }
  return { valid: true };
}

export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
}

export function isPDF(file: File): boolean {
  return file.type === "application/pdf" || file.name.endsWith(".pdf");
}

export function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}