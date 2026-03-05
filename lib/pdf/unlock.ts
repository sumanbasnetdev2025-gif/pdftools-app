import { PDFDocument } from "pdf-lib";

export interface UnlockResult {
  bytes: Uint8Array;
  wasEncrypted: boolean;
}

export async function unlockPDF(
  file: File,
  password = ""
): Promise<UnlockResult> {
  const arrayBuffer = await file.arrayBuffer();
  let wasEncrypted = false;

  let pdf: PDFDocument;

  try {
    // First try without password
    pdf = await PDFDocument.load(arrayBuffer);
  } catch {
    wasEncrypted = true;
    try {
      pdf = await PDFDocument.load(arrayBuffer, {
        password: password || undefined,
        ignoreEncryption: true,
      });
    } catch {
      throw new Error(
        "Incorrect password or unsupported encryption. Please provide the correct PDF password."
      );
    }
  }

  const bytes = await pdf.save();
  return { bytes, wasEncrypted };
}