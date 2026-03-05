import { NextRequest, NextResponse } from "next/server";
import Tesseract from "tesseract.js";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "eng";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Tesseract.js runs fully in Node - no binary needed
    const { data: { text } } = await Tesseract.recognize(buffer, language, {
      logger: () => {},
    });

    return NextResponse.json({
      text: text.trim(),
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "OCR failed." },
      { status: 500 }
    );
  }
}