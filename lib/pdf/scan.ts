import { PDFDocument } from "pdf-lib";

export interface ScanAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  rotation: number;   // degrees
  tiltX: number;      // horizontal tilt correction in degrees
  tiltY: number;      // vertical tilt correction in degrees
}

export interface ScannedPage {
  imageDataUrl: string;
  adjustments: ScanAdjustments;
  width: number;
  height: number;
}

export type PageSize = "a4" | "fit";

export const DEFAULT_ADJUSTMENTS: ScanAdjustments = {
  brightness: 0,
  contrast: 0,
  rotation: 0,
  tiltX: 0,
  tiltY: 0,
};

export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
};

/**
 * Apply brightness/contrast + tilt correction to an image using an offscreen canvas.
 * Returns a new dataURL with all adjustments baked in.
 */
export async function applyAdjustmentsToImage(
  imageDataUrl: string,
  adjustments: ScanAdjustments
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { brightness, contrast, tiltX, tiltY, rotation } = adjustments;

      // Compute canvas size accounting for rotation
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const canvasW = Math.ceil(img.width * cos + img.height * sin);
      const canvasH = Math.ceil(img.width * sin + img.height * cos);

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;

      // Apply brightness/contrast via CSS filter
      const brightnessVal = 1 + brightness / 100;
      const contrastVal = 1 + contrast / 100;
      ctx.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`;

      // Apply tilt correction via skew transform
      ctx.save();
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate(rad);

      // Skew for tilt correction
      const skewX = Math.tan((tiltX * Math.PI) / 180);
      const skewY = Math.tan((tiltY * Math.PI) / 180);
      ctx.transform(1, skewY, skewX, 1, 0, 0);

      ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
      ctx.restore();

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * Detect document edges using canvas pixel analysis.
 * Returns corner points as percentages (0-1) of image dimensions.
 */
export function detectDocumentEdges(
  imageDataUrl: string
): Promise<{ topLeft: [number, number]; topRight: [number, number]; bottomLeft: [number, number]; bottomRight: [number, number] }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const SAMPLE_W = 400;
      const scale = SAMPLE_W / img.width;
      const SAMPLE_H = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = SAMPLE_W;
      canvas.height = SAMPLE_H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);

      const imageData = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
      const data = imageData.data;

      // Simple edge detection: find rows/cols where brightness changes significantly
      const PADDING = 0.05;

      // Scan from edges inward to find document boundary
      let topRow = Math.round(SAMPLE_H * PADDING);
      let bottomRow = Math.round(SAMPLE_H * (1 - PADDING));
      let leftCol = Math.round(SAMPLE_W * PADDING);
      let rightCol = Math.round(SAMPLE_W * (1 - PADDING));

      const getBrightness = (x: number, y: number) => {
        const idx = (y * SAMPLE_W + x) * 4;
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      };

      // Find top edge
      for (let y = 5; y < SAMPLE_H / 2; y++) {
        let lineVar = 0;
        for (let x = 10; x < SAMPLE_W - 10; x += 5) {
          lineVar += Math.abs(getBrightness(x, y) - getBrightness(x, y - 1));
        }
        if (lineVar / (SAMPLE_W / 5) > 8) { topRow = y; break; }
      }
      // Find bottom edge
      for (let y = SAMPLE_H - 5; y > SAMPLE_H / 2; y--) {
        let lineVar = 0;
        for (let x = 10; x < SAMPLE_W - 10; x += 5) {
          lineVar += Math.abs(getBrightness(x, y) - getBrightness(x, y + 1));
        }
        if (lineVar / (SAMPLE_W / 5) > 8) { bottomRow = y; break; }
      }
      // Find left edge
      for (let x = 5; x < SAMPLE_W / 2; x++) {
        let lineVar = 0;
        for (let y = 10; y < SAMPLE_H - 10; y += 5) {
          lineVar += Math.abs(getBrightness(x, y) - getBrightness(x - 1, y));
        }
        if (lineVar / (SAMPLE_H / 5) > 8) { leftCol = x; break; }
      }
      // Find right edge
      for (let x = SAMPLE_W - 5; x > SAMPLE_W / 2; x--) {
        let lineVar = 0;
        for (let y = 10; y < SAMPLE_H - 10; y += 5) {
          lineVar += Math.abs(getBrightness(x, y) - getBrightness(x + 1, y));
        }
        if (lineVar / (SAMPLE_H / 5) > 8) { rightCol = x; break; }
      }

      resolve({
        topLeft:     [leftCol  / SAMPLE_W, topRow    / SAMPLE_H],
        topRight:    [rightCol / SAMPLE_W, topRow    / SAMPLE_H],
        bottomLeft:  [leftCol  / SAMPLE_W, bottomRow / SAMPLE_H],
        bottomRight: [rightCol / SAMPLE_W, bottomRow / SAMPLE_H],
      });
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * Crop an image to the region defined by four corner points (as 0-1 fractions).
 */
export async function cropToCorners(
  imageDataUrl: string,
  corners: { topLeft: [number, number]; topRight: [number, number]; bottomLeft: [number, number]; bottomRight: [number, number] }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { topLeft, topRight, bottomLeft, bottomRight } = corners;
      const x = topLeft[0] * img.width;
      const y = topLeft[1] * img.height;
      const w = (topRight[0] - topLeft[0]) * img.width;
      const h = (bottomLeft[1] - topLeft[1]) * img.height;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(10, w);
      canvas.height = Math.max(10, h);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * Convert multiple scanned pages into a single PDF Uint8Array.
 */
export async function scanPagesToPDF(
  pages: ScannedPage[],
  pageSize: PageSize = "a4"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const scannedPage of pages) {
    // Apply adjustments & crop
    const adjusted = await applyAdjustmentsToImage(
      scannedPage.imageDataUrl,
      scannedPage.adjustments
    );

    // Embed image
    const base64 = adjusted.split(",")[1];
    const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const embeddedImage = await pdfDoc.embedJpg(imgBytes);

    let pageW: number, pageH: number;

    if (pageSize === "a4") {
      pageW = PAGE_SIZES.a4.width;
      pageH = PAGE_SIZES.a4.height;
    } else {
      pageW = embeddedImage.width;
      pageH = embeddedImage.height;
    }

    const page = pdfDoc.addPage([pageW, pageH]);

    // Scale image to fit page while maintaining aspect ratio
    const imgAspect = embeddedImage.width / embeddedImage.height;
    const pageAspect = pageW / pageH;

    let drawW: number, drawH: number;
    if (imgAspect > pageAspect) {
      drawW = pageW;
      drawH = pageW / imgAspect;
    } else {
      drawH = pageH;
      drawW = pageH * imgAspect;
    }

    const offsetX = (pageW - drawW) / 2;
    const offsetY = (pageH - drawH) / 2;

    page.drawImage(embeddedImage, {
      x: offsetX,
      y: offsetY,
      width: drawW,
      height: drawH,
    });
  }

  return pdfDoc.save();
}