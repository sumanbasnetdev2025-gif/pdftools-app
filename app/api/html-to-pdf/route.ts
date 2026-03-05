import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const maxDuration = 60; // Vercel pro timeout

export async function POST(req: NextRequest) {
  let browser;
  try {
    const formData = await req.formData();
    const mode = formData.get("mode") as string;
    const url = formData.get("url") as string;
    const html = formData.get("html") as string;

    if (mode === "url" && !url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }
    if (mode === "html" && !html) {
      return NextResponse.json({ error: "HTML is required." }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === "production";

    browser = await puppeteer.launch({
      args: isProduction ? chromium.args : [],
      defaultViewport: chromium.defaultViewport,
      executablePath: isProduction
        ? await chromium.executablePath(
            "https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar"
          )
        : process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : "/usr/bin/google-chrome",
      headless: true,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(25000);

    if (mode === "url") {
      await page.goto(url, { waitUntil: "networkidle2" });
    } else {
      await page.setContent(html, { waitUntil: "networkidle2" });
    }

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });

    await browser.close();

    const filename =
      mode === "url"
        ? `${new URL(url).hostname}.pdf`
        : "converted_page.pdf";

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    if (browser) await browser.close().catch(() => {});
    return NextResponse.json(
      { error: err?.message || "HTML to PDF failed." },
      { status: 500 }
    );
  }
}