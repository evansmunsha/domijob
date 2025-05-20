import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
import mammoth from 'mammoth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GUEST_CREDIT_COOKIE = 'domijob_guest_credits';
const MAX_GUEST_CREDITS = 50;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  // ✅ Handle guest credits
  const cookieStore = cookies();
  const cookie = (await cookieStore).get(GUEST_CREDIT_COOKIE);
  let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

  if (guestCredits <= 0) {
    return new Response('No guest credits remaining. Please sign up to continue.', {
      status: 403,
    });
  }

  // ✅ Decrement credits and update cookie
  guestCredits -= 1;
  (await cookieStore).set(GUEST_CREDIT_COOKIE, guestCredits.toString(), {
    path: '/',
    httpOnly: false, // Client can read
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // ✅ Extract text from DOCX
  let plainText: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
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
