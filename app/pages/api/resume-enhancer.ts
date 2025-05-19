// pages/api/resume-enhancer.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import formidable from 'formidable';
import fs from 'fs/promises';
import OpenAI from 'openai';

// Disable body parsing to allow file uploads
export const config = {
  api: { bodyParser: false },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const parseForm = async (req: NextApiRequest): Promise<{ files: formidable.Files }> => {
  const form = formidable({ multiples: false, uploadDir: '/tmp', keepExtensions: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, _fields, files) => {
      if (err) reject(err);
      else resolve({ files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !file.filepath || !file.mimetype) {
      return res.status(400).json({ error: 'Invalid file' });
    }

    const filePath = file.filepath;
    let text = '';

    // PDF file
    if (file.mimetype === 'application/pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
    }

    // DOCX Word file
    else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const buffer = await fs.readFile(filePath);
      const arrayBuffer = new Uint8Array(buffer).buffer;
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    }

    // Plain text file
    else if (file.mimetype.startsWith('text/')) {
      const buffer = await fs.readFile(filePath);
      text = buffer.toString('utf-8');
    }

    else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Send to OpenAI
    const prompt = `You are a professional resume assistant. Improve this resume content:\n\n${text}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const result = completion.choices[0].message?.content || 'No result.';
    return res.status(200).json({ result });

  } catch (err: any) {
    console.error('Error in resume-enhancer:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
