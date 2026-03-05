import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
export type RenderQuality = "low" | "medium" | "high";

const qualityScaleMap: Record<RenderQuality, number> = {
  low: 1,
  medium: 1.5,
  high: 2,
};

export interface ConvertedPage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export async function convertPDFToJPG(
  file: File,
  quality: RenderQuality = "medium",
  onProgress?: (current: number, total: number) => void
): Promise<ConvertedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const scale = qualityScaleMap[quality];
  const results: ConvertedPage[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
    );

    results.push({
      pageNumber: i,
      dataUrl,
      blob,
      width: viewport.width,
      height: viewport.height,
    });

    onProgress?.(i, totalPages);
  }

  return results;
}

export function getJPGFilename(pdfFilename: string, pageNumber: number): string {
  const base = pdfFilename.replace(/\.pdf$/i, "");
  return `${base}_page${pageNumber}.jpg`;
}