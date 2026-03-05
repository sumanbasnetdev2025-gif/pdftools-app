import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const top = parseFloat(formData.get("top") as string) || 0;
    const right = parseFloat(formData.get("right") as string) || 0;
    const bottom = parseFloat(formData.get("bottom") as string) || 0;
    const left = parseFloat(formData.get("left") as string) || 0;
    const applyTo = (formData.get("applyTo") as string) || "all";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (top + right + bottom + left === 0) {
      return NextResponse.json({ error: "At least one margin must be set." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    pages.forEach((page, i) => {
      const pageNum = i + 1;
      const shouldApply =
        applyTo === "all" ||
        (applyTo === "odd" && pageNum % 2 !== 0) ||
        (applyTo === "even" && pageNum % 2 === 0);

      if (!shouldApply) return;

      const { width, height } = page.getSize();
      page.setCropBox(
        left,
        bottom,
        Math.max(10, width - left - right),
        Math.max(10, height - top - bottom)
      );
    });

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="cropped.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to crop PDF." },
      { status: 500 }
    );
  }
}