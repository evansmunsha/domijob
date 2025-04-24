import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import mammoth from "mammoth";
import { prisma } from "@/app/utils/db";
import { auth } from "@/app/utils/auth";
import pdfParse from "pdf-parse";

const utapi = new UTApi();

async function extractTextFromPDF(pdfBytes: ArrayBuffer): Promise<string> {
  const options = {
    max: 0, // Disable max pages limit
    pagerender: null, // Disable page rendering
    version: 'v1.10.100' // Use a specific version
  };
  
  const pdfData = await pdfParse(Buffer.from(pdfBytes), options);
  return pdfData.text;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const fileType = file.type;
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(fileType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Upload file to UploadThing
    const uploadResponse = await utapi.uploadFiles(file);
    if (!uploadResponse?.data?.ufsUrl) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get file content
    const fileUrl = uploadResponse.data.ufsUrl;
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    let parsedText: string;

    // Parse based on file type
    if (fileType === "application/pdf") {
      try {
        parsedText = await extractTextFromPDF(fileBuffer);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        return NextResponse.json(
          { error: "Failed to parse PDF. Please ensure it contains extractable text." },
          { status: 400 }
        );
      }
    } else {
      const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
      parsedText = result.value;
    }

    // Clean up text
    parsedText = parsedText.replace(/\s+/g, " ").trim();

    // Store parsed resume in user's profile
    try {
      await prisma.jobSeeker.update({
        where: { userId: session.user.id },
        data: {
          resume: parsedText
        }
      });
    } catch (error) {
      console.error("Error storing resume:", error);
      // Continue even if storage fails
    }

    return NextResponse.json({ text: parsedText });
  } catch (error) {
    console.error("Error parsing resume:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
