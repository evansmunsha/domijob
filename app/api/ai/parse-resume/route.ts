import { NextRequest, NextResponse } from "next/server";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Helper to parse form
async function parseFormData(req: any): Promise<{ file: File }> {
  const form = formidable({ keepExtensions: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!uploaded) return reject("No file uploaded.");
      resolve({ file: uploaded as File });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    // This ensures the underlying Node.js request is accessible
    const nodeReq = (req as any).req;

    const { file } = await parseFormData(nodeReq);

    const ext = path.extname(file.originalFilename || "").toLowerCase();
    if (ext === ".pdf") {
      return NextResponse.json({ error: "PDFs are not supported." }, { status: 400 });
    }

    const buffer = fs.readFileSync(file.filepath);
    let text = "";

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString();
    }

    const cleaned = text.replace(/\s+/g, " ").slice(0, 12000);

    const gpt = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a resume parser. Extract structured data from the text and return it in JSON format. Include fields: name, email, phone, location, summary, skills, experience, education, and certifications.",
        },
        { role: "user", content: cleaned },
      ],
      temperature: 0.2,
    });

    const parsed = gpt.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      parsed: parsed ? JSON.parse(parsed) : null,
    });
  } catch (err) {
    console.error("Resume parse error:", err);
    return NextResponse.json({ error: "Resume parsing failed." }, { status: 500 });
  }
}
