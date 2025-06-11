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
    
    const { publishableKey, secretKey, webhookSecret } = await req.json()
    
    // In a production app, you would store these securely
    // Do not store directly in environment variables from a web request
    // Instead, use a service like Vercel project settings or a secure database
    
    // For now, we'll pretend we're setting them
    console.log("Stripe keys would be updated:", {
      publishableKey: publishableKey,
      secretKey: secretKey ? "******************" : "(not updated)",
      webhookSecret: webhookSecret ? "******************" : "(not updated)"
    })
    
    // Respond with success
    return NextResponse.json({
      success: true,
      message: "Stripe configuration updated"
    })
  } catch (error) {
    console.error("[STRIPE_CONFIG_UPDATE]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 