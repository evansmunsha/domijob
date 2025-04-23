import { auth } from "@/app/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id ?? null;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { fileUrl } = await req.json();
    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 });
    }
    // Fetch the file from UploadThing URL
    const fetchRes = await fetch(fileUrl);
    if (!fetchRes.ok) {
      return NextResponse.json({ error: "Failed to fetch file from URL" }, { status: 400 });
    }
    const contentType = fetchRes.headers.get("content-type") || "";
    const arrayBuffer = await fetchRes.arrayBuffer();
    let extractedText = "";
    try {
      if (contentType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf")) {
        const pdfParse = (await import('pdf-parse')).default;
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } else {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      }
    } catch (error) {
      console.error("Error parsing document:", error);
      return NextResponse.json({ error: "Failed to parse document content" }, { status: 500 });
    }

    // Clean up the text (remove excessive whitespace)
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Store the resume in the user's profile
    try {
      const jobSeeker = await prisma.jobSeeker.findUnique({
        where: { userId }
      });

      if (jobSeeker) {
        await prisma.jobSeeker.update({
          where: { userId },
          data: { resume: extractedText }
        });
      }
    } catch (error) {
      console.error("Error saving resume to profile:", error);
      // Continue anyway to return the parsed text
    }

    return NextResponse.json({ 
      text: extractedText,
      parsed: true
    });
  } catch (error) {
    console.error("Resume parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse resume document" },
      { status: 500 }
    );
  }
} 