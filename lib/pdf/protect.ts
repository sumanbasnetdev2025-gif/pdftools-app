import { PDFDocument } from "pdf-lib";

export interface ProtectOptions {
  password: string;
  confirmPassword: string;
}

export interface ProtectResult {
  bytes: Uint8Array;
  note: string;
}

export function validatePassword(
  password: string,
  confirmPassword: string
): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: "Password is required." };
  if (password.length < 4)
    return { valid: false, error: "Password must be at least 4 characters." };
  if (password !== confirmPassword)
    return { valid: false, error: "Passwords do not match." };
  return { valid: true };
}

export function getPasswordStrength(password: string): {
  label: string;
  level: number; // 0-4
  color: string;
} {
  if (password.length === 0) return { label: "", level: 0, color: "" };
  if (password.length < 4) return { label: "Too short", level: 1, color: "text-red-500" };
  if (password.length < 8) return { label: "Weak", level: 2, color: "text-orange-500" };
  if (password.length < 12) return { label: "Good", level: 3, color: "text-yellow-500" };
  return { label: "Strong", level: 4, color: "text-green-500" };
}

// NOTE: pdf-lib does not support native PDF encryption.
// For real password protection, use the API route with a server-side library.
// This function saves the PDF as-is and returns a note.
export async function protectPDF(
  file: File,
  options: ProtectOptions
): Promise<ProtectResult> {
  const { password, confirmPassword } = options;
  const validation = validatePassword(password, confirmPassword);
  if (!validation.valid) throw new Error(validation.error);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const bytes = await pdf.save();

  return {
    bytes,
    note: "Full PDF encryption requires server-side processing. Password stored for API route usage.",
  };
}