import { PDFDocument } from "pdf-lib";

export type SplitMode = "all" | "range" | "every";

export interface SplitResult {
  blob: Blob;
  filename: string;
  pageCount: number;
}

export function parsePageRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (start >= 1 && end <= total && start <= end) {
        groups.push(
          Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i)
        );
      }
    } else {
      const page = Number(part);
      if (page >= 1 && page <= total) groups.push([page - 1]);
    }
  }
  return groups;
}

export function buildPageGroups(
  mode: SplitMode,
  totalPages: number,
  rangeInput = "",
  everyN = 1
): number[][] {
  if (mode === "all") {
    return Array.from({ length: totalPages }, (_, i) => [i]);
  }
  if (mode === "every") {
    const groups: number[][] = [];
    for (let i = 0; i < totalPages; i += everyN) {
      groups.push(
        Array.from({ length: Math.min(everyN, totalPages - i) }, (_, j) => i + j)
      );
    }
    return groups;
  }
  if (mode === "range") {
    return parsePageRanges(rangeInput, totalPages);
  }
  return [];
}

export async function splitPDF(
  file: File,
  mode: SplitMode,
  rangeInput = "",
  everyN = 1,
  onProgress?: (current: number, total: number) => void
): Promise<SplitResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const totalPages = srcPdf.getPageCount();

  const pageGroups = buildPageGroups(mode, totalPages, rangeInput, everyN);

  if (pageGroups.length === 0) {
    throw new Error("No valid page groups found. Check your range input.");
  }

  const results: SplitResult[] = [];
  const baseName = file.name.replace(/\.pdf$/i, "");

  for (let i = 0; i < pageGroups.length; i++) {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(srcPdf, pageGroups[i]);
    pages.forEach((p) => newPdf.addPage(p));
    const bytes = await newPdf.save();
    const blob = new Blob([bytes], { type: "application/pdf" });

    results.push({
      blob,
      filename: `${baseName}_part${i + 1}.pdf`,
      pageCount: pageGroups[i].length,
    });

    onProgress?.(i + 1, pageGroups.length);
    await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}