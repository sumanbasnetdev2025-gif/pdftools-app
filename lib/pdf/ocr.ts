import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
export interface OCRResult {
  text: string;
  pageTexts: { page: number; text: string }[];
  isEmpty: boolean;
}

// Client-side text extraction (works for text-based PDFs)
export async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<OCRResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pageTexts: { page: number; text: string }[] = [];
  let fullText = "";

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ")
      .trim();

    pageTexts.push({ page: i, text: pageText });
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    onProgress?.(i, totalPages);
  }

  const isEmpty = fullText.replace(/--- Page \d+ ---/g, "").trim().length === 0;

  return { text: fullText, pageTexts, isEmpty };
}

// Server-side OCR fallback (for scanned PDFs)
export async function runServerOCR(
  file: File,
  language = "eng"
): Promise<OCRResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const res = await fetch("/api/ocr", { method: "POST", body: formData });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "OCR failed" }));
    throw new Error(err.error || "Server OCR failed");
  }

  const data = await res.json();
  const text = data.text || "";

  return {
    text,
    pageTexts: [{ page: 1, text }],
    isEmpty: text.trim().length === 0,
  };
}