import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    let pdf: PDFDocument;
    try {
      pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: true,
      });
    } catch (loadErr) {
      // Try with more permissive options
      try {
        pdf = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          updateMetadata: false,
        });
      } catch {
        return NextResponse.json(
          { error: "This PDF is too severely corrupted to repair." },
          { status: 422 }
        );
      }
    }

    const pageCount = pdf.getPageCount();

    // Re-save with clean structure
    const bytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="repaired.pdf"',
        "X-Page-Count": String(pageCount),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to repair PDF." },
      { status: 500 }
    );
  }
}