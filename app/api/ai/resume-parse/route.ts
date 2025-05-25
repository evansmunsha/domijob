import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/utils/db";
import { auth } from "@/app/utils/auth";
import { CREDIT_COSTS } from "@/app/utils/credits";

const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

export async function POST(req: Request) {
  try {
    const featureCost = CREDIT_COSTS.file_parsing || 10;
    const session = await auth();
    const userId = session?.user?.id;

    let creditInfo: {
      isGuest: boolean;
      creditsUsed: number;
      remainingCredits: number;
    };

    // --- Authenticated users ---
    if (userId) {
      const userCredits = await prisma.userCredits.findUnique({ where: { userId } });
      if (!userCredits || userCredits.balance < featureCost) {
        return NextResponse.json({ error: "Insufficient credits." }, { status: 402 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.userCredits.update({
          where: { userId },
          data: { balance: userCredits.balance - featureCost },
        });
        try {
          await tx.creditTransaction.create({
            data: {
              userId,
              amount: -featureCost,
              type: "usage",
              description: `Used ${featureCost} credits for file parsing`,
            },
          });
        } catch {
          console.log("Credit logging skipped");
        }
      });

      creditInfo = {
        isGuest: false,
        creditsUsed: featureCost,
        remainingCredits: userCredits.balance - featureCost,
      };
    }
    // --- Guest users ---
    else {
      const cookieStore = cookies();
      const cookie = (await cookieStore).get(GUEST_CREDIT_COOKIE);
      let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
      if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

      if (guestCredits < featureCost) {
        return NextResponse.json({
          error: "You've used all your free credits. Sign up to get 50 more free credits!",
          requiresSignup: true,
        }, { status: 403 });
      }

      const updatedCredits = guestCredits - featureCost;
      (await cookieStore).set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
      });

      creditInfo = {
        isGuest: true,
        creditsUsed: featureCost,
        remainingCredits: updatedCredits,
      };
    }

    // --- Handle uploaded file directly ---
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
const arrayBuffer = await file.arrayBuffer();
let parsedText = "";

// detect by extension, not mime type
if (fileName.endsWith(".pdf")) {
  try {
    const { default: pdfParse } = await import("pdf-parse");
    const pdfData = await pdfParse(Buffer.from(arrayBuffer));
    parsedText = pdfData.text;
  } catch (e) {
    console.error("PDF parse error:", e);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
} else if (fileName.endsWith(".docx")) {
  try {
    const { extractRawText } = await import("mammoth");
    const result = await extractRawText({ arrayBuffer });
    parsedText = result.value;
  } catch (e) {
    console.error("DOCX parse error:", e);
    return NextResponse.json({ error: "Failed to parse DOCX" }, { status: 500 });
  }
} else {
  return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
}

    parsedText = parsedText.replace(/\s+/g, " ").trim();

    return NextResponse.json({
      text: parsedText,
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
      isGuest: creditInfo.isGuest,
    });
  } catch (err: any) {
    console.error("Top-level error:", err);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
