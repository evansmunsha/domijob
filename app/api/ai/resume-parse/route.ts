import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import mammoth from "mammoth";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { CREDIT_COSTS } from "@/app/utils/credits";
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;

export async function POST(req: NextRequest) {
  try {
    const featureCost = CREDIT_COSTS.file_parsing || 5;
    const session = await auth();
    const userId = session?.user?.id;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("❌ No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name?.toLowerCase() || "";
    if (!fileName.endsWith(".docx") && !fileName.endsWith(".pdf")) {
      console.warn("❌ Unsupported file type:", fileName);
      return NextResponse.json({ error: "Only DOCX and PDF files are supported." }, { status: 400 });
    }

    // 🔐 Handle guest credits
    const cookieStore = cookies();
    const cookie = (await cookieStore).get(GUEST_CREDIT_COOKIE);
    let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;
    if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS;

    if (guestCredits < featureCost) {
      return NextResponse.json({
        error: "You've used all your free credits. Sign up to get 50 more!",
        requiresSignup: true,
      }, { status: 403 });
    }

    // 📉 Deduct credits
    const updatedCredits = guestCredits - featureCost;
    try {
      (await cookieStore).set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (err) {
      console.warn("⚠️ Could not set guest credit cookie:", err);
    }

    // 📄 Parse file content based on type
    let plainText = "";
    try {
      const arrayBuffer = await file.arrayBuffer();

      if (fileName.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        plainText = result.value.replace(/\s+/g, " ").trim();
      } else if (fileName.endsWith(".pdf")) {
        // For PDF files, we'll use a simple text extraction
        // Note: This is a basic implementation. For production, consider using pdf-parse
        const buffer = Buffer.from(arrayBuffer);
        const text = buffer.toString('utf8');
        // Extract readable text (this is very basic)
        plainText = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();

        // If no readable text found, return error
        if (plainText.length < 50) {
          return NextResponse.json({
            error: "Could not extract text from PDF. Please try uploading a DOCX file instead."
          }, { status: 400 });
        }
      }
    } catch (err) {
      console.error("❌ File parsing failed:", err);
      return NextResponse.json({
        error: `Failed to parse ${fileName.endsWith('.pdf') ? 'PDF' : 'DOCX'} file.`
      }, { status: 500 });
    }

    if (!plainText || plainText.length < 30) {
      return NextResponse.json({ error: "Resume file is too short or empty." }, { status: 400 });
    }

    // For file parsing, we'll just return the extracted text without AI enhancement
    // This makes it faster and more reliable
    return NextResponse.json({
      success: true,
      text: plainText,
      fileName: file.name,
      fileSize: file.size,
      fileType: fileName.endsWith('.pdf') ? 'PDF' : 'DOCX',
      creditsUsed: featureCost,
      remainingCredits: updatedCredits,
      message: "File parsed successfully"
    });
  } catch (err) {
    console.error("🔥 Unhandled /resume-parse error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
