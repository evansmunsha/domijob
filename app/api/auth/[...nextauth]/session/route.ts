import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(null, { status: 401 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}
