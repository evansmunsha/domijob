import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { prisma } from "@/app/utils/db";
import { auth } from "@/app/utils/auth";

const utapi = new UTApi();

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    
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
    console.log("Upload response:", uploadResponse);
    
    if (!uploadResponse?.data?.ufsUrl) {
      console.error("Upload failed - no ufsUrl:", uploadResponse);
      return NextResponse.json({ error: "Failed to upload file - no URL returned" }, { status: 500 });
    }

    // Get file content
    const fileUrl = uploadResponse.data.ufsUrl;
    console.log("Fetching file from URL:", fileUrl);
    
    const fileResponse = await fetch(fileUrl);
    console.log("File fetch status:", fileResponse.status);
    
    const fileBuffer = await fileResponse.arrayBuffer();
    console.log("File buffer length:", fileBuffer.byteLength);

    let parsedText;

    // Parse based on file type
    if (fileType === "application/pdf") {
      try {
        const { default: pdfParse } = await import("pdf-parse");
        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        parsedText = pdfData.text;
      } catch (error) {
        console.error("PDF parse error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    } else {
      try {
        const { default: mammoth } = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        parsedText = result.value;
      } catch (error) {
        console.error("DOCX parse error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
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
      console.error("Prisma update error:", error);
      // Continue even if storage fails
    }

    return NextResponse.json({ text: parsedText });
  } catch (error) {
    console.error("Top-level error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 