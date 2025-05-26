import { NextRequest, NextResponse } from "next/server";
import formidable, { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // add to your .env.local
});

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: any): Promise<{ files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ files });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const nodeReq = (req as any).req;
    const { files } = await parseForm(nodeReq);

    const file = files.file as unknown as formidable.File;
    if (!file || !file.filepath) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = fs.readFileSync(file.filepath);
    const ext = path.extname(file.originalFilename || "").toLowerCase();

    let plainText = "";

    if (ext === ".pdf") {
      const data = await pdfParse(buffer);
      plainText = data.text;
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      plainText = result.value;
    } else {
      plainText = buffer.toString(); // fallback
    }

    // Clean text for token efficiency
    const cleanedText = plainText.replace(/\s+/g, " ").slice(0, 12000);

    // Send to OpenAI for parsing
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a resume parser. Extract structured data from the text and return it in JSON format. Include fields: name, email, phone, location, summary, skills, experience, education, and certifications.",
        },
        {
          role: "user",
          content: cleanedText,
        },
      ],
      temperature: 0.2,
    });

    const parsed = gptResponse.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      parsed: parsed ? JSON.parse(parsed) : null,
    });
  } catch (err) {
    console.error("Resume parse error:", err);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
