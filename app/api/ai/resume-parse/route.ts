import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";

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

    // Validate file type
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX files are supported." },
        { status: 400 }
      );
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    console.log(`Processing ${file.type} file of size ${fileBuffer.byteLength} bytes`);

    let parsedText: string;

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
    } catch (parseError) {
      console.error("Error parsing file:", parseError);
      return NextResponse.json(
        { error: "Failed to parse file. Please ensure it's a valid PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Clean up whitespace
    parsedText = parsedText.replace(/\s+/g, " ").trim();

    // Store parsed resume in user's profile
    try {
      await prisma.jobSeeker.update({
        where: { userId: session.user.id },
        data: { resume: parsedText },
      });
      console.log("Successfully updated user's resume in database");
    } catch (dbError) {
      console.error("Error updating resume in database:", dbError);
      // Continue with response even if database update fails
    }

    return NextResponse.json({ 
      success: true,
      text: parsedText,
      fileType: file.type,
      fileSize: file.size
    });

  } catch (error) {
    console.error("Unexpected error in resume-parse:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
