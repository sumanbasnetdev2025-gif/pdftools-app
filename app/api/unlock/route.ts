import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const password = (formData.get("password") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await PDFDocument.load(arrayBuffer, {
      password: password || undefined,
      ignoreEncryption: true,
    });

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="unlocked.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Incorrect password or unsupported encryption." },
      { status: 400 }
    );
  }
}