import { redis } from "@/app/utils/redis"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test set with expiration
    await redis.set("test", "Redis is working in production!", { ex: 60 })
    
    // Test get
    const value = await redis.get("test")
    
    // Test delete
    await redis.del("test")
    
    return NextResponse.json({ 
      success: true, 
      message: "Redis connection successful in production",
      testValue: value,
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error("Redis test failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Redis connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
} 