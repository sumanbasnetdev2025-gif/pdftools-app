import { NextRequest, NextResponse } from "next/server";

// 1. Use the legacy build (compatible with Node.js environments)
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

interface CellData {
  text: string;
  x: number;
  y: number;
}

function buildCSVFromCells(cells: CellData[][]): string {
  return cells
    .map((row) =>
      row
        .map((cell) => `"${(cell.text || "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // 2. CRITICAL FIX: Disable the worker and use Uint8Array
    // This prevents the "Cannot find module pdf.worker.mjs" error
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableWorker: true, // Forces PDF.js to run in the main thread (essential for Next.js API)
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    let csvContent = "";

    // 3. Extraction Logic
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const rowMap = new Map<number, CellData[]>();
      const TOLERANCE = 5; 

      content.items.forEach((item: any) => {
        const y = item.transform[5];
        const x = item.transform[4];
        
        let foundY = Array.from(rowMap.keys()).find(
          (key) => Math.abs(key - y) < TOLERANCE
        );

        if (foundY === undefined) {
          rowMap.set(y, []);
          foundY = y;
        }
        
        rowMap.get(foundY)!.push({ text: item.str, x, y });
      });

      const rows = Array.from(rowMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([, cells]) =>
          cells.sort((a, b) => a.x - b.x).filter((c) => c.text.trim())
        )
        .filter((row) => row.length > 0);

      csvContent += buildCSVFromCells(rows) + "\n";
    }

    // 4. Return as CSV
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.name.replace(/\.pdf$/i, ".csv")}"`,
      },
    });

  } catch (err: any) {
    console.error("PDF Processing Error:", err);
    return NextResponse.json(
      { error: `Server Error: ${err.message}` },
      { status: 500 }
    );
  }
}