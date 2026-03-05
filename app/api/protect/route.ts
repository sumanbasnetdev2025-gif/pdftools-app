import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const timestamp = Date.now();
  const tmpInput = join(tmpdir(), `protect_in_${timestamp}.pdf`);
  const tmpOutput = join(tmpdir(), `protect_out_${timestamp}.pdf`);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userPassword = (formData.get("userPassword") as string) || "";
    const ownerPassword =
      (formData.get("ownerPassword") as string) ||
      userPassword + Math.random().toString(36).slice(2, 8);

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!userPassword)
      return NextResponse.json({ error: "Password is required." }, { status: 400 });

    const bytes = await file.arrayBuffer();
    writeFileSync(tmpInput, Buffer.from(bytes));

    // Dynamically import node-qpdf2
    const qpdf = await import("node-qpdf2");

    const options = {
      keyLength: 256,
      password: {
        user: userPassword,
        owner: ownerPassword,
      },
      restrictions: {
        print: "full" as const,
        useOtherOperations: "all" as const,
      },
    };

    await qpdf.encrypt(tmpInput, options, tmpOutput);

    if (!existsSync(tmpOutput)) {
      throw new Error("Encryption failed — output file not created.");
    }

    const outBytes = readFileSync(tmpOutput);

    return new NextResponse(outBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(".pdf", "_protected.pdf")}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Protection failed." },
      { status: 500 }
    );
  } finally {
    if (existsSync(tmpInput)) unlinkSync(tmpInput);
    if (existsSync(tmpOutput)) unlinkSync(tmpOutput);
  }
}