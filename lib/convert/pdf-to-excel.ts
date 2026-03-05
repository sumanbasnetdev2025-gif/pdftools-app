// NOTE: Client-side PDF to Excel extraction using pdfjs-dist
// For full table extraction accuracy, use a server-side API (see api/convert/pdf-to-excel/route.ts)

import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface ExtractedTable {
  page: number;
  rows: string[][];
}

export interface PDFToExcelResult {
  tables: ExtractedTable[];
  rawText: string;
}

export async function extractTablesFromPDF(file: File): Promise<PDFToExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const tables: ExtractedTable[] = [];
  let rawText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group items by vertical position (y coordinate) to form rows
    const itemsByY = new Map<number, string[]>();

    content.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]); // vertical position
      if (!itemsByY.has(y)) itemsByY.set(y, []);
      itemsByY.get(y)!.push(item.str.trim());
    });

    // Sort rows by Y descending (top to bottom)
    const sortedRows = Array.from(itemsByY.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, cells]) => cells.filter((c) => c.length > 0));

    const nonEmptyRows = sortedRows.filter((row) => row.length > 0);

    if (nonEmptyRows.length > 0) {
      tables.push({ page: i, rows: nonEmptyRows });
      rawText += nonEmptyRows.map((r) => r.join("\t")).join("\n") + "\n\n";
    }
  }

  return { tables, rawText };
}

export function tablesToCSV(tables: ExtractedTable[]): string {
  return tables
    .map(
      (t) =>
        `=== Page ${t.page} ===\n` +
        t.rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
    )
    .join("\n\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}