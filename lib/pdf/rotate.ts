import { PDFDocument, degrees } from "pdf-lib";

export type RotationDegrees = 90 | 180 | 270;
export type PageMode = "all" | "custom";

export function parseCustomPages(input: string, total: number): number[] {
  const pages: number[] = [];
  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= Math.min(end, total); i++) {
        if (i >= 1) pages.push(i - 1);
      }
    } else {
      const p = Number(part);
      if (p >= 1 && p <= total) pages.push(p - 1);
    }
  }
  return [...new Set(pages)];
}

export async function rotatePDF(
  file: File,
  rotateDeg: RotationDegrees,
  pageMode: PageMode = "all",
  customPages = ""
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();

  const pageIndices =
    pageMode === "all"
      ? Array.from({ length: totalPages }, (_, i) => i)
      : parseCustomPages(customPages, totalPages);

  if (pageIndices.length === 0) {
    throw new Error("No valid pages to rotate.");
  }

  pageIndices.forEach((i) => {
    const page = pdf.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotateDeg) % 360));
  });

  return pdf.save();
}