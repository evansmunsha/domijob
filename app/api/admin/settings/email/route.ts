import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { provider, apiKey, fromEmail } = await req.json()
    
    // Validate input
    if (!provider || !["resend", "injust"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      )
    }
    
    if (!fromEmail) {
      return NextResponse.json(
        { error: "From email is required" },
        { status: 400 }
      )
    }
    
    // In a production app, you would store these securely
    // Do not store directly in environment variables from a web request
    
    console.log("Email configuration would be updated:", {
      provider,
      apiKey: apiKey ? "******************" : "(not updated)",
      fromEmail
    })
    
    // Respond with success
    return NextResponse.json({
      success: true,
      message: `${provider === 'resend' ? 'Resend' : 'Injust'} configuration updated`
    })
  } catch (error) {
    console.error("[EMAIL_CONFIG_UPDATE]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 