import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { getUserCredits } from "@/app/utils/credits"
import { cookies } from "next/headers"

// Constants for anonymous credits
const GUEST_CREDIT_COOKIE = "domijob_guest_credits"
const MAX_GUEST_CREDITS = 50

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await auth()
    const userId = session?.user?.id

    if (userId) {
      // Get authenticated user's credits
      const credits = await getUserCredits(userId)

      return NextResponse.json({
        isGuest: false,
        credits,
      })
    }

    // Handle anonymous user
    const cookieStore = await cookies()
    const cookie = cookieStore.get(GUEST_CREDIT_COOKIE)
    let guestCredits = cookie ? Number.parseInt(cookie.value) : MAX_GUEST_CREDITS

    // Validate guest credits
    if (isNaN(guestCredits)) guestCredits = MAX_GUEST_CREDITS

    return NextResponse.json({
      isGuest: true,
      credits: guestCredits,
    })
  } catch (error) {
    console.error("Error fetching credits:", error)
    return NextResponse.json({ error: "Failed to fetch credit information" }, { status: 500 })
  }
}
