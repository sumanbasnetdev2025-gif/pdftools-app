import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const quality = (formData.get("quality") as string) || "medium";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

    const bytes = await pdf.save({
      useObjectStreams: quality !== "high",
      addDefaultPage: false,
      objectsPerTick: quality === "low" ? 50 : quality === "medium" ? 20 : 10,
    });

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="compressed.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to compress PDF." },
      { status: 500 }
    );
  }
}