// PDF to Word conversion must happen server-side.
// This file provides client-side helpers and the fetch wrapper.

export interface PDFToWordOptions {
  preserveFormatting?: boolean;
  ocrFallback?: boolean;
}

export async function convertPDFToWord(
  file: File,
  options: PDFToWordOptions = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("preserveFormatting", String(options.preserveFormatting ?? true));
  formData.append("ocrFallback", String(options.ocrFallback ?? false));

  const res = await fetch("/api/convert/pdf-to-word", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Conversion failed" }));
    throw new Error(error.error || "PDF to Word conversion failed");
  }

  return res.blob();
}

export function getWordFilename(pdfFilename: string): string {
  return pdfFilename.replace(/\.pdf$/i, ".docx");
}

// Text extraction fallback using pdfjs-dist (client-side)
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  return fullText;
}