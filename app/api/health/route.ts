import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasDatabase = true; // If we get here, DB is working
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: hasDatabase ? "connected" : "disconnected",
        openai: hasOpenAI ? "configured" : "not configured",
      }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed"
    }, { status: 500 });
  }
}
