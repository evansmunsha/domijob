import { GUEST_CREDIT_COOKIE, handleCreditCharge } from "@/app/utils/credits"
import { NextResponse } from "next/server"
import mammoth from "mammoth"

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json()
    if (!fileUrl?.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only DOCX files are supported" }, { status: 400 })
    }

    // Credit handling
    let creditInfo
    try {
      creditInfo = await handleCreditCharge("file_parsing")
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message, requiresSignup: error.message.includes("Sign up") },
        { status: 402 }
      )
    }

    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) throw new Error(`Failed to fetch file: ${fileResponse.statusText}`)

    const fileBuffer = await fileResponse.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer })
    const text = result.value.trim()

    if (!text) throw new Error("Empty or corrupted DOCX file.")

    // Build response
    const response = NextResponse.json({
      text,
      creditsUsed: creditInfo.creditsUsed,
      remainingCredits: creditInfo.remainingCredits,
      isGuest: creditInfo.isGuest,
    })

    // If guest, set updated cookie
    if (creditInfo.isGuest && creditInfo.guestCreditsToSet !== undefined) {
      response.cookies.set(GUEST_CREDIT_COOKIE, creditInfo.guestCreditsToSet.toString(), {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30,
      })
    }
    

    return response
  } catch (error: any) {
    console.error("Resume parsing error:", error)
    return NextResponse.json({ error: error.message || "Failed to parse resume file" }, { status: 500 })
  }
}
