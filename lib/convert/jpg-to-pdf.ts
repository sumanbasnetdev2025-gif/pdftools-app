import { PDFDocument } from "pdf-lib";

export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "portrait" | "landscape";

export interface JPGToPDFOptions {
  pageSize?: PageSize;
  orientation?: Orientation;
  margin?: number;
}

const pageSizes = {
  a4: { width: 595, height: 842 },
  letter: { width: 612, height: 792 },
};

export async function convertJPGToPDF(
  files: File[],
  options: JPGToPDFOptions = {}
): Promise<Uint8Array> {
  const { pageSize = "fit", orientation = "portrait", margin = 20 } = options;

  const pdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    let image;
    if (file.type === "image/png") {
      image = await pdf.embedPng(uint8);
    } else {
      image = await pdf.embedJpg(uint8);
    }

    const imgDims = image.size();
    let pageW: number, pageH: number;

    if (pageSize === "fit") {
      pageW = imgDims.width + margin * 2;
      pageH = imgDims.height + margin * 2;
    } else {
      const dims = pageSizes[pageSize];
      pageW = orientation === "portrait" ? dims.width : dims.height;
      pageH = orientation === "portrait" ? dims.height : dims.width;
    }

    const page = pdf.addPage([pageW, pageH]);
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1);
    const drawW = imgDims.width * scale;
    const drawH = imgDims.height * scale;

    page.drawImage(image, {
      x: (pageW - drawW) / 2,
      y: (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  return pdf.save();
}