import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/utils/db";
import { auth } from "@/app/utils/auth";
import { CREDIT_COSTS } from "@/app/utils/credits";

const utapi = new UTApi();
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;export async function POST(req: Request) {
  try {
    // Get the feature cost
    const featureCost = CREDIT_COSTS.file_parsing || 10;
    
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
              description: `Used ${featureCost} credits for file parsing`
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
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      creditInfo = {
        isGuest: true,
        creditsUsed: featureCost,
        remainingCredits: updatedCredits
      };
    }

    // Handle file upload and parsing
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileType = file.type;
    if (
      ![
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(fileType)
    ) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const uploadResponse = await utapi.uploadFiles(file);
    if (!uploadResponse?.data?.ufsUrl) {
      console.error("Upload failed - no ufsUrl:", uploadResponse);
      return NextResponse.json(
        { error: "Failed to upload file - no URL returned" },
        { status: 500 }
      );
    }

    const fileUrl = uploadResponse.data.ufsUrl;
    const fileResponse = await fetch(fileUrl);
    const fileBuffer: ArrayBuffer = await fileResponse.arrayBuffer();

    let parsedText: string;

    if (fileType === "application/pdf") {
      try {
        const { default: pdfParse } = await import("pdf-parse");
        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        parsedText = pdfData.text;
      } catch (error) {
        console.error("PDF parse error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    } else {
      try {
        const { extractRawText } = await import("mammoth");
        const result = await extractRawText({ arrayBuffer: fileBuffer });
        parsedText = result.value;
      } catch (error) {
        console.error("DOCX parse error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    parsedText = parsedText.replace(/\s+/g, " ").trim();

    return NextResponse.json({
      text: parsedText,
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
      isGuest: creditInfo.isGuest
    });
  } catch (error: unknown) {
    console.error("Top-level error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}