import { PDFDocument } from "pdf-lib";

export async function mergePDFs(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error("At least 2 PDF files are required to merge.");
  }

  const mergedPdf = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const arrayBuffer = await files[i].arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
    onProgress?.(i + 1, total);
  }

  return mergedPdf.save();
}

export function getMergedFilename(files: File[]): string {
  if (files.length === 0) return "merged.pdf";
  const base = files[0].name.replace(/\.pdf$/i, "");
  return `${base}_merged.pdf`;
}