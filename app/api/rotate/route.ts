import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, degrees } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rotateDeg = parseInt(formData.get("degrees") as string) || 90;
    const pageMode = (formData.get("pageMode") as string) || "all";
    const customPages = formData.get("customPages") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    let pageIndices: number[] = [];

    if (pageMode === "all") {
      pageIndices = Array.from({ length: totalPages }, (_, i) => i);
    } else if (pageMode === "custom" && customPages) {
      const parts = customPages.split(",").map((s) => s.trim());
      for (const part of parts) {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          for (let i = start; i <= Math.min(end, totalPages); i++) {
            pageIndices.push(i - 1);
          }
        } else {
          const p = Number(part);
          if (p >= 1 && p <= totalPages) pageIndices.push(p - 1);
        }
      }
    }

    pageIndices.forEach((i) => {
      const page = pdf.getPage(i);
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rotateDeg) % 360));
    });

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="rotated.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to rotate PDF." },
      { status: 500 }
    );
  }
}