import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const fileType = file.type;
    if (!["application/pdf", "application/msword", 
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
          .includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and Word documents are supported" }, { status: 400 });
    }

    // Parse the file based on its type
    let extractedText = "";
    
    try {
      if (fileType === "application/pdf") {
        // Try-catch specifically for importing the module
        try {
          const pdfParse = (await import('pdf-parse')).default;
          
          // Parse PDF
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text;
        } catch (importError) {
          console.error("Error importing pdf-parse:", importError);
          return NextResponse.json({ error: "PDF parsing module unavailable" }, { status: 500 });
        }
      } else {
        // Dynamically import mammoth only when needed
        const mammoth = await import('mammoth');
        
        // Parse Word documents
        const arrayBuffer = await file.arrayBuffer();
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
      fileName: file.name,
      fileSize: file.size,
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