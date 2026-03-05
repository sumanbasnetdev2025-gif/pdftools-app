// Word to PDF conversion must happen server-side via LibreOffice or external API.
// This file provides the client-side fetch wrapper and helpers.

export interface WordToPDFOptions {
  quality?: "standard" | "high";
}

export async function convertWordToPDF(
  file: File,
  options: WordToPDFOptions = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("quality", options.quality ?? "standard");

  const res = await fetch("/api/convert/word-to-pdf", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Conversion failed" }));
    throw new Error(error.error || "Word to PDF conversion failed");
  }

  return res.blob();
}

export function getPDFFilename(wordFilename: string): string {
  return wordFilename.replace(/\.(doc|docx)$/i, ".pdf");
}

export function isWordFile(file: File): boolean {
  const validTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  return validTypes.includes(file.type) || /\.(doc|docx)$/i.test(file.name);
}