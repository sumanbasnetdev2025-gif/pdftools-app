import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const pageSize = (formData.get("pageSize") as string) || "fit";
    const orientation = (formData.get("orientation") as string) || "portrait";
    const margin = parseInt(formData.get("margin") as string) || 20;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No image files provided." }, { status: 400 });
    }

    const pdf = await PDFDocument.create();

    const a4 = { width: 595, height: 842 };
    const letter = { width: 612, height: 792 };

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

      if (pageSize === "a4") {
        pageW = orientation === "portrait" ? a4.width : a4.height;
        pageH = orientation === "portrait" ? a4.height : a4.width;
      } else if (pageSize === "letter") {
        pageW = orientation === "portrait" ? letter.width : letter.height;
        pageH = orientation === "portrait" ? letter.height : letter.width;
      } else {
        pageW = imgDims.width + margin * 2;
        pageH = imgDims.height + margin * 2;
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

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="images_converted.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to convert images to PDF." },
      { status: 500 }
    );
  }
}