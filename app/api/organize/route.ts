import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const pageIndicesRaw = formData.get("pageIndices") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!pageIndicesRaw) {
      return NextResponse.json({ error: "Page indices are required." }, { status: 400 });
    }

    let pageIndices: number[];
    try {
      pageIndices = JSON.parse(pageIndicesRaw);
    } catch {
      return NextResponse.json({ error: "Invalid page indices format." }, { status: 400 });
    }

    if (!Array.isArray(pageIndices) || pageIndices.length === 0) {
      return NextResponse.json({ error: "At least one page must be selected." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const totalPages = srcPdf.getPageCount();

    // Validate all indices
    const validIndices = pageIndices.filter(
      (i) => typeof i === "number" && i >= 0 && i < totalPages
    );

    if (validIndices.length === 0) {
      return NextResponse.json({ error: "No valid page indices provided." }, { status: 400 });
    }

    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(srcPdf, validIndices);
    pages.forEach((page) => newPdf.addPage(page));

    const bytes = await newPdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="organized.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to organize PDF." },
      { status: 500 }
    );
  }
}