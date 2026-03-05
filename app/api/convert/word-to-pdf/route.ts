import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CLOUDCONVERT_API_KEY not configured in environment." },
        { status: 500 }
      );
    }

    // Step 1: Create job
    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "upload-file": {
            operation: "import/upload",
          },
          "convert-file": {
            operation: "convert",
            input: "upload-file",
            output_format: "pdf",
            engine: "libreoffice",
          },
          "export-file": {
            operation: "export/url",
            input: "convert-file",
          },
        },
      }),
    });

    if (!jobRes.ok) {
      const err = await jobRes.json();
      throw new Error(err.message || "Failed to create CloudConvert job");
    }

    const job = await jobRes.json();
    const uploadTask = job.data.tasks.find(
      (t: any) => t.name === "upload-file"
    );

    if (!uploadTask?.result?.form) {
      throw new Error("Upload task not ready");
    }

    // Step 2: Upload file
    const uploadForm = new FormData();
    Object.entries(uploadTask.result.form.parameters as Record<string, string>).forEach(
      ([key, value]) => uploadForm.append(key, value)
    );
    uploadForm.append("file", file);

    const uploadRes = await fetch(uploadTask.result.form.url, {
      method: "POST",
      body: uploadForm,
    });

    if (!uploadRes.ok) throw new Error("File upload to CloudConvert failed");

    // Step 3: Wait for conversion
    let exportTask = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(
        `https://api.cloudconvert.com/v2/jobs/${job.data.id}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const statusData = await statusRes.json();

      exportTask = statusData.data.tasks.find(
        (t: any) => t.name === "export-file" && t.status === "finished"
      );

      if (exportTask) break;

      const failedTask = statusData.data.tasks.find(
        (t: any) => t.status === "error"
      );
      if (failedTask) throw new Error(failedTask.message || "Conversion failed");
    }

    if (!exportTask?.result?.files?.[0]?.url) {
      throw new Error("Conversion timed out");
    }

    // Step 4: Download converted file
    const downloadRes = await fetch(exportTask.result.files[0].url);
    const pdfBytes = await downloadRes.arrayBuffer();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(/\.(doc|docx)$/i, ".pdf")}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Word to PDF conversion failed." },
      { status: 500 }
    );
  }
}