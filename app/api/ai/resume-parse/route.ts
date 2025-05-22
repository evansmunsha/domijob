import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { CREDIT_COSTS, deductCredits, getUserCredits } from "@/app/utils/credits"
import { cookies } from "next/headers"
import mammoth from "mammoth"

// Constants for anonymous credits
const GUEST_CREDIT_COOKIE = "domijob_guest_credits"
const MAX_GUEST_CREDITS = 50

// Simple function to handle credit charging for both authenticated and anonymous users
async function handleCreditCharge(featureType: string) {
  // Get credit cost for this feature
  const creditCost = CREDIT_COSTS[featureType as keyof typeof CREDIT_COSTS] || 5

  // Check if user is authenticated
  const session = await auth()
  const userId = session?.user?.id

  // Handle authenticated user
  if (userId) {
    const userCredits = await getUserCredits(userId)

    if (userCredits < creditCost) {
      throw new Error("Insufficient credits. Please purchase more credits to continue.")
    }

    // Deduct credits
    await deductCredits(userId, featureType)

    return {
      userId,
      isGuest: false,
      creditsUsed: creditCost,
      remainingCredits: userCredits - creditCost,
    }
  }

  // Handle anonymous user
  const cookieStore = await cookies()
  const cookie = cookieStore.get(GUEST_CREDIT_COOKIE)
  let guestCredits = cookie ? Number.parseInt(cookie.value) : MAX_GUEST_CREDITS

  // Validate guest credits
  if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS

  if (guestCredits < creditCost) {
    throw new Error("You've used all your free credits. Sign up to get 50 more free credits!")
  }

  // Update guest credits
  const updatedCredits = guestCredits - creditCost
  cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
    path: "/",
    httpOnly: false, // Allow client-side access
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return {
    userId: "guest",
    isGuest: true,
    creditsUsed: creditCost,
    remainingCredits: updatedCredits,
  }
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const { fileUrl } = await req.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    // Validate file type
    const isDocx = fileUrl.toLowerCase().endsWith(".docx")
    const isPdf = fileUrl.toLowerCase().endsWith(".pdf")

    if (!isDocx && !isPdf) {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 })
    }

    // Handle credit charging for both authenticated and anonymous users
    let creditInfo
    try {
      creditInfo = await handleCreditCharge("file_parsing")
    } catch (error: any) {
      return NextResponse.json(
        {
          error: error.message,
          requiresSignup: error.message.includes("Sign up to get"),
        },
        { status: 402 },
      )
    }

    // Fetch the file from the URL
    console.log("Fetching file from URL:", fileUrl)
    const fileResponse = await fetch(fileUrl)

    if (!fileResponse.ok) {
      console.error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`)
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`)
    }

    // Get file as ArrayBuffer
    const fileBuffer = await fileResponse.arrayBuffer()
    let text = ""

    // Process based on file type
    if (isDocx) {
      // Use mammoth to extract text from DOCX
      const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer })
      text = result.value
    } else  {
      // For DOCX files, we'll use a simpler approach for now
      throw new Error("Failed to parse DOCX file. The file might be corrupted or password-protected.")
      
    }

    if (!text.trim()) {
      throw new Error("Could not extract text from the file. The file might be empty or corrupted.")
    }

    // Return the parsed text with credit information
    return NextResponse.json({
      text,
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
      isGuest: creditInfo.isGuest,
    })
  } catch (error: any) {
    console.error("Resume parsing error:", error)
    return NextResponse.json({ error: error.message || "Failed to parse resume file" }, { status: 500 })
  }
}
