import { PDFDocument } from "pdf-lib";

export type CompressionQuality = "low" | "medium" | "high";

export interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
}

export async function compressPDF(
  file: File,
  quality: CompressionQuality = "medium"
): Promise<CompressResult> {
  const originalSize = file.size;
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

  const bytes = await pdf.save({
    useObjectStreams: quality !== "high",
    addDefaultPage: false,
    objectsPerTick: quality === "low" ? 50 : quality === "medium" ? 20 : 10,
  });

  const compressedSize = bytes.length;
  const savedPercent =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return { bytes, originalSize, compressedSize, savedPercent };
}