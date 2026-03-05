export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: "application/pdf" });
  downloadBlob(blob, filename);
}

export function downloadJSON(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}

export function generateOutputFilename(
  originalName: string,
  suffix: string,
  ext = "pdf"
): string {
  const base = originalName.replace(/\.[^/.]+$/, ""); // strip extension
  return `${base}_${suffix}.${ext}`;
}

export async function fetchAndDownload(
  url: string,
  filename: string
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download file");
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

export function downloadMultipleBlobs(
  files: { blob: Blob; filename: string }[]
): void {
  files.forEach(({ blob, filename }, i) => {
    // stagger downloads slightly to avoid browser blocking
    setTimeout(() => downloadBlob(blob, filename), i * 300);
  });
}