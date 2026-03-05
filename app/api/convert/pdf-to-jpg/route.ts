import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const quality = (formData.get("quality") as string) || "medium";
    const page = parseInt(formData.get("page") as string) || 1;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // NOTE: Server-side PDF to JPG requires a PDF rendering library.
    // Options:
    // 1. Poppler (pdfimages / pdftoppm) — free, install on server
    // 2. Ghostscript — free, widely available
    // 3. pdf2pic npm package (wraps GraphicsMagick/ImageMagick)
    // 4. Adobe PDF Services / Zamzar API
    //
    // Example with pdf2pic:
    // import { fromBuffer } from "pdf2pic";
    // const arrayBuffer = await file.arrayBuffer();
    // const buffer = Buffer.from(arrayBuffer);
    // const converter = fromBuffer(buffer, {
    //   density: quality === "high" ? 300 : quality === "medium" ? 150 : 72,
    //   format: "jpg",
    //   width: 1200,
    //   height: 1600,
    // });
    // const result = await converter(page, { responseType: "buffer" });
    // return new NextResponse(result.buffer, {
    //   headers: { "Content-Type": "image/jpeg" },
    // });
    //
    // NOTE: Client-side conversion using pdfjs-dist is already implemented
    // in the frontend page (pdf-to-jpg/page.tsx) and works without this route.

    return NextResponse.json(
      { error: "Server-side PDF to JPG requires pdf2pic or Ghostscript. Client-side conversion is already handled in the browser." },
      { status: 501 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Conversion failed." },
      { status: 500 }
    );
  }
}