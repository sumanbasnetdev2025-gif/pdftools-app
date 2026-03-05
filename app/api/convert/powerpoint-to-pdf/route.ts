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
        { error: "CLOUDCONVERT_API_KEY not configured." },
        { status: 500 }
      );
    }

    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "upload-file": { operation: "import/upload" },
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

    const job = await jobRes.json();
    const uploadTask = job.data.tasks.find((t: any) => t.name === "upload-file");

    const uploadForm = new FormData();
    Object.entries(
      uploadTask.result.form.parameters as Record<string, string>
    ).forEach(([k, v]) => uploadForm.append(k, v));
    uploadForm.append("file", file);
    await fetch(uploadTask.result.form.url, { method: "POST", body: uploadForm });

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://api.cloudconvert.com/v2/jobs/${job.data.id}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const status = await statusRes.json();
      const exportTask = status.data.tasks.find(
        (t: any) => t.name === "export-file" && t.status === "finished"
      );
      if (exportTask?.result?.files?.[0]?.url) {
        const dl = await fetch(exportTask.result.files[0].url);
        const bytes = await dl.arrayBuffer();
        return new NextResponse(bytes, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${file.name.replace(/\.(ppt|pptx)$/i, ".pdf")}"`,
          },
        });
      }
      const failed = status.data.tasks.find((t: any) => t.status === "error");
      if (failed) throw new Error(failed.message || "Conversion failed");
    }

    throw new Error("Conversion timed out.");
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "PPT to PDF failed." },
      { status: 500 }
    );
  }
}