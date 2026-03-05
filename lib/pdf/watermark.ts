import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export type WatermarkPosition =
  | "center" | "top-left" | "top-right"
  | "bottom-left" | "bottom-right";

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number; // 0-100
  color: string; // hex
  position: WatermarkPosition;
  diagonal: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function getPosition(
  position: WatermarkPosition,
  width: number,
  height: number,
  textWidth: number,
  fontSize: number,
  padding = 40
): { x: number; y: number } {
  switch (position) {
    case "top-left":     return { x: padding, y: height - fontSize - padding };
    case "top-right":    return { x: width - textWidth - padding, y: height - fontSize - padding };
    case "bottom-left":  return { x: padding, y: padding };
    case "bottom-right": return { x: width - textWidth - padding, y: padding };
    default:             return { x: (width - textWidth) / 2, y: (height - fontSize) / 2 };
  }
}

export async function addWatermark(
  file: File,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const {
    text,
    fontSize,
    opacity,
    color,
    position,
    diagonal,
  } = options;

  if (!text.trim()) throw new Error("Watermark text cannot be empty.");

  const { r, g, b } = hexToRgb(color);
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const { x, y } = getPosition(position, width, height, textWidth, fontSize);

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity: opacity / 100,
      rotate: diagonal ? degrees(45) : degrees(0),
    });
  });

  return pdf.save();
}