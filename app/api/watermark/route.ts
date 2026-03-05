import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const text = (formData.get("text") as string) || "CONFIDENTIAL";
    const fontSize = parseInt(formData.get("fontSize") as string) || 48;
    const opacity = parseFloat(formData.get("opacity") as string) / 100 || 0.3;
    const color = (formData.get("color") as string) || "#ff0000";
    const diagonal = formData.get("diagonal") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const hexToRgb = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const { r, g, b } = hexToRgb(color);

    pdf.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity,
        rotate: diagonal ? degrees(45) : degrees(0),
      });
    });

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="watermarked.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to add watermark." },
      { status: 500 }
    );
  }
}