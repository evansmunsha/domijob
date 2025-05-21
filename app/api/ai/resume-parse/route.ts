import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/utils/db";

const utapi = new UTApi();
const GUEST_CREDIT_COOKIE = "domijob_guest_credits";
const MAX_GUEST_CREDITS = 50;
const COST_PER_REQUEST = 10;

export async function POST(req: Request) {
  try {
    // ✅ Guest credit deduction
    const cookieStore = await cookies();
    const cookie = cookieStore.get(GUEST_CREDIT_COOKIE);
    let guestCredits = cookie ? parseInt(cookie.value) : MAX_GUEST_CREDITS;

    if (guestCredits < COST_PER_REQUEST) {
      return NextResponse.json(
        { error: "You have 0 credits left. Please sign up to continue." },
        { status: 403 }
      );
    }

    guestCredits -= COST_PER_REQUEST;
    cookieStore.set(GUEST_CREDIT_COOKIE, guestCredits.toString(), {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    // ✅ Handle file
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
      creditsUsed: COST_PER_REQUEST,
      remainingCredits: guestCredits,
    });
  } catch (error: unknown) {
    console.error("Top-level error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
