import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { CREDIT_COSTS, deductCredits, getUserCredits } from "@/app/utils/credits";
import { cookies } from "next/headers";
import mammoth from "mammoth";

const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

export async function POST(req: Request) {
  try {
    // Get the file from multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return NextResponse.json({ error: "Only DOCX files are supported" }, { status: 400 });
    }

    // Step 1: Handle credits
    const creditCost = CREDIT_COSTS.file_parsing || 5;
    const session = await auth();
    const userId = session?.user?.id;

    let remainingCredits = 0;
    if (userId) {
      const userCredits = await getUserCredits(userId);
      if (userCredits < creditCost) {
        return NextResponse.json(
          { error: "Insufficient credits. Please purchase more credits to continue." },
          { status: 402 }
        );
      }

      await deductCredits(userId, "file_parsing");
      remainingCredits = userCredits - creditCost;
    } else {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
      let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

      if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

      if (guestCredits < creditCost) {
        return NextResponse.json(
          {
            error: "You've used all your free credits. Sign up to get 50 more free credits!",
            requiresSignup: true,
          },
          { status: 402 }
        );
      }

      guestCredits -= creditCost;
      remainingCredits = guestCredits;

      // Return updated cookie
      const response = NextResponse.next();
      response.cookies.set(GUEST_CREDIT_COOKIE, guestCredits.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Step 2: Extract text using `mammoth`
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text) {
      return NextResponse.json({ error: "The uploaded file is empty or could not be parsed." }, { status: 400 });
    }

    return NextResponse.json({
      text,
      isGuest: !userId,
      creditsUsed: creditCost,
      remainingCredits,
    });
  } catch (err: any) {
    console.error("Resume parsing error:", err);
    return NextResponse.json({ error: "Something went wrong while parsing the resume." }, { status: 500 });
  }
}
