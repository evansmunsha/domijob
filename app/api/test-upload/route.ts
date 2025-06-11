import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Upload test endpoint",
    uploadthing: {
      hasSecret: !!process.env.UPLOADTHING_SECRET,
      hasAppId: !!process.env.UPLOADTHING_APP_ID,
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };

    // Test if we can read the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return NextResponse.json({
      success: true,
      file: fileInfo,
      bufferSize: buffer.length,
      canRead: buffer.length > 0,
      message: "File upload test successful"
    });

  } catch (error) {
    console.error("Upload test error:", error);
    return NextResponse.json({
      error: "Upload test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
