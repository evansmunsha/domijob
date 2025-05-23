import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { CREDIT_COSTS, deductCredits, getUserCredits } from "@/app/utils/credits"
import { cookies } from "next/headers"
import mammoth from "mammoth"

const GUEST_CREDIT_COOKIE = "domijob_guest_credits"
const MAX_GUEST_CREDITS = 50

async function handleCreditCharge(featureType: string) {
  const creditCost = CREDIT_COSTS[featureType as keyof typeof CREDIT_COSTS] || 5
  const session = await auth()
  const userId = session?.user?.id

  if (userId) {
    const userCredits = await getUserCredits(userId)
    if (userCredits < creditCost) {
      throw new Error("Insufficient credits. Please purchase more credits to continue.")
    }
    await deductCredits(userId, featureType)
    return {
      userId,
      isGuest: false,
      creditsUsed: creditCost,
      remainingCredits: userCredits - creditCost,
    }
  }

  const cookieStore = await cookies()
  const cookie = cookieStore.get(GUEST_CREDIT_COOKIE)
  let guestCredits = cookie ? Number.parseInt(cookie.value) : MAX_GUEST_CREDITS
  if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS

  if (guestCredits < creditCost) {
    throw new Error("You've used all your free credits. Sign up to get 50 more free credits!")
  }

  const updatedCredits = guestCredits - creditCost
  cookieStore.set(GUEST_CREDIT_COOKIE, updatedCredits.toString(), {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
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
    const { fileUrl } = await req.json()

    // ✅ Check that fileUrl is provided
    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    // ✅ Extract filename from UploadThing URL and validate .docx
    const fileName = new URL(fileUrl).searchParams.get("filename")
    if (!fileName?.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only DOCX files are supported" }, { status: 400 })
    }

    // ✅ Handle credits
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

    // ✅ Fetch and parse file
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`)
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer })
    const text = result.value.trim()

    if (!text) {
      throw new Error("Could not extract text from the file. The file might be empty or corrupted.")
    }

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
