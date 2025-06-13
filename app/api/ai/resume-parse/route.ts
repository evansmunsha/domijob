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
        try {
          console.log("Attempting to parse DOCX file:", file.name);
          const result = await mammoth.extractRawText({ arrayBuffer });
          console.log("Mammoth result:", {
            hasValue: !!result.value,
            valueLength: result.value?.length || 0,
            messages: result.messages?.length || 0
          });

          if (!result.value || result.value.trim().length < 10) {
            throw new Error("No text content found in DOCX file");
          }

          plainText = result.value.replace(/\s+/g, " ").trim();
          console.log("Extracted text length:", plainText.length);
        } catch (docxError) {
          console.error("DOCX parsing error:", docxError);
          return NextResponse.json({
            error: "Failed to parse DOCX file. The file might be corrupted or in an unsupported format. Please try: 1) Re-saving the file as a new DOCX, 2) Copy-pasting the text directly, or 3) Converting to a simpler format.",
            details: docxError instanceof Error ? docxError.message : "Unknown DOCX parsing error"
          }, { status: 400 });
        }
      } else if (fileName.endsWith(".pdf")) {
        // For PDF files, return a helpful error message
        return NextResponse.json({
          error: "PDF parsing is currently limited. Please try one of these options: 1) Convert your PDF to DOCX using Google Docs or online converters, 2) Copy and paste your resume text directly instead of uploading a file, 3) Save your resume as a DOCX file if possible.",
          suggestions: [
            "Convert PDF to DOCX using Google Docs (File → Open → Upload PDF → Download as DOCX)",
            "Use copy-paste method instead of file upload",
            "Try online PDF to Word converters like SmallPDF or ILovePDF"
          ]
        }, { status: 400 });
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
