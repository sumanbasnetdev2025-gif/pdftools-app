import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mode = (formData.get("mode") as string) || "all";
    const rangeInput = formData.get("range") as string;
    const everyN = parseInt(formData.get("everyN") as string) || 1;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const totalPages = srcPdf.getPageCount();

    let pageGroups: number[][] = [];

    if (mode === "all") {
      pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
    } else if (mode === "every") {
      for (let i = 0; i < totalPages; i += everyN) {
        pageGroups.push(
          Array.from({ length: Math.min(everyN, totalPages - i) }, (_, j) => i + j)
        );
      }
    } else if (mode === "range" && rangeInput) {
      const parts = rangeInput.split(",").map((s) => s.trim());
      for (const part of parts) {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          if (start >= 1 && end <= totalPages && start <= end) {
            pageGroups.push(
              Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i)
            );
          }
        } else {
          const page = Number(part);
          if (page >= 1 && page <= totalPages) pageGroups.push([page - 1]);
        }
      }
    }

    if (pageGroups.length === 0) {
      return NextResponse.json({ error: "No valid pages found." }, { status: 400 });
    }

    // Return first split as example (client handles multiple downloads)
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(srcPdf, pageGroups[0]);
    pages.forEach((p) => newPdf.addPage(p));
    const bytes = await newPdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="split_part1.pdf"',
        "X-Total-Parts": String(pageGroups.length),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to split PDF." },
      { status: 500 }
    );
  }
}