import { PDFDocument } from "pdf-lib";

export interface PageItem {
  index: number;
  label: string;
  selected: boolean;
}

export async function organizePDF(
  file: File,
  pageIndices: number[]
): Promise<Uint8Array> {
  if (pageIndices.length === 0) {
    throw new Error("At least one page must be selected.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const totalPages = srcPdf.getPageCount();

  const validIndices = pageIndices.filter((i) => i >= 0 && i < totalPages);
  if (validIndices.length === 0) {
    throw new Error("No valid page indices provided.");
  }

  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(srcPdf, validIndices);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

export async function getPDFPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
}

export function buildPageItems(count: number): PageItem[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    label: `Page ${i + 1}`,
    selected: true,
  }));
}

export function reorderItems(
  items: PageItem[],
  fromIndex: number,
  toIndex: number
): PageItem[] {
  const updated = [...items];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated;
}