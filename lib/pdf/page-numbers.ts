import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type NumberPosition =
  | "bottom-center" | "bottom-left" | "bottom-right"
  | "top-center" | "top-left" | "top-right";

export interface PageNumberOptions {
  position: NumberPosition;
  startFrom: number;
  fontSize: number;
  prefix: string;
  suffix: string;
  opacity?: number;
}

function getXY(
  position: NumberPosition,
  width: number,
  height: number,
  textWidth: number,
  margin = 30
): { x: number; y: number } {
  switch (position) {
    case "bottom-left":   return { x: margin, y: margin };
    case "bottom-right":  return { x: width - textWidth - margin, y: margin };
    case "bottom-center": return { x: (width - textWidth) / 2, y: margin };
    case "top-left":      return { x: margin, y: height - margin };
    case "top-right":     return { x: width - textWidth - margin, y: height - margin };
    case "top-center":    return { x: (width - textWidth) / 2, y: height - margin };
  }
}

export async function addPageNumbers(
  file: File,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const {
    position = "bottom-center",
    startFrom = 1,
    fontSize = 12,
    prefix = "",
    suffix = "",
    opacity = 0.85,
  } = options;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const text = `${prefix}${i + startFrom}${suffix}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const { x, y } = getXY(position, width, height, textWidth);

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
      opacity,
    });
  });

  return pdf.save();
}

export function previewPageNumber(
  startFrom: number,
  prefix: string,
  suffix: string,
  count = 3
): string {
  return Array.from(
    { length: count },
    (_, i) => `${prefix}${startFrom + i}${suffix}`
  ).join("  ·  ") + "  ...";
}