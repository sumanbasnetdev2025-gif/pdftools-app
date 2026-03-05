import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Position =
  | "bottom-center" | "bottom-left" | "bottom-right"
  | "top-center" | "top-left" | "top-right";

function getXY(
  pos: Position,
  width: number,
  height: number,
  textWidth: number
): { x: number; y: number } {
  const margin = 30;
  switch (pos) {
    case "bottom-left":   return { x: margin, y: margin };
    case "bottom-right":  return { x: width - textWidth - margin, y: margin };
    case "bottom-center": return { x: (width - textWidth) / 2, y: margin };
    case "top-left":      return { x: margin, y: height - margin };
    case "top-right":     return { x: width - textWidth - margin, y: height - margin };
    case "top-center":    return { x: (width - textWidth) / 2, y: height - margin };
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const position = ((formData.get("position") as string) || "bottom-center") as Position;
    const startFrom = parseInt(formData.get("startFrom") as string) || 1;
    const fontSize = parseInt(formData.get("fontSize") as string) || 12;
    const prefix = (formData.get("prefix") as string) || "";
    const suffix = (formData.get("suffix") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

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
        opacity: 0.85,
      });
    });

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="numbered.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to add page numbers." },
      { status: 500 }
    );
  }
}