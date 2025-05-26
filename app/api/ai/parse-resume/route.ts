import { NextRequest } from "next/server";
import formidable, { IncomingForm, File, Files } from "formidable";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { OpenAI } from "openai";

// Ensure it runs on Node.js runtime
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Disable Next.js default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest & { req: any }) {
  try {
    // Get raw Node.js IncomingMessage from NextRequest
    const nodeReq = req.req;

    const form = new IncomingForm({ keepExtensions: true });

    const files: Files = await new Promise((resolve, reject) => {
      form.parse(nodeReq, (_err, _fields, files) => {
        if (_err) reject(_err);
        else resolve(files);
      });
    });

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    const file = uploadedFile as File;

    if (!file || !file.filepath) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    const ext = path.extname(file.originalFilename || "").toLowerCase();

    if (ext === ".pdf") {
      return new Response(JSON.stringify({ error: "PDF files are not supported." }), { status: 400 });
    }

    const buffer = fs.readFileSync(file.filepath);
    let plainText = "";

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      plainText = result.value;
    } else {
      plainText = buffer.toString(); // fallback for .txt, .md, etc.
    }

    const cleanedText = plainText.replace(/\s+/g, " ").slice(0, 12000);

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a resume parser. Extract structured data from the text and return it in JSON format. Include fields: name, email, phone, location, summary, skills, experience, education, and certifications.",
        },
        { role: "user", content: cleanedText },
      ],
      temperature: 0.2,
    });

    const parsed = gptResponse.choices[0]?.message?.content;

    return new Response(JSON.stringify({ success: true, parsed: parsed ? JSON.parse(parsed) : null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Resume parse error:", err);
    return new Response(JSON.stringify({ error: "Failed to parse resume" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
