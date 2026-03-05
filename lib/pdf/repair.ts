import { PDFDocument } from "pdf-lib";

export interface RepairResult {
  bytes: Uint8Array;
  pageCount: number;
  wasCorrupted: boolean;
  outputSize: number;
}

export async function repairPDF(file: File): Promise<RepairResult> {
  const arrayBuffer = await file.arrayBuffer();
  let pdf: PDFDocument;
  let wasCorrupted = false;

  try {
    pdf = await PDFDocument.load(arrayBuffer);
  } catch {
    wasCorrupted = true;
    try {
      pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: true,
      });
    } catch {
      // Last resort
      pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false,
      });
    }
  }

  const pageCount = pdf.getPageCount();

  const bytes = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return {
    bytes,
    pageCount,
    wasCorrupted,
    outputSize: bytes.length,
  };
}