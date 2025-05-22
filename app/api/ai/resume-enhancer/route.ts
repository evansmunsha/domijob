import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import mammoth from 'mammoth';
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { CREDIT_COSTS } from "@/app/utils/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GUEST_CREDIT_COOKIE = 'domijob_guest_credits';
const MAX_GUEST_CREDITS = 50;

export async function POST(req: NextRequest) {
  try {
    // Get the feature cost
    const featureCost = CREDIT_COSTS.resume_enhancement || 10;
    
    // Check authentication status
    const session = await auth();
    const userId = session?.user?.id;
    
    // Handle credits based on authentication status
    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };
    
    if (userId) {
      // Authenticated user - use database credits
      const userCredits = await prisma.userCredits.findUnique({
        where: { userId }
      });
      
      if (!userCredits || userCredits.balance < featureCost) {
        return NextResponse.json(
          { error: "Insufficient credits. Please purchase more credits to continue." },
          { status: 402 }
        );
      }
      
      // Deduct credits using a transaction
      await prisma.$transaction(async (tx) => {
        // Update user's credit balance
        await tx.userCredits.update({
          where: { userId },
          data: { balance: userCredits.balance - featureCost }
        });
        
        // Log the transaction if the table exists
        try {
          await tx.creditTransaction.create({
            data: {
              userId,
              amount: -featureCost,
              type: "usage",
              description: `Used ${featureCost} credits for resume enhancement`
            }
          });
        } catch (error) {
          // If creditTransaction table doesn't exist, just continue
          console.log("Note: Credit transaction logging skipped");
        }
      });
      
      creditInfo = {
        isGuest: false,
        creditsUsed: featureCost,
        remainingCredits: userCredits.balance - featureCost
      };
    } else {
      // Anonymous user - use cookie credits
      const cookieStore = await cookies();
      const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
      let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
      
      // Validate guest credits
      if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;
      
      if (guestCredits < featureCost) {
        return NextResponse.json(
          { 
            error: "You've used all your free credits. Sign up to get 50 more free credits!",
            requiresSignup: true
          },
          { status: 403 }
        );
      }
      
      // Update guest credits
      const updatedCredits = guestCredits - featureCost;
      cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      creditInfo = {
        isGuest: true,
        creditsUsed: featureCost,
        remainingCredits: updatedCredits
      };
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Extract text from DOCX
    let plainText: string;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer: buffer as any });
      plainText = result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      return NextResponse.json({ error: "Failed to parse DOCX file" }, { status: 500 });
    }

    const prompt = `Improve this resume:\n\n${plainText}`;

    // Create a custom header to send credit info with the stream
    const creditInfoHeader = JSON.stringify(creditInfo);

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
        // First, send the credit info as a special message
        controller.enqueue(encoder.encode(`CREDIT_INFO:${creditInfoHeader}\n\n`));
        
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
  } catch (error) {
    console.error("Error enhancing resume:", error);
    return NextResponse.json({ error: "Failed to enhance resume" }, { status: 500 });
  }
}