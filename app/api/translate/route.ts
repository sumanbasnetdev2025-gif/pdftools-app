import { NextRequest, NextResponse } from "next/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function translateWithDeepSeek(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("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");

  const languageNames: Record<string, string> = {
    en: "English", es: "Spanish", fr: "French", de: "German",
    it: "Italian", pt: "Portuguese", zh: "Chinese", ja: "Japanese",
    ko: "Korean", ar: "Arabic", ru: "Russian", hi: "Hindi",
    ne: "Nepali", bng: "Bengali", urd: "Urdu", tml: "Tamil",
  };

  const sourceName = languageNames[sourceLang] || sourceLang;
  const targetName = languageNames[targetLang] || targetLang;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "PDFMaster",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${sourceName} to ${targetName}. 
Return ONLY the translated text with no explanations, no notes, no original text. 
Preserve all formatting, line breaks, and structure exactly as in the original.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Translation API failed");
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sourceLang = (formData.get("sourceLang") as string) || "en";
    const targetLang = (formData.get("targetLang") as string) || "es";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (sourceLang === targetLang) {
      return NextResponse.json(
        { error: "Source and target languages must differ." },
        { status: 400 }
      );
    }

    // Step 1: Extract text per page
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await (pdfjsLib as any)
      .getDocument({ data: arrayBuffer })
      .promise;

    const pageTexts: string[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => item.str)
        .join(" ")
        .trim();
      pageTexts.push(text);
    }

    // Step 2: Translate each page
    const translatedPages: string[] = [];

    for (const text of pageTexts) {
      if (!text.trim()) {
        translatedPages.push("");
        continue;
      }
      // Chunk if text is too long (>3000 chars)
      if (text.length > 3000) {
        const chunks = text.match(/.{1,3000}(\s|$)/g) || [text];
        const translatedChunks = await Promise.all(
          chunks.map((chunk) =>
            translateWithDeepSeek(chunk, sourceLang, targetLang)
          )
        );
        translatedPages.push(translatedChunks.join(" "));
      } else {
        const translated = await translateWithDeepSeek(
          text,
          sourceLang,
          targetLang
        );
        translatedPages.push(translated);
      }
    }

    // Step 3: Build translated PDF
    const newPdf = await PDFDocument.create();
    const font = await newPdf.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = fontSize * 1.5;
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const maxWidth = pageWidth - margin * 2;

    for (const translatedText of translatedPages) {
      if (!translatedText.trim()) {
        newPdf.addPage([pageWidth, pageHeight]);
        continue;
      }

      let currentPage = newPdf.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      const paragraphs = translatedText.split("\n");

      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          y -= lineHeight / 2;
          continue;
        }

        // Word wrap within paragraph
        const words = paragraph.split(" ");
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testWidth > maxWidth && currentLine) {
            // Draw current line
            if (y < margin + lineHeight) {
              currentPage = newPdf.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }
            currentPage.drawText(currentLine, {
              x: margin,
              y,
              size: fontSize,
              font,
              color: rgb(0.1, 0.1, 0.1),
            });
            y -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        // Draw remaining line
        if (currentLine.trim()) {
          if (y < margin + lineHeight) {
            currentPage = newPdf.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          currentPage.drawText(currentLine, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          y -= lineHeight;
        }

        y -= lineHeight * 0.3; // paragraph spacing
      }
    }

    const bytes = await newPdf.save();
    const targetLabel = targetLang.toUpperCase();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(
          ".pdf",
          `_${targetLabel}.pdf`
        )}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Translation failed." },
      { status: 500 }
    );
  }
}