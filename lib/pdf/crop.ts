import { PDFDocument } from "pdf-lib";

export type ApplyTo = "all" | "odd" | "even";

export interface CropMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export async function cropPDF(
  file: File,
  margins: CropMargins,
  applyTo: ApplyTo = "all"
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();

  pages.forEach((page, i) => {
    const pageNum = i + 1;
    const shouldApply =
      applyTo === "all" ||
      (applyTo === "odd" && pageNum % 2 !== 0) ||
      (applyTo === "even" && pageNum % 2 === 0);

    if (!shouldApply) return;

    const { width, height } = page.getSize();
    page.setCropBox(
      margins.left,
      margins.bottom,
      Math.max(10, width - margins.left - margins.right),
      Math.max(10, height - margins.top - margins.bottom)
    );
  });

  return pdf.save();
}

export function validateMargins(
  margins: CropMargins,
  pageWidth: number,
  pageHeight: number
): boolean {
  return (
    margins.left + margins.right < pageWidth - 10 &&
    margins.top + margins.bottom < pageHeight - 10
  );
}