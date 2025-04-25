import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { generateAIResponse } from "@/app/utils/openai";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export async function POST(req: Request): Promise<Response> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file from form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX files are supported." },
        { status: 400 }
      );
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    console.log(`Processing ${file.type} file of size ${fileBuffer.byteLength} bytes`);

    let parsedText: string;
    let parseError: string | null = null;

    try {
      if (file.type === "application/pdf") {
        // Lazy load pdf-parse to avoid build issues
        const { default: pdfParse } = await import("pdf-parse");
        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        parsedText = pdfData.text;
        console.log("Successfully parsed PDF file");
      } else {
        // Lazy load mammoth for DOCX files
        const { extractRawText } = await import("mammoth");
        const result = await extractRawText({ arrayBuffer: fileBuffer });
        parsedText = result.value;
        console.log("Successfully parsed DOCX file");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      parseError = error instanceof Error ? error.message : "Failed to parse file";
      return NextResponse.json(
        { error: parseError },
        { status: 400 }
      );
    }

    // Clean up whitespace
    parsedText = parsedText.replace(/\s+/g, " ").trim();

    // Analyze resume with AI for initial feedback
    try {
      const analysis = await generateAIResponse(
        session.user.id ?? null,
        "resume_parse",
        "You are an expert resume analyzer. Analyze the resume text and provide initial feedback.",
        `Analyze this resume and provide:
1. ATS optimization score (0-100)
2. Key strengths
3. Areas for improvement
4. Suggested keywords

Resume text:
${parsedText}`,
        { temperature: 0.2 }
      );

      // Store parsed resume in user's profile
      await prisma.jobSeeker.update({
        where: { userId: session.user.id },
        data: { resume: parsedText },
      });
      console.log("Successfully updated user's resume in database");

      return NextResponse.json({ 
        success: true,
        text: parsedText,
        fileType: file.type,
        fileSize: file.size,
        analysis
      });

    } catch (dbError) {
      console.error("Error updating resume in database:", dbError);
      // Return parsed text even if database update fails
      return NextResponse.json({ 
        success: true,
        text: parsedText,
        fileType: file.type,
        fileSize: file.size,
        warning: "Resume was parsed but could not be saved to profile"
      });
    }

  } catch (error) {
    console.error("Unexpected error in resume-parse:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
