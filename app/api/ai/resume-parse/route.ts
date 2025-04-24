import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import mammoth from "mammoth";
import { prisma } from "@/app/utils/db";
import { auth } from "@/app/utils/auth";
import pdfParse from "pdf-parse";

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

    // File validation
    const fileType = file.type;
    const supportedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!supportedTypes.includes(fileType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    // Upload to UploadThing
    const uploadResponse = await utapi.uploadFiles(file);
    const fileUrl = uploadResponse?.data?.ufsUrl;
    if (!fileUrl) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const fetchRes = await fetch(fileUrl);
    const arrayBuffer = await fetchRes.arrayBuffer(); // Native ArrayBuffer

    let parsedText: string;

    if (fileType === "application/pdf") {
      const pdfData = await pdfParse(Buffer.from(arrayBuffer)); // pdf-parse needs Node.js Buffer
      parsedText = pdfData.text;
    } else {
      const result = await mammoth.extractRawText({ arrayBuffer }); // mammoth needs native ArrayBuffer
      parsedText = result.value;
    }
    
    

    parsedText = parsedText.replace(/\s+/g, " ").trim();

    if (!parsedText || parsedText.length < 100) {
      return NextResponse.json({ error: "File appears empty or unparseable" }, { status: 422 });
    }

    // Store resume text
    try {
      await prisma.jobSeeker.update({
        where: { userId: session.user.id },
        data: { resume: parsedText },
      });
    } catch (dbError) {
      console.error("DB error:", dbError);
      // Not fatal –
    }

    return NextResponse.json({ text: parsedText });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
