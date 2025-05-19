//pages/api/resume-enhancer/route.ts


import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';
import mammoth from 'mammoth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract text from DOCX using mammoth
  let plainText: string;
try {
  const result = await mammoth.extractRawText({ buffer: buffer as any });
  plainText = result.value;
} catch (error) {
  console.error('Error parsing DOCX:', error);
  return new Response('Failed to parse DOCX file.', { status: 500 });
}


  const prompt = `Improve this resume:\n\n${plainText}`;

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      { role: 'system', content: 'You are an expert resume writer. Format and enhance resumes.' },
      { role: 'user', content: prompt },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

