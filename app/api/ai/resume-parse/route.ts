import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { prisma } from "@/app/utils/db";
import { auth } from "@/app/utils/auth";

const utapi = new UTApi();

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload the file
    const uploadResponse = await utapi.uploadFiles(file);
    console.log("uploadResponse:", uploadResponse);

    const ufsUrl = uploadResponse?.data?.ufsUrl;
    if (!ufsUrl) {
      return NextResponse.json({ error: "UploadThing ufsUrl missing" }, { status: 500 });
    }

    console.log("Fetching resume from:", ufsUrl);
    const fileResponse = await fetch(ufsUrl);
    console.log("Fetch status:", fileResponse.status);

    const fileBuffer: ArrayBuffer = await fileResponse.arrayBuffer();
    console.log("fileBuffer byte length:", fileBuffer.byteLength);

    let parsedText: string;

    if (file.type === "application/pdf") {
      // PDF parsing
      try {
        const { default: pdfParse }: { default: typeof import("pdf-parse") } =
          await import("pdf-parse");
        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        parsedText = pdfData.text;
      } catch (error: unknown) {
        console.error("PDF parse error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    } else {
      // DOCX parsing via Mammoth
      try {
        const { extractRawText }: typeof import("mammoth") =
          await import("mammoth");
        const result = await extractRawText({ arrayBuffer: fileBuffer });
        parsedText = result.value;
      } catch (error: unknown) {
        console.error("DOCX parse error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // Clean up whitespace
    parsedText = parsedText.replace(/\s+/g, " ").trim();

    // Store parsed resume in user's profile
    try {
      await prisma.jobSeeker.update({
        where: { userId: session.user.id },
        data: { resume: parsedText },
      });
    } catch (error: unknown) {
      console.error("Prisma update error:", error);
      // swallow—don't break the response
    }

    return NextResponse.json({ text: parsedText });
  } catch (error: unknown) {
    console.error("Unexpected error in resume-parse:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
