import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const signatureImage = formData.get("signature") as File | null;
    const signatureBase64 = formData.get("signatureBase64") as string | null;
    const pageNumber = parseInt(formData.get("page") as string) || 1;
    const posX = parseFloat(formData.get("x") as string) || -1; // -1 = auto bottom-right
    const posY = parseFloat(formData.get("y") as string) || -1;
    const sigWidth = parseFloat(formData.get("width") as string) || 180;
    const sigHeight = parseFloat(formData.get("height") as string) || 60;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (!signatureImage && !signatureBase64) {
      return NextResponse.json({ error: "No signature provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    // Clamp page number
    const targetPage = Math.max(1, Math.min(pageNumber, totalPages));
    const page = pdf.getPage(targetPage - 1);
    const { width, height } = page.getSize();

    // Get signature bytes
    let sigBytes: Uint8Array;
    if (signatureBase64) {
      const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
      sigBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    } else {
      sigBytes = new Uint8Array(await signatureImage!.arrayBuffer());
    }

    // Embed as PNG
    let sigImg;
    try {
      sigImg = await pdf.embedPng(sigBytes);
    } catch {
      sigImg = await pdf.embedJpg(sigBytes);
    }

    // Position: auto = bottom right
    const x = posX >= 0 ? posX : width - sigWidth - 40;
    const y = posY >= 0 ? posY : 40;

    page.drawImage(sigImg, { x, y, width: sigWidth, height: sigHeight, opacity: 0.95 });

    // Signature line
    page.drawLine({
      start: { x, y: y - 2 },
      end: { x: x + sigWidth, y: y - 2 },
      thickness: 0.8,
      color: rgb(0.4, 0.4, 0.4),
      opacity: 0.5,
    });

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="signed.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to sign PDF." },
      { status: 500 }
    );
  }
}