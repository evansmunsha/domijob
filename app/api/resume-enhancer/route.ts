



import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import formidable from 'formidable';
import fs from 'fs/promises';
import OpenAI from 'openai';

// Disable default body parsing for file upload
export const config = {
  api: { bodyParser: false },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Parse form using formidable
const parseForm = async (req: NextRequest) => {
  const form = formidable({ multiples: false, uploadDir: '/tmp', keepExtensions: true });

  return await new Promise<{ files: formidable.Files }>((resolve, reject) => {
    form.parse(req as any, (err, _fields, files) => {
      if (err) reject(err);
      else resolve({ files });
    });
  });
};

export async function POST(req: NextRequest) {
  try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !file.filepath || !file.mimetype) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const filePath = file.filepath;
    let text = '';

    // PDF
    if (file.mimetype === 'application/pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer as Buffer);
      text = data.text;
    }
    

    // Word (docx)
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = await fs.readFile(filePath);
    
      // Create a new Uint8Array copy to ensure a plain ArrayBuffer
      const arrayBuffer = new Uint8Array(buffer).buffer;
    
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    }
    
    
    

    // Plain text
    else if (file.mimetype.startsWith('text/')) {
      const buffer = await fs.readFile(filePath);
      text = buffer.toString('utf-8');
    }

    else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const prompt = `You are a professional resume assistant. Improve this resume content:\n\n${text}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const result = completion.choices[0].message?.content || 'No result.';
    return NextResponse.json({ result });

  } catch (err: any) {
    console.error('Error in resume-enhancer:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
