import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { prisma } from "@/app/utils/db";
import { auth } from "@/app/utils/auth";

const utapi = new UTApi();

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
    console.log("uploadResponse:", uploadResponse);
    
    if (!uploadResponse?.data?.ufsUrl) {
      console.error("Upload failed - no ufsUrl:", uploadResponse);
      return NextResponse.json({ error: "Failed to upload file - no URL returned" }, { status: 500 });
    }

    // Get file content
    const fileUrl = uploadResponse.data.ufsUrl;
    console.log("Fetching resume from:", fileUrl);
    
    const fileResponse = await fetch(fileUrl);
    console.log("Fetch status:", fileResponse.status);
    
    const fileBuffer: ArrayBuffer = await fileResponse.arrayBuffer();
    console.log("fileBuffer byte length:", fileBuffer.byteLength);

    let parsedText: string;

    // Parse based on file type
    if (fileType === "application/pdf") {
      try {
        const { default: pdfParse }: { default: typeof import("pdf-parse") } = await import("pdf-parse");
        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        parsedText = pdfData.text;
      } catch (error: unknown) {
        console.error("PDF parse error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    } else {
      try {
        const { extractRawText } = await import("mammoth");
        const result = await extractRawText({ arrayBuffer: fileBuffer });
        parsedText = result.value;
      } catch (error: unknown) {
        console.error("DOCX parse error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
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
    } catch (error: unknown) {
      console.error("Prisma update error:", error);
      // Continue even if storage fails
    }

    return NextResponse.json({ text: parsedText });
  } catch (error: unknown) {
    console.error("Top-level error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
