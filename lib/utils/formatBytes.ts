export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatBytesDetailed(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${bytes} B`;
}

export function isFileSizeValid(bytes: number, maxMB = 100): boolean {
  return bytes <= maxMB * 1024 * 1024;
}

export function getFileSizeColor(bytes: number, maxMB = 100): string {
  const percent = (bytes / (maxMB * 1024 * 1024)) * 100;
  if (percent >= 90) return "text-red-500";
  if (percent >= 70) return "text-yellow-500";
  return "text-green-500";
}